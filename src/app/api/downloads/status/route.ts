import { NextResponse } from "next/server";
import { BLOCKED_MESSAGE, capByIpPool, getDeviceUsage, getEffectiveFreeUsage, ipKeyFrom, isDeviceBlocked, recordDeviceNetwork } from "@/lib/freeQuota";
import { checkLicenseKey, findUserWithAccess, licenseKeyFrom, resolveUserEmail } from "@/lib/downloadAccess";

export const dynamic = 'force-dynamic';

// Read-only: reports whether this device/account/license can download and how
// many free downloads are left. Never consumes a download — that's
// /api/downloads/decrement, called only after a download succeeds.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const deviceId = url.searchParams.get("deviceId");
    const licenseKey = licenseKeyFrom(req, url.searchParams.get("licenseKey"));
    const ipKey = ipKeyFrom(req);
    // Fire-and-forget: remembers the device's network for the admin view.
    recordDeviceNetwork(deviceId, ipKey).catch(() => {});

    if (licenseKey) {
      const license = await checkLicenseKey(licenseKey, deviceId);
      if (!license.ok) {
        return NextResponse.json({
          status: license.status,
          remaining: 0,
          used: 0,
          isPremium: false,
          error: license.error,
        });
      }
      return NextResponse.json({
        status: "active",
        remaining: 999999, // unlimited
        used: 0,
        isPremium: true,
        email: license.email,
        plan: license.plan,
      });
    }

    const userEmail = await resolveUserEmail(req);
    if (userEmail) {
      const access = await findUserWithAccess(userEmail);
      if (access) {
        if (access.isPremium) {
          return NextResponse.json({
            status: "active",
            remaining: 999999, // unlimited
            used: access.user.downloadsUsed,
            isPremium: true,
            email: access.user.email,
          });
        }

        if (await isDeviceBlocked(deviceId)) {
          return blockedResponse(access.user.email);
        }

        const { used, limit } = await capByIpPool(await getEffectiveFreeUsage(access.user, deviceId), ipKey);
        return NextResponse.json({
          status: "free",
          remaining: Math.max(0, limit - used),
          used,
          limit,
          isPremium: false,
          email: access.user.email,
        });
      }
    }

    if (!deviceId) {
      return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
    }

    if (await isDeviceBlocked(deviceId)) {
      return blockedResponse();
    }

    const { used, limit } = await capByIpPool(await getDeviceUsage(deviceId), ipKey);
    return NextResponse.json({
      status: "anonymous",
      remaining: Math.max(0, limit - used),
      used,
      limit,
      isPremium: false,
    });
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// An admin blocked this device (trial abuse). The extension shows `error` to
// the user, so keep it friendly. License keys and premium accounts are checked
// before this, so paying customers are never affected.
function blockedResponse(email?: string) {
  return NextResponse.json({
    status: "blocked",
    remaining: 0,
    used: 0,
    isPremium: false,
    blocked: true,
    error: BLOCKED_MESSAGE,
    ...(email ? { email } : {}),
  });
}
