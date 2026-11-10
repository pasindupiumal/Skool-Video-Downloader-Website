import { NextResponse } from "next/server";
import crypto from "crypto";
import type Stripe from "stripe";
import { usersCollection, subscriptionsCollection, licenseKeysCollection } from "@/lib/db";
import { computeNextPeriodEnd } from "@/lib/subscription";
import { getStripe } from "@/lib/stripe";

// Stripe equivalent of the Dodo webhook. Stripe does NOT issue license keys, so
// unlike Dodo this handler mints the key itself (SVS-XXXX-XXXX-XXXX) when a
// checkout completes. Ids are stored in `stripeId` (subscription id for monthly,
// payment_intent id for lifetime) and payment/invoice ids in `paymentIds`.
//
// Events to enable on the Stripe endpoint:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   invoice.paid, customer.subscription.updated, customer.subscription.deleted,
//   charge.refunded, charge.dispute.created

type Users = Awaited<ReturnType<typeof usersCollection>>;
type Subscriptions = Awaited<ReturnType<typeof subscriptionsCollection>>;
type LicenseKeys = Awaited<ReturnType<typeof licenseKeysCollection>>;

const asId = (v: unknown): string | undefined =>
  typeof v === "string" ? v : (v as { id?: string } | null | undefined)?.id;

function generateLicenseKey(): string {
  // Unambiguous alphabet (no 0/O/1/I).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const group = () =>
    Array.from(crypto.randomBytes(4), (b) => chars[b % chars.length]).join("");
  return `SVS-${group()}-${group()}-${group()}`;
}

async function findOrCreateUser(rawEmail: string, users: Users) {
  const email = rawEmail.toLowerCase().trim();
  const now = new Date();
  let user = await users.findOne({ email });
  if (!user) {
    try {
      const res = await users.insertOne({ email, downloadsUsed: 0, createdAt: now, updatedAt: now });
      user = { _id: res.insertedId, email, downloadsUsed: 0, createdAt: now, updatedAt: now };
      console.warn(`Stripe webhook: created password-less account for ${email} (paid without a site account).`);
    } catch (err: any) {
      if (err?.code === 11000) user = await users.findOne({ email });
      else throw err;
    }
  }
  return user;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  users: Users,
  subscriptions: Subscriptions,
  licenseKeys: LicenseKeys
) {
  // Delayed payment methods complete the session as "unpaid"; the money arrives
  // later via checkout.session.async_payment_succeeded.
  if (session.payment_status !== "paid") {
    console.log(`Stripe webhook: session ${session.id} not paid yet (${session.payment_status}); waiting.`);
    return;
  }

  const rawEmail = session.customer_details?.email || session.customer_email || session.metadata?.email;
  const isSubscription = session.mode === "subscription";
  const plan: "lifetime" | "monthly" =
    session.metadata?.plan === "monthly" || session.metadata?.plan === "lifetime"
      ? session.metadata.plan
      : isSubscription ? "monthly" : "lifetime";
  const paymentIntentId = asId(session.payment_intent);
  const stripeId = isSubscription ? asId(session.subscription) : paymentIntentId;
  if (!rawEmail || !stripeId) {
    console.error("Stripe webhook: session missing email/id", session.id);
    return;
  }

  const user = await findOrCreateUser(rawEmail, users);
  if (!user) return;
  const userId = user._id!.toString();
  const now = new Date();

  // Lifetime always wins over a monthly activation.
  const existing = await subscriptions.findOne({ userId });
  if (existing?.plan === "lifetime" && existing.status === "active" && plan === "monthly") {
    console.log(`Stripe webhook: ${user.email} already has lifetime access; ignoring monthly activation.`);
    return;
  }

  await subscriptions.updateOne(
    { userId },
    {
      $set: {
        status: "active",
        plan,
        stripeId,
        ...(asId(session.customer) ? { stripeCustomerId: asId(session.customer) } : {}),
        currentPeriodEnd: plan === "monthly" ? computeNextPeriodEnd(now) : null,
        updatedAt: now,
      },
      // This purchase now owns the record. Drop any Dodo id so a late Dodo
      // cancellation/refund for an older purchase can't cancel this one.
      $unset: { dodoId: "", cancelledAt: "" },
      ...(paymentIntentId ? { $addToSet: { paymentIds: paymentIntentId } } : {}),
      $setOnInsert: { userId, createdAt: now },
    },
    { upsert: true }
  );

  // Idempotent: a retried delivery finds the key minted the first time.
  if (await licenseKeys.findOne({ stripeId })) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await licenseKeys.insertOne({
        key: generateLicenseKey(),
        email: user.email,
        plan,
        status: "active",
        stripeId,
        createdAt: now,
        updatedAt: now,
      });
      return;
    } catch (err: any) {
      if (err?.code !== 11000) throw err; // key collision → retry with a new key
    }
  }
  throw new Error(`Could not mint a unique license key for ${stripeId}`);
}

// Revokes by subscription id or payment id (refunds/disputes only carry the
// latter, resolved through paymentIds).
async function revoke(id: string | undefined, reason: string, licenseKeys: LicenseKeys, subscriptions: Subscriptions) {
  if (!id) return;
  const now = new Date();
  const sub = await subscriptions.findOne({ $or: [{ stripeId: id }, { paymentIds: id }] });
  const ids = Array.from(new Set([id, sub?.stripeId].filter(Boolean))) as string[];
  const keys = await licenseKeys.updateMany({ stripeId: { $in: ids } }, { $set: { status: "disabled", updatedAt: now } });
  // Only cancel the record if Stripe currently owns it; if a Dodo purchase took
  // it over, this revocation concerns an older Stripe purchase (keys only).
  const subs = sub && sub.stripeId
    ? await subscriptions.updateOne({ _id: sub._id }, { $set: { status: "cancelled", updatedAt: now } })
    : { modifiedCount: 0 };
  console.log(`${reason} for ${id}: disabled ${keys.modifiedCount} key(s), cancelled ${subs.modifiedCount} subscription(s).`);
}

// A cancelled monthly subscription keeps access until the end of the period the
// customer paid for. At a normal period-end cancellation that moment is already
// now, so this revokes right away; only a mid-period (immediate) cancellation
// gets the remaining time. Stripe's own current_period_end is used, so calendar
// months of any length are exact.
async function endOrRevoke(sub: Stripe.Subscription, reason: string, licenseKeys: LicenseKeys, subscriptions: Subscriptions) {
  const rec = await subscriptions.findOne({ stripeId: sub.id });
  if (rec && rec.plan === "monthly" && rec.status === "active") {
    // Stripe sends both updated(canceled) and deleted for one cancellation; the
    // first already pulled the expiry back, so the second must not revoke.
    if (rec.cancelledAt) return;
    const endSec = (sub as any).current_period_end ?? sub.items?.data?.[0]?.current_period_end;
    const paidThrough = typeof endSec === "number" ? new Date(endSec * 1000) : null;
    if (paidThrough && paidThrough.getTime() > Date.now()) {
      const now = new Date();
      await subscriptions.updateOne(
        { _id: rec._id },
        { $set: { currentPeriodEnd: paidThrough, cancelledAt: now, updatedAt: now } }
      );
      console.log(`${reason} for ${sub.id}: access kept until ${paidThrough.toISOString()}.`);
      return;
    }
  }
  await revoke(sub.id, reason, licenseKeys, subscriptions);
}

// Refunds/disputes on a monthly charge carry a payment_intent we never stored
// (subscription checkouts don't expose one), so fall back to the charge's
// customer and revoke every subscription that customer has.
async function revokeCharge(charge: { payment_intent?: unknown; customer?: unknown }, reason: string, licenseKeys: LicenseKeys, subscriptions: Subscriptions) {
  const pi = asId(charge.payment_intent);
  if (pi && (await subscriptions.findOne({ $or: [{ stripeId: pi }, { paymentIds: pi }] }))) {
    await revoke(pi, reason, licenseKeys, subscriptions);
    return;
  }
  const customer = asId(charge.customer);
  if (customer) {
    const subs = await getStripe().subscriptions.list({ customer, status: "all", limit: 20 });
    for (const sub of subs.data) await revoke(sub.id, reason, licenseKeys, subscriptions);
  } else {
    await revoke(pi, reason, licenseKeys, subscriptions);
  }
}

export async function POST(req: Request) {
  const payload = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — refusing to process webhook.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, req.headers.get("stripe-signature") || "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const users = await usersCollection();
    const subscriptions = await subscriptionsCollection();
    const licenseKeys = await licenseKeysCollection();

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, users, subscriptions, licenseKeys);
        break;

      // Monthly renewal paid: push the safety-net expiry out another cycle.
      // (No match on the first invoice if checkout.session.completed hasn't run yet — harmless.)
      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subId = asId(invoice.parent?.subscription_details?.subscription ?? invoice.subscription);
        if (subId) {
          await subscriptions.updateOne(
            { stripeId: subId },
            { $set: { status: "active", currentPeriodEnd: computeNextPeriodEnd(), updatedAt: new Date() } }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.status === "past_due" || sub.status === "unpaid" || sub.status === "paused") {
          // Grace period: record the status, leave the license key alone.
          await subscriptions.updateOne({ stripeId: sub.id }, { $set: { status: "on_hold", updatedAt: new Date() } });
        } else if (sub.status === "canceled") {
          await endOrRevoke(sub, "Subscription canceled", licenseKeys, subscriptions);
        } else if (sub.status === "incomplete_expired") {
          await revoke(sub.id, `Subscription ${sub.status}`, licenseKeys, subscriptions);
        }
        break;
      }

      case "customer.subscription.deleted":
        await endOrRevoke(event.data.object as Stripe.Subscription, "Subscription deleted", licenseKeys, subscriptions);
        break;

      case "charge.refunded":
        await revokeCharge(event.data.object as Stripe.Charge, "Refund", licenseKeys, subscriptions);
        break;

      case "charge.dispute.created":
        {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = asId(dispute.charge);
        const charge = chargeId ? await getStripe().charges.retrieve(chargeId) : { payment_intent: dispute.payment_intent };
        await revokeCharge(charge, "Dispute opened", licenseKeys, subscriptions);
      }
        break;

      default:
        console.log(`Unhandled Stripe webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
