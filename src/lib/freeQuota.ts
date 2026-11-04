import { anonymousDevicesCollection, usersCollection, UserDoc, BonusGrant } from "./db";

export const FREE_DOWNLOAD_LIMIT = 5;

// Free-tier usage is keyed by the extension install's deviceId (persisted in
// extension storage and mirrored to a long-lived cookie on our site, so it
// survives reinstalling the extension). For logged-in users the effective
// count is the higher of the account's own counter and the device's, so
// logging out, or into a fresh account, on a device that already used its
// free downloads doesn't grant a new pool of 5.
//
// The machine "fingerprint" the extension used to send (OS string + CPU core
// count + timezone) is deliberately no longer used as a key: it was so coarse
// that thousands of unrelated users shared one value — and therefore one pool
// of 5 downloads — so new users were told they'd hit the limit before their
// first download.
//
// Admins can grant extra free downloads (e.g. as a thank-you for a Chrome Web
// Store review) — see grantBonusDownloads. A grant raises the limit rather
// than resetting the counter, so usage history stays intact.

// The short code the extension popup shows users ("support code") is the
// first 8 hex characters of their deviceId, uppercased.
export const SUPPORT_CODE_LENGTH = 8;

export function supportCodeFor(deviceId: string): string {
  return deviceId.replace(/-/g, "").slice(0, SUPPORT_CODE_LENGTH).toUpperCase();
}

export interface Usage {
  used: number;
  limit: number;
}

export async function getDeviceUsage(deviceId: string | null | undefined): Promise<Usage> {
  if (!deviceId) return { used: 0, limit: FREE_DOWNLOAD_LIMIT };
  const anonymousDevices = await anonymousDevicesCollection();
  const device = await anonymousDevices.findOne({ _id: deviceId });
  return { used: device?.downloads || 0, limit: FREE_DOWNLOAD_LIMIT + (device?.bonusDownloads || 0) };
}

// Account + device combined: the higher usage and the higher bonus win, so a
// bonus granted to either the account or the device counts.
export async function getEffectiveFreeUsage(user: UserDoc, deviceId: string | null | undefined): Promise<Usage> {
  const device = await getDeviceUsage(deviceId);
  return {
    used: Math.max(user.downloadsUsed || 0, device.used),
    limit: Math.max(FREE_DOWNLOAD_LIMIT + (user.bonusDownloads || 0), device.limit),
  };
}

export type ConsumeResult = { ok: boolean; used: number; limit: number };

// Atomically uses one free download for an anonymous device. The update only
// matches while downloads < limit (5 + any bonus), so concurrent requests can
// never push the count past the limit.
export async function consumeDeviceDownload(deviceId: string): Promise<ConsumeResult> {
  const anonymousDevices = await anonymousDevicesCollection();
  const now = new Date();

  // MongoDB doesn't allow $expr in an upsert filter, so make sure the record
  // exists first, then do the conditional increment.
  await anonymousDevices.updateOne(
    { _id: deviceId },
    { $setOnInsert: { downloads: 0, createdAt: now, updatedAt: now } },
    { upsert: true }
  );

  const doc = await anonymousDevices.findOneAndUpdate(
    {
      _id: deviceId,
      $expr: { $lt: ["$downloads", { $add: [FREE_DOWNLOAD_LIMIT, { $ifNull: ["$bonusDownloads", 0] }] }] },
    },
    { $inc: { downloads: 1 }, $set: { updatedAt: now } },
    { returnDocument: "after" }
  );

  if (doc) {
    return { ok: true, used: doc.downloads, limit: FREE_DOWNLOAD_LIMIT + (doc.bonusDownloads || 0) };
  }
  return { ok: false, ...(await getDeviceUsage(deviceId)) };
}

// Uses one free download for a logged-in (non-premium) account, honoring the
// device's count too. Uses compare-and-set on the account counter so two
// simultaneous downloads can't both slip under the limit.
export async function consumeUserDownload(user: UserDoc, deviceId: string | null | undefined): Promise<ConsumeResult> {
  const users = await usersCollection();
  let current = user;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { used, limit } = await getEffectiveFreeUsage(current, deviceId);
    if (used >= limit) {
      return { ok: false, used, limit };
    }

    const newUsed = used + 1;
    const result = await users.updateOne(
      { _id: current._id, downloadsUsed: current.downloadsUsed || 0 },
      { $set: { downloadsUsed: newUsed, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      if (deviceId) {
        const anonymousDevices = await anonymousDevicesCollection();
        const now = new Date();
        await anonymousDevices.updateOne(
          { _id: deviceId },
          { $max: { downloads: newUsed }, $set: { updatedAt: now }, $setOnInsert: { createdAt: now } },
          { upsert: true }
        );
      }
      return { ok: true, used: newUsed, limit };
    }

    // Someone else changed the counter in between — re-read and retry.
    const fresh = await users.findOne({ _id: current._id });
    if (!fresh) break;
    current = fresh;
  }

  return { ok: false, used: FREE_DOWNLOAD_LIMIT, limit: FREE_DOWNLOAD_LIMIT };
}

// Adds `amount` extra free downloads to an account (by email) or an anonymous
// install (by the support code shown in the extension popup).
export async function grantBonusDownloads(
  target: { email: string } | { deviceId: string },
  amount: number,
  reason: string
): Promise<boolean> {
  const grant: BonusGrant = { amount, reason, grantedAt: new Date() };
  const update = {
    $inc: { bonusDownloads: amount },
    $push: { bonusGrants: grant },
    $set: { updatedAt: new Date() },
  };

  if ("email" in target) {
    const users = await usersCollection();
    const result = await users.updateOne({ email: target.email.toLowerCase().trim() }, update);
    return result.matchedCount === 1;
  }

  const anonymousDevices = await anonymousDevicesCollection();
  const result = await anonymousDevices.updateOne({ _id: target.deviceId }, update);
  return result.matchedCount === 1;
}
