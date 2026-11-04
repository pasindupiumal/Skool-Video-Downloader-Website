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

export function getLifetimePricing(activeLifetimeSales: number): LifetimePricing {
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
export async function fetchLifetimePricingForDisplay(): Promise<LifetimePricing> {
  try {
    return await fetchLifetimePricing();
  } catch (err) {
    console.error("Could not load lifetime sales count, showing starting price:", err);
    return getLifetimePricing(0);
  }
}
