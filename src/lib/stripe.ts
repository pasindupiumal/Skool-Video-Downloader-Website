import Stripe from "stripe";

// Lazily created so a missing key fails the request that needs it (with a clear
// log) instead of crashing the build or every route that imports this file.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (!client) client = new Stripe(key);
  return client;
}

export type PlanId = "lifetime" | "monthly";

// Creates a hosted Stripe Checkout page and returns it (use `.url`).
//
// - lifetime: one-time payment. The price climbs with sales (see
//   src/lib/pricing.ts), so the amount is sent inline via price_data rather
//   than from a fixed Stripe Price — no dashboard price to keep in sync.
// - monthly: subscription on the fixed recurring Price STRIPE_MONTHLY_PRICE_ID.
export async function createStripeCheckoutSession(opts: {
  plan: PlanId;
  userEmail: string;
  baseUrl: string;
  priceInDollars?: number;
}) {
  const { plan, userEmail, priceInDollars } = opts;
  const baseUrl = opts.baseUrl.replace(/\/$/, "");
  const stripe = getStripe();

  const common = {
    customer_email: userEmail,
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard`,
    // Webhook reads these back — the plan comes from us, never from Stripe's
    // product naming.
    metadata: { plan, email: userEmail },
  };

  if (plan === "monthly") {
    const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_MONTHLY_PRICE_ID is not set.");
    return stripe.checkout.sessions.create({
      ...common,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { plan, email: userEmail } },
    });
  }

  if (!priceInDollars) throw new Error("Lifetime checkout needs a price.");
  return stripe.checkout.sessions.create({
    ...common,
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(priceInDollars * 100),
          product_data: { name: "Skool Video Downloader — Lifetime Access" },
        },
      },
    ],
    // Always create a customer so receipts/invoices and the billing portal work.
    customer_creation: "always",
    // One-time payments have no invoice by default; create one so it shows in
    // the billing portal's invoice history.
    invoice_creation: { enabled: true },
    payment_intent_data: { metadata: { plan, email: userEmail } },
  });
}
