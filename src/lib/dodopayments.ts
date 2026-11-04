export const createCheckoutSession = async (
  productId: string,
  userEmail: string,
  baseUrl: string,
  priceInDollars?: number
) => {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY || '';
  // Dodo API keys don't carry a live/test prefix you can rely on, so the
  // environment is chosen explicitly. Defaults to live in production builds.
  const mode = process.env.DODO_PAYMENTS_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode');
  const apiBase = mode === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

  const body: any = {
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
      }
    ],
    customer: {
      email: userEmail,
    },
    return_url: `${baseUrl.replace(/\/$/, '')}/dashboard?checkout=success`,
  };

  // Per-checkout price override for the tiered lifetime plan. Dodo only
  // honors this when the product is configured as "Pay What You Want" in the
  // dashboard (with a minimum at or below the starting price); otherwise the
  // product's fixed price is charged.
  if (priceInDollars) {
    body.product_cart[0].amount = Math.round(priceInDollars * 100);
  }

  const response = await fetch(`${apiBase}/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Dodo Payments API Error:", response.status, data);
  }

  return data;
};
