import { NextResponse } from "next/server";
import { getDeviceUsage, getEffectiveFreeUsage } from "@/lib/freeQuota";
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

        const { used, limit } = await getEffectiveFreeUsage(access.user, deviceId);
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

    const { used, limit } = await getDeviceUsage(deviceId);
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
