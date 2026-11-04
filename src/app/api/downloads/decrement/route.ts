import { NextResponse } from "next/server";
import { consumeDeviceDownload, consumeUserDownload, ConsumeResult } from "@/lib/freeQuota";
import { checkLicenseKey, findUserWithAccess, licenseKeyFrom, resolveUserEmail } from "@/lib/downloadAccess";

export const dynamic = 'force-dynamic';

// Uses one free download. The extension calls this after a download has
// actually completed, so failed downloads don't eat into the free quota.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const deviceId: string | null = body.deviceId || null;
    const licenseKey = licenseKeyFrom(req, body.licenseKey);

    // A provided license key is authoritative: if it's invalid, say so rather
    // than silently falling back to the free quota.
    if (licenseKey) {
      const license = await checkLicenseKey(licenseKey, deviceId);
      if (!license.ok) {
        return NextResponse.json({ success: false, error: license.error, remaining: 0, used: 0 }, { status: 403 });
      }
      return NextResponse.json({ success: true, status: "active", remaining: 999999, used: 0 });
    }

    const userEmail = await resolveUserEmail(req);
    if (userEmail) {
      const access = await findUserWithAccess(userEmail);
      if (access) {
        if (access.isPremium) {
          return NextResponse.json({ success: true, status: "active", remaining: 999999, used: access.user.downloadsUsed });
        }

        const result = await consumeUserDownload(access.user, deviceId);
        return limitResponse(result, "free");
      }
    }

    if (!deviceId) {
      return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
    }

    const result = await consumeDeviceDownload(deviceId);
    return limitResponse(result, "anonymous");
  } catch (error) {
    console.error("Decrement API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function limitResponse(result: ConsumeResult, status: string) {
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: "Free download limit reached", remaining: 0, used: result.used, limit: result.limit },
      { status: 403 }
    );
  }
  return NextResponse.json({
    success: true,
    status,
    remaining: Math.max(0, result.limit - result.used),
    used: result.used,
    limit: result.limit,
  });
}
