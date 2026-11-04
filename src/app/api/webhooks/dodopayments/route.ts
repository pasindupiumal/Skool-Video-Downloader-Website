import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { usersCollection, subscriptionsCollection, licenseKeysCollection } from "@/lib/db";
import { computeNextPeriodEnd } from "@/lib/subscription";
import crypto from "crypto";

// Event names below are Dodo's real, confirmed catalog (from the "Add
// endpoint" screen in the Dodo dashboard). checkout.succeeded — what this
// file used to listen for — is NOT a real Dodo event and would never have
// fired; payment.succeeded (one-time purchases) and subscription.active
// (recurring) are the real equivalents.
//
// Dodo generates and emails its OWN license key to the customer on purchase
// (the license_key.created event) — this app used to also mint a second,
// different key (SVS-XXXX-XXXX-XXXX) on payment.succeeded/subscription.active,
// which meant customers had two different "license keys" and no way to know
// which one actually worked. Key generation was removed from the purchase
// path entirely; license_key.created is now the only source of truth for
// what gets stored, so it matches exactly what the customer received by
// email.
//
// Field names inside event.data are a best-effort guess, NOT confirmed
// against a real payload yet — every path that touches a purchase or a
// license key logs the raw event.data for exactly this reason. After your
// first real test purchase of each plan, check the server logs (or send
// them to me) so the field paths can be locked in with certainty.

function extractPurchaseFields(data: any) {
  const email = data.customer?.email || data.customer_email || data.email;
  const productId = data.product_id || data.product_cart?.[0]?.product_id || data.product?.id;
  const subscriptionId: string | undefined = data.subscription_id || undefined;
  const paymentId: string | undefined = data.payment_id || undefined;
  return { email, productId, subscriptionId, paymentId };
}

// Never guess "monthly" for an unknown product: a lifetime buyer misfiled as
// monthly would silently lose access after one billing period.
function planNameFromProductId(productId: string | undefined, isSubscription: boolean): "lifetime" | "monthly" {
  if (productId && productId === process.env.DODO_MONTHLY_PRODUCT_ID) return "monthly";
  if (productId && productId === process.env.DODO_LIFETIME_PRODUCT_ID) return "lifetime";
  // Unknown/missing product id: fall back on the payment's shape. The only
  // recurring product is monthly; the only one-time product is lifetime.
  return isSubscription ? "monthly" : "lifetime";
}

type Users = Awaited<ReturnType<typeof usersCollection>>;
type Subscriptions = Awaited<ReturnType<typeof subscriptionsCollection>>;
type LicenseKeys = Awaited<ReturnType<typeof licenseKeysCollection>>;

async function findOrCreateUser(rawEmail: string, users: Users) {
  const email = String(rawEmail).toLowerCase().trim();
  const now = new Date();
  let user = await users.findOne({ email });
  if (!user) {
    try {
      const insertResult = await users.insertOne({ email, downloadsUsed: 0, createdAt: now, updatedAt: now });
      user = { _id: insertResult.insertedId, email, downloadsUsed: 0, createdAt: now, updatedAt: now };
      console.warn(
        `Dodo webhook: created password-less account for ${email} (paid without a site account). ` +
        "They can't log in until you set a password via /admin → Reset password."
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        user = await users.findOne({ email }); // lost a race with another event for the same purchase
      } else {
        throw err;
      }
    }
  }
  return user;
}

// Creates/updates the user + subscription records that gate website/dashboard
// premium access. Does NOT touch license keys — see license_key.created below.
//
// Called for payment.succeeded and subscription.active. Dodo also sends
// payment.succeeded for every recurring charge of a subscription; those only
// record the payment id, and never overwrite the subscription's dodoId with a
// payment id (that would break the later subscription.cancelled lookup, which
// only carries the subscription id).
async function activatePremium(data: any, users: Users, subscriptions: Subscriptions) {
  console.log("Dodo purchase event.data (verify field names against this):", JSON.stringify(data));

  const { email: rawEmail, productId, subscriptionId, paymentId } = extractPurchaseFields(data);
  const isSubscription = Boolean(subscriptionId);
  const dodoId = subscriptionId || paymentId;
  if (!rawEmail || !dodoId) {
    console.error("Dodo webhook: could not extract email/payment id from event.data — see logged payload above.");
    return;
  }

  const user = await findOrCreateUser(rawEmail, users);
  if (!user) return;

  const now = new Date();
  const planName = planNameFromProductId(productId, isSubscription);

  // Lifetime always wins: a lifetime customer who also had (or still has) a
  // monthly subscription must not be downgraded by a monthly event.
  const existing = await subscriptions.findOne({ userId: user._id!.toString() });
  if (existing?.plan === "lifetime" && existing.status === "active" && planName === "monthly") {
    console.log(`Dodo webhook: ${user.email} already has active lifetime access; ignoring monthly activation.`);
    return;
  }

  // upsert is naturally idempotent (safe to run again for a retried webhook
  // delivery). currentPeriodEnd is only meaningful for monthly.
  await subscriptions.updateOne(
    { userId: user._id!.toString() },
    {
      $set: {
        status: "active",
        plan: planName,
        dodoId,
        currentPeriodEnd: planName === "monthly" ? computeNextPeriodEnd(now) : null,
        updatedAt: now,
      },
      ...(paymentId ? { $addToSet: { paymentIds: paymentId } } : {}),
      $setOnInsert: { userId: user._id!.toString(), createdAt: now },
    },
    { upsert: true }
  );
}

function extractLicenseKeyFields(data: any) {
  const key = data.key || data.license_key || data.code;
  const email = data.customer?.email || data.customer_email || data.email;
  const productId = data.product_id || data.product?.id;
  const isSubscription = Boolean(data.subscription_id);
  // Whatever underlying purchase this key belongs to — used to look up the
  // customer's email when license_key.created doesn't carry it directly.
  // Prefer the subscription id: that's the dodoId a monthly subscription is
  // stored under, so cancellation and the expiry safety net can find the key.
  const refId = data.subscription_id || data.payment_id || data.order_id;
  return { key, email, productId, refId, isSubscription };
}

async function storeDodoIssuedLicenseKey(
  data: any,
  licenseKeys: LicenseKeys,
  subscriptions: Subscriptions,
  users: Users
) {
  console.log("Dodo license_key.created event.data (verify field names against this):", JSON.stringify(data));

  const { key, email: directEmail, productId, refId, isSubscription } = extractLicenseKeyFields(data);
  if (!key) {
    console.error("Dodo webhook: license_key.created had no recognizable key field — see logged payload above.");
    return;
  }

  let email = directEmail ? String(directEmail).toLowerCase().trim() : null;
  if (!email && refId) {
    // Correlate back to the subscription/payment record activatePremium()
    // already created, to recover the customer's email.
    const sub = await subscriptions.findOne({ $or: [{ dodoId: refId }, { paymentIds: refId }] });
    if (sub) {
      const user = await users.findOne({ _id: new ObjectId(sub.userId) });
      email = user?.email || null;
    }
  }
  if (!email) {
    console.error(
      `Dodo webhook: could not resolve an email for license_key.created (key ${key}) — ` +
      "see logged payload above. Add the license key manually via /admin once you know who it belongs to."
    );
    return;
  }

  const now = new Date();
  try {
    await licenseKeys.insertOne({
      key,
      email,
      plan: planNameFromProductId(productId, isSubscription),
      status: "active",
      dodoId: refId,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      console.log(`License key ${key} already recorded, skipping duplicate license_key.created event.`);
    } else {
      throw err;
    }
  }
}

// Revokes access for a subscription id or payment id. Refunds and disputes
// only carry a payment_id, which for a monthly plan isn't the subscription's
// dodoId — so it's resolved through paymentIds first.
async function revokeByDodoId(
  id: string | undefined,
  reason: string,
  licenseKeys: LicenseKeys,
  subscriptions: Subscriptions
) {
  if (!id) return;
  const now = new Date();
  const sub = await subscriptions.findOne({ $or: [{ dodoId: id }, { paymentIds: id }] });
  const ids = Array.from(new Set([id, sub?.dodoId].filter(Boolean))) as string[];

  const revokedKeys = await licenseKeys.updateMany({ dodoId: { $in: ids } }, { $set: { status: "disabled", updatedAt: now } });
  const revokedSub = sub
    ? await subscriptions.updateOne({ _id: sub._id }, { $set: { status: "cancelled", updatedAt: now } })
    : { modifiedCount: 0 };
  console.log(
    `${reason} for ${id}: disabled ${revokedKeys.modifiedCount} license key(s), ` +
    `cancelled ${revokedSub.modifiedCount} subscription(s). Verify manually in /admin if this looks wrong.`
  );
}

// Standard Webhooks verification (what Dodo uses): HMAC-SHA256 over
// "{webhook-id}.{webhook-timestamp}.{raw body}", keyed with the base64-decoded
// part of the "whsec_..." secret, base64-encoded, sent as one or more
// space-separated "v1,<sig>" entries in the webhook-signature header.
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

function verifyStandardWebhook(payload: string, headers: Headers, secret: string): boolean {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret, "base64");
  const expected = Buffer.from(
    crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest("base64")
  );

  return signatureHeader.split(" ").some((entry) => {
    const [version, sig] = entry.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig);
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

export async function POST(req: Request) {
  const payload = await req.text();

  // Fail closed: without a configured secret there is no way to tell a real
  // Dodo event from a forged one, so refuse to process anything rather than
  // silently accepting unverified payloads.
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "DODO_PAYMENTS_WEBHOOK_SECRET is not set — refusing to process webhook. " +
      "Copy the signing secret from your Dodo Payments dashboard's webhook settings into .env."
    );
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (!verifyStandardWebhook(payload, req.headers, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload);

  try {
    const users = await usersCollection();
    const subscriptions = await subscriptionsCollection();
    const licenseKeys = await licenseKeysCollection();

    switch (event.type) {
      // One-time purchase (lifetime plan) succeeded — or a recurring charge of
      // a monthly subscription, which activatePremium handles without
      // clobbering the subscription record.
      case "payment.succeeded":
        await activatePremium(event.data, users, subscriptions);
        break;

      // Recurring subscription (monthly plan) became active — first charge succeeded.
      case "subscription.active":
        await activatePremium(event.data, users, subscriptions);
        break;

      // Dodo generated and emailed the customer their license key — this is
      // the only place a key gets written to our database now.
      case "license_key.created":
        await storeDodoIssuedLicenseKey(event.data, licenseKeys, subscriptions, users);
        break;

      // Recurring renewal — no new key, just keep the subscription record
      // fresh and push the self-computed expiry safety net out another cycle.
      case "subscription.renewed":
      case "subscription.unpaused":
        await subscriptions.updateOne(
          { dodoId: event.data.subscription_id || event.data.id },
          {
            $set: { status: "active", currentPeriodEnd: computeNextPeriodEnd(), updatedAt: new Date() },
            ...(event.data.payment_id ? { $addToSet: { paymentIds: event.data.payment_id } } : {}),
          }
        );
        break;

      // A lapsed subscription must also disable the license key, not just the
      // subscription record — otherwise the Chrome extension (which checks
      // the key's own status, independent of the website's subscription
      // check) would keep granting unlimited downloads to a customer who
      // stopped paying. Dodo's license keys have no expiration event of
      // their own to catch this automatically.
      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed":
        await revokeByDodoId(
          event.data.subscription_id || event.data.id,
          `Subscription ${event.type.split(".")[1]}`,
          licenseKeys,
          subscriptions
        );
        break;

      // Temporary states (payment method issue, voluntary pause) — reflect
      // status on the subscription but deliberately leave the license key
      // alone, so the extension keeps working through what's meant to be a
      // grace period rather than a hard cutoff.
      case "subscription.on_hold":
      case "subscription.paused":
      case "subscription.past_due":
        await subscriptions.updateOne(
          { dodoId: event.data.subscription_id || event.data.id },
          { $set: { status: "on_hold", updatedAt: new Date() } }
        );
        break;

      // No self-serve refunds are offered, but a chargeback/dispute can still
      // happen regardless of that policy, and a refund can still be issued
      // manually as an exception — both need to revoke access when they occur.
      case "refund.succeeded":
        await revokeByDodoId(
          event.data.payment_id || event.data.id,
          "Refund",
          licenseKeys,
          subscriptions
        );
        break;

      // Dispute opened: funds are at risk, suspend access immediately as a
      // precaution. If the dispute later resolves in your favor, reinstate
      // manually via /admin (dispute.won doesn't auto-restore, since we'd
      // rather you confirm before re-granting access).
      case "dispute.opened":
        await revokeByDodoId(
          event.data.payment_id || event.data.id,
          "Dispute opened",
          licenseKeys,
          subscriptions
        );
        break;

      // Not acted on automatically — informational only. See the console
      // logs to confirm nothing here needs a handler added.
      case "subscription.plan_changed":
      case "subscription.updated":
      case "subscription.update_payment_method":
      case "refund.failed":
      case "dispute.won":
      case "dispute.lost":
      case "dispute.cancelled":
      case "dispute.challenged":
      case "dispute.accepted":
      case "dispute.expired":
        console.log(`Dodo webhook event ${event.type} received, no automatic action taken.`, JSON.stringify(event.data));
        break;

      default:
        console.log(`Unhandled Dodo webhook event type: ${event.type}`, JSON.stringify(event.data));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
