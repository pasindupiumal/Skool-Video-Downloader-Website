// Single source of truth for the lifetime plan's early-bird tiered pricing,
// used by the landing page, dashboard, and checkout — keep these in sync or
// the displayed price and the amount actually charged will drift apart.

const STARTING_PRICE = 49;
const STARTING_SALES_OFFSET = 7; // baseline sales counted before this counter existed
const PRICE_STEP = 10;
const SLOTS_PER_TIER = 10;

export interface LifetimePricing {
  activeLifetimeSales: number;
  price: number;
  slotsTaken: number;
  nextPrice: number;
}

// Tiered pricing is PAUSED: the price is held at $49 with 8/10 slots shown,
// regardless of sales. To turn the "+$10 every 10 sales" tiers back on, set
// TIERED_PRICING_ENABLED to true.
const TIERED_PRICING_ENABLED = false;
const FROZEN_PRICE = 49;
const FROZEN_SLOTS_TAKEN = 8;

export function getLifetimePricing(activeLifetimeSales: number): LifetimePricing {
  if (!TIERED_PRICING_ENABLED) {
    return {
      activeLifetimeSales,
      price: FROZEN_PRICE,
      slotsTaken: FROZEN_SLOTS_TAKEN,
      nextPrice: FROZEN_PRICE + PRICE_STEP,
    };
  }

  const totalSales = activeLifetimeSales + STARTING_SALES_OFFSET;
  const tierIndex = Math.floor(totalSales / SLOTS_PER_TIER);
  const price = STARTING_PRICE + tierIndex * PRICE_STEP;
  const slotsTaken = totalSales % SLOTS_PER_TIER;
  const nextPrice = price + PRICE_STEP;

  return { activeLifetimeSales, price, slotsTaken, nextPrice };
}

// The live price, counted from active lifetime sales. Throws if the database
// is unreachable — checkout must use this, since charging a fallback price
// could undercharge.
export async function fetchLifetimePricing(): Promise<LifetimePricing> {
  const { subscriptionsCollection } = await import("./db");
  const subscriptions = await subscriptionsCollection();
  const activeLifetimeSales = await subscriptions.countDocuments({ plan: "lifetime", status: "active" });
  return getLifetimePricing(activeLifetimeSales);
}

// Display-only variant for pages: if the database is down, show the starting
// tier instead of taking the whole page down with a 500.
//
// The homepage calls this on every request, and a cold MongoDB connection can
// take seconds, which shows up as a slow first byte. So the displayed price is
// cached briefly in memory (stale-while-revalidate). Checkout never uses this:
// it always calls fetchLifetimePricing() for the authoritative price.
const FRESH_MS = 30_000;
const STALE_MS = 5 * 60_000;
let cached: { value: LifetimePricing; at: number } | null = null;
let refreshing: Promise<void> | null = null;
let lastFailureAt = 0;
const FAILURE_BACKOFF_MS = 15_000;

function refresh(): Promise<void> {
  if (!refreshing) {
    refreshing = fetchLifetimePricing()
      .then((value) => {
        cached = { value, at: Date.now() };
        lastFailureAt = 0;
      })
      .catch((err) => {
        lastFailureAt = Date.now();
        console.error("Could not load lifetime sales count:", err);
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function fetchLifetimePricingForDisplay(): Promise<LifetimePricing> {
  const age = cached ? Date.now() - cached.at : Infinity;
  if (cached && age < FRESH_MS) return cached.value;
  if (cached && age < STALE_MS) {
    void refresh();
    return cached.value;
  }
  // Database down: don't make every page view wait on a connection timeout.
  if (!cached && lastFailureAt && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
    return getLifetimePricing(0);
  }
  await refresh();
  return cached ? cached.value : getLifetimePricing(0);
}
