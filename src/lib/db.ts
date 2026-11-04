import { Collection, Db, ObjectId } from "mongodb";
import clientPromise from "./mongodb";

// An admin-granted batch of extra free downloads (e.g. for leaving a review).
export interface BonusGrant {
  amount: number;
  reason: string;
  grantedAt: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mobile?: string | null;
  country?: string;
  image?: string | null;
  emailVerified?: Date | null;
  downloadsUsed: number;
  // Extra free downloads on top of FREE_DOWNLOAD_LIMIT, granted from /admin.
  bonusDownloads?: number;
  bonusGrants?: BonusGrant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDoc {
  _id?: ObjectId;
  userId: string;
  status: string; // active, cancelled, on_hold
  plan: string; // lifetime, monthly
  dodoId?: string | null;
  // Self-computed (not read from Dodo) — when the current paid month should
  // run out. A safety net independent of whether Dodo's own cancellation/
  // dunning webhook ever arrives: see src/lib/subscription.ts.
  currentPeriodEnd?: Date | null;
  // Every Dodo payment id seen for this subscription (first charge and
  // renewals), so a refund/dispute — which only carries a payment_id — can
  // still be traced back to the subscription it belongs to.
  paymentIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseKeyDoc {
  _id?: ObjectId;
  key: string;
  email: string;
  plan: string;
  deviceId?: string | null;
  status: string; // active, disabled
  // The Dodo checkout/payment id this key was minted for — the idempotency
  // key that stops a retried webhook delivery from minting a second key for
  // the same purchase.
  dodoId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnonymousDeviceDoc {
  _id: string; // the extension install's deviceId (older records may be keyed by a machine fingerprint)
  downloads: number;
  // Legacy: deviceIds seen under an old fingerprint-keyed record.
  deviceIds?: string[];
  // Extra free downloads on top of FREE_DOWNLOAD_LIMIT, granted from /admin.
  bonusDownloads?: number;
  bonusGrants?: BonusGrant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactMessageDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export const getDbForRateLimit = getDb;

export async function usersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

export async function subscriptionsCollection(): Promise<Collection<SubscriptionDoc>> {
  const db = await getDb();
  return db.collection<SubscriptionDoc>("subscriptions");
}

export async function licenseKeysCollection(): Promise<Collection<LicenseKeyDoc>> {
  const db = await getDb();
  return db.collection<LicenseKeyDoc>("licenseKeys");
}

export async function anonymousDevicesCollection(): Promise<Collection<AnonymousDeviceDoc>> {
  const db = await getDb();
  return db.collection<AnonymousDeviceDoc>("anonymousDevices");
}

export async function contactMessagesCollection(): Promise<Collection<ContactMessageDoc>> {
  const db = await getDb();
  return db.collection<ContactMessageDoc>("contactMessages");
}
