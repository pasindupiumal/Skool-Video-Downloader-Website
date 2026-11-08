import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { anonymousDevicesCollection, usersCollection, AnonymousDeviceDoc, BonusGrant } from "@/lib/db";
import { FREE_DOWNLOAD_LIMIT, IP_POOL_LIMIT, SUPPORT_CODE_LENGTH, grantBonusDownloads, setDeviceBlocked, supportCodeFor } from "@/lib/freeQuota";

// Admin tool for granting extra free downloads (e.g. to users who sent a
// screenshot of their Chrome Web Store review). A target is either an account
// email or the 8-character support code the extension popup shows — the only
// way to identify a user who never signed in.

interface DeviceRow {
  id: string; // full deviceId
  code: string; // the 8-character support code the popup shows
  used: number;
  limit: number;
  blocked: boolean;
  blockReason?: string;
  lastSeen?: string;
}

interface NetworkInfo {
  id: string; // short, non-reversible label for the hashed network
  poolUsed: number;
  poolLimit: number;
  others: DeviceRow[]; // other devices seen on the same network
}

interface Match {
  kind: "account" | "device";
  id: string; // email for accounts, full deviceId for devices
  label: string;
  used: number;
  limit: number;
  grants: BonusGrant[];
  blocked?: boolean;
  blockReason?: string;
  network?: NetworkInfo | null;
}

function rowOf(d: AnonymousDeviceDoc): DeviceRow {
  return {
    id: d._id,
    code: supportCodeFor(d._id),
    used: d.downloads || 0,
    limit: FREE_DOWNLOAD_LIMIT + (d.bonusDownloads || 0),
    blocked: !!d.blocked,
    blockReason: d.blockReason,
    lastSeen: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
  };
}

const networkLabel = (ipKey: string) => ipKey.replace(/^ip:/, "").slice(0, 6).toUpperCase();

async function networkFor(d: AnonymousDeviceDoc): Promise<NetworkInfo | null> {
  if (!d.ipKey) return null;
  const anonymousDevices = await anonymousDevicesCollection();
  const [pool, others] = await Promise.all([
    anonymousDevices.findOne({ _id: d.ipKey }),
    anonymousDevices.find({ ipKey: d.ipKey, _id: { $ne: d._id } }).sort({ updatedAt: -1 }).limit(25).toArray(),
  ]);
  return { id: networkLabel(d.ipKey), poolUsed: pool?.downloads || 0, poolLimit: IP_POOL_LIMIT, others: others.map(rowOf) };
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

  return Promise.all(
    devices.map(async (d): Promise<Match> => ({
      kind: "device",
      id: d._id,
      label: `Device ${supportCodeFor(d._id)}`,
      used: d.downloads || 0,
      limit: FREE_DOWNLOAD_LIMIT + (d.bonusDownloads || 0),
      grants: d.bonusGrants || [],
      blocked: !!d.blocked,
      blockReason: d.blockReason,
      network: await networkFor(d),
    }))
  );
}

// Devices grouped by the network they were seen on, busiest networks first -
// the quickest way to spot someone spinning up profiles to farm free trials.
async function listNetworks() {
  const anonymousDevices = await anonymousDevicesCollection();
  const groups = await anonymousDevices
    .aggregate<{ _id: string; count: number }>([
      { $match: { ipKey: { $type: "string" } } },
      { $group: { _id: "$ipKey", count: { $sum: 1 }, last: { $max: "$updatedAt" } } },
      { $sort: { count: -1, last: -1 } },
      { $limit: 50 },
    ])
    .toArray();

  const ids = groups.map((g) => g._id);
  const [pools, devices] = await Promise.all([
    anonymousDevices.find({ _id: { $in: ids } }).toArray(),
    anonymousDevices.find({ ipKey: { $in: ids } }).sort({ updatedAt: -1 }).toArray(),
  ]);
  const poolUsed = new Map(pools.map((p) => [p._id, p.downloads || 0]));

  return groups.map((g) => ({
    id: networkLabel(g._id),
    poolUsed: poolUsed.get(g._id) || 0,
    poolLimit: IP_POOL_LIMIT,
    devices: devices.filter((d) => d.ipKey === g._id).map(rowOf),
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

  if (action === "networks") {
    return NextResponse.json({ networks: await listNetworks() });
  }

  if (action === "block" || action === "unblock") {
    const deviceId = target?.id;
    if (typeof deviceId !== "string" || !/^[0-9a-f-]{8,}$/i.test(deviceId)) {
      return NextResponse.json({ error: "Missing device" }, { status: 400 });
    }
    const why = typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 200) : "Trial abuse";
    await setDeviceBlocked(deviceId, action === "block", why);
    return NextResponse.json({ success: true, matches: await findTargets(deviceId) });
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
