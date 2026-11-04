import { getServerSession } from "next-auth/next";
import { decode } from "next-auth/jwt";
import { authOptions } from "./auth";
import { licenseKeysCollection, subscriptionsCollection, usersCollection, UserDoc } from "./db";
import { isSubscriptionCurrentlyActive } from "./subscription";

// Shared by /api/downloads/status and /api/downloads/decrement so the two
// can't disagree about who has premium access.

export type LicenseCheck =
  | { ok: true; email: string; plan: string }
  | { ok: false; status: string; error: string };

// A license key must exist, be active, be locked to this exact device (it
// binds to the first device that uses it), and — for a monthly key — have a
// subscription that hasn't lapsed. That last check is a safety net for when
// Dodo's cancellation webhook is delayed by dunning retries or never arrives.
export async function checkLicenseKey(licenseKey: string, deviceId: string | null): Promise<LicenseCheck> {
  const licenseKeys = await licenseKeysCollection();
  const license = await licenseKeys.findOne({ key: licenseKey.trim() });

  if (!license) {
    return { ok: false, status: "invalid_license", error: "Invalid license key. Please check your key or contact support." };
  }
  if (license.status !== "active") {
    return { ok: false, status: "disabled_license", error: "This license key has been suspended or disabled." };
  }

  if (!license.deviceId) {
    if (deviceId) {
      // Conditional so two devices activating at the same moment can't both win.
      const bound = await licenseKeys.updateOne(
        { _id: license._id, $or: [{ deviceId: null }, { deviceId: { $exists: false } }] },
        { $set: { deviceId, updatedAt: new Date() } }
      );
      if (bound.modifiedCount === 0) {
        const fresh = await licenseKeys.findOne({ _id: license._id });
        if (fresh?.deviceId && fresh.deviceId !== deviceId) {
          return deviceMismatch();
        }
      }
    }
  } else if (license.deviceId !== deviceId) {
    return deviceMismatch();
  }

  if (license.plan === "monthly" && license.dodoId) {
    const subscriptions = await subscriptionsCollection();
    const subscription = await subscriptions.findOne({ dodoId: license.dodoId });
    if (subscription && !isSubscriptionCurrentlyActive(subscription)) {
      return {
        ok: false,
        status: "subscription_expired",
        error: "Your monthly subscription has expired. Please renew to continue downloading.",
      };
    }
  }

  return { ok: true, email: license.email, plan: license.plan };
}

function deviceMismatch(): LicenseCheck {
  return {
    ok: false,
    status: "device_mismatch",
    error: "This license key is already active on another device. Each key is limited to 1 device. Contact support to move it.",
  };
}

// The extension can't send our site's cookies cross-origin reliably, so it
// reads the NextAuth session cookie itself and forwards it as a Bearer token.
export async function resolveUserEmail(req: Request): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) return session.user.email;

  const authHeader = req.headers.get("Authorization") || req.headers.get("x-session-token");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  if (!token || !process.env.NEXTAUTH_SECRET) return null;

  try {
    const decoded = await decode({ token, secret: process.env.NEXTAUTH_SECRET });
    return decoded?.email || null;
  } catch (err) {
    console.error("Failed to decode session token:", err);
    return null;
  }
}

export async function findUserWithAccess(email: string): Promise<{ user: UserDoc; isPremium: boolean } | null> {
  const users = await usersCollection();
  const user = await users.findOne({ email: email.toLowerCase().trim() });
  if (!user) return null;

  const subscriptions = await subscriptionsCollection();
  const subscription = await subscriptions.findOne({ userId: user._id!.toString() });
  return { user, isPremium: isSubscriptionCurrentlyActive(subscription) };
}

// License key arrives in a header (current extension) or, from older
// extension builds, the query string / body.
export function licenseKeyFrom(req: Request, fallback?: string | null): string | null {
  return req.headers.get("x-license-key") || fallback || null;
}
