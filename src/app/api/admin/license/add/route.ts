import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { licenseKeysCollection, subscriptionsCollection, usersCollection } from "@/lib/db";
import { computeNextPeriodEnd } from "@/lib/subscription";

// Manually add a license key (e.g. when a payment webhook failed to store it)
// and make sure the buyer has an active subscription so the site/extension
// both grant premium access.
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const plan = body.plan;
  const paymentId = String(body.paymentId || "").trim() || null;

  if (!key || !/^\S+@\S+\.\S+$/.test(email) || (plan !== "lifetime" && plan !== "monthly")) {
    return NextResponse.json({ error: "Valid email, plan and license key are required." }, { status: 400 });
  }

  const licenseKeys = await licenseKeysCollection();
  if (await licenseKeys.findOne({ key })) {
    return NextResponse.json({ error: "That license key already exists." }, { status: 409 });
  }

  const now = new Date();
  await licenseKeys.insertOne({
    key, email, plan, status: "active",
    // Matches the key to its subscription; also the idempotency/revoke link.
    ...(paymentId ? { dodoId: paymentId } : {}),
    createdAt: now, updatedAt: now,
  });

  // Find or create the buyer's account (password-less if they never signed up).
  const users = await usersCollection();
  let user = await users.findOne({ email });
  if (!user) {
    const res = await users.insertOne({ email, downloadsUsed: 0, createdAt: now, updatedAt: now });
    user = { _id: res.insertedId, email, downloadsUsed: 0, createdAt: now, updatedAt: now };
  }

  // Never downgrade an active lifetime customer with a monthly key.
  const subscriptions = await subscriptionsCollection();
  const userId = user._id!.toString();
  const existing = await subscriptions.findOne({ userId });
  if (!(existing?.plan === "lifetime" && existing.status === "active" && plan === "monthly")) {
    await subscriptions.updateOne(
      { userId },
      {
        $set: {
          status: "active", plan,
          ...(paymentId ? { dodoId: paymentId } : {}),
          currentPeriodEnd: plan === "monthly" ? computeNextPeriodEnd(now) : null,
          updatedAt: now,
        },
        $setOnInsert: { userId, createdAt: now },
      },
      { upsert: true }
    );
  }

  return NextResponse.json({ success: true });
}
