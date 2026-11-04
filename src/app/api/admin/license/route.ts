import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { licenseKeysCollection, subscriptionsCollection, usersCollection } from "@/lib/db";

// Revokes or reactivates a license key, and keeps the associated subscription
// (which is what actually gates dashboard/website premium access) in sync —
// see HANDOVER.md for why both need updating together.
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, action } = await request.json().catch(() => ({}));
  if (!key || (action !== "revoke" && action !== "reactivate")) {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  const licenseKeys = await licenseKeysCollection();
  const license = await licenseKeys.findOne({ key });
  if (!license) {
    return NextResponse.json({ error: "License key not found" }, { status: 404 });
  }

  const now = new Date();
  const newStatus = action === "revoke" ? "disabled" : "active";

  await licenseKeys.updateOne({ key }, { $set: { status: newStatus, updatedAt: now } });

  const users = await usersCollection();
  const user = await users.findOne({ email: license.email });
  if (user) {
    const subscriptions = await subscriptionsCollection();
    await subscriptions.updateOne(
      { userId: user._id!.toString() },
      { $set: { status: action === "revoke" ? "cancelled" : "active", updatedAt: now } }
    );
  }

  return NextResponse.json({ success: true, status: newStatus });
}
