import { SubscriptionDoc } from "./db";

// A monthly subscription's billing cycle plus a grace buffer for payment
// retries / webhook delivery delay. This is deliberately generous — the
// point isn't to cut someone off the instant a charge is late, it's to
// guarantee access ends within a bounded time even if Dodo's cancellation
// webhook is delayed, retried for weeks under dunning, or never arrives at
// all. Re-computed fresh on every subscription.active/renewed event, so a
// paying customer never actually gets close to this ceiling.
const MONTHLY_PERIOD_DAYS = 30;
const GRACE_DAYS = 5;
export const MONTHLY_PERIOD_MS = (MONTHLY_PERIOD_DAYS + GRACE_DAYS) * 24 * 60 * 60 * 1000;

export function computeNextPeriodEnd(from: Date = new Date()): Date {
  return new Date(from.getTime() + MONTHLY_PERIOD_MS);
}

// The single source of truth for "does this subscription currently grant
// premium access" — used by the website dashboard, the download-quota API,
// and license-key validation, so they can't drift out of sync with each
// other the way the old duplicated-in-3-places pricing logic did.
export function isSubscriptionCurrentlyActive(
  subscription: Pick<SubscriptionDoc, "status" | "plan" | "currentPeriodEnd"> | null | undefined
): boolean {
  if (!subscription || subscription.status !== "active") return false;

  // Lifetime purchases don't have a recurring period to expire.
  if (subscription.plan === "lifetime") return true;

  // No period tracked yet (e.g. an older record from before this field
  // existed) — trust the status rather than lock someone out.
  if (!subscription.currentPeriodEnd) return true;

  return new Date(subscription.currentPeriodEnd).getTime() > Date.now();
}
