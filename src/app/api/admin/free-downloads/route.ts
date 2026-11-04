import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { anonymousDevicesCollection, usersCollection, BonusGrant } from "@/lib/db";
import { FREE_DOWNLOAD_LIMIT, SUPPORT_CODE_LENGTH, grantBonusDownloads, supportCodeFor } from "@/lib/freeQuota";

// Admin tool for granting extra free downloads (e.g. to users who sent a
// screenshot of their Chrome Web Store review). A target is either an account
// email or the 8-character support code the extension popup shows — the only
// way to identify a user who never signed in.

interface Match {
  kind: "account" | "device";
  id: string; // email for accounts, full deviceId for devices
  label: string;
  used: number;
  limit: number;
  grants: BonusGrant[];
}

async function findTargets(query: string): Promise<Match[]> {
  const q = query.trim();

  if (q.includes("@")) {
    const users = await usersCollection();
    const user = await users.findOne({ email: q.toLowerCase() });
    if (!user) return [];
    return [{
      kind: "account",
      id: user.email,
      label: user.email,
      used: user.downloadsUsed || 0,
      limit: FREE_DOWNLOAD_LIMIT + (user.bonusDownloads || 0),
      grants: user.bonusGrants || [],
    }];
  }

  const code = q.replace(/[^0-9a-f]/gi, "").toLowerCase();
  if (code.length < SUPPORT_CODE_LENGTH) return [];

  // Device ids are UUIDs ("a1b2c3d4-..."), and the support code is their first
  // 8 hex digits, so an anchored prefix match finds it (and uses the _id index).
  const anonymousDevices = await anonymousDevicesCollection();
  const devices = await anonymousDevices
    .find({ _id: { $regex: `^${code.slice(0, SUPPORT_CODE_LENGTH)}` } })
    .limit(5)
    .toArray();

  return devices.map((d) => ({
    kind: "device",
    id: d._id,
    label: `Device ${supportCodeFor(d._id)}`,
    used: d.downloads || 0,
    limit: FREE_DOWNLOAD_LIMIT + (d.bonusDownloads || 0),
    grants: d.bonusGrants || [],
  }));
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, query, target, amount, reason } = await request.json().catch(() => ({}));

  if (action === "lookup") {
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Enter an email or a support code" }, { status: 400 });
    }
    return NextResponse.json({ matches: await findTargets(query) });
  }

  if (action === "grant") {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      return NextResponse.json({ error: "Amount must be a whole number from 1 to 100" }, { status: 400 });
    }
    if (!target || (target.kind !== "account" && target.kind !== "device") || typeof target.id !== "string") {
      return NextResponse.json({ error: "Missing target" }, { status: 400 });
    }

    const ok = await grantBonusDownloads(
      target.kind === "account" ? { email: target.id } : { deviceId: target.id },
      n,
      typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 200) : "Chrome Web Store review"
    );
    if (!ok) {
      return NextResponse.json({ error: "User or device not found" }, { status: 404 });
    }

    const [updated] = await findTargets(target.id);
    return NextResponse.json({ success: true, match: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
