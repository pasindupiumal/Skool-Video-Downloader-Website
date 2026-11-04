import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession } from '@/lib/dodopayments';
import { fetchLifetimePricing } from "@/lib/pricing";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    // Checkout is always for the logged-in account — the email comes from the
    // session, not the request body, so the purchase can't be attached to an
    // address the buyer doesn't control (which would leave the paid account
    // with no password and no way to log in).
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Please log in before purchasing.' }, { status: 401 });
    }

    const limit = await rateLimit("checkout", clientIp(request.headers), 20, 60 * 60);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
    }

    const { planId } = await request.json().catch(() => ({}));
    if (planId !== 'lifetime' && planId !== 'monthly') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const dodoProductId = planId === 'lifetime'
      ? process.env.DODO_LIFETIME_PRODUCT_ID
      : process.env.DODO_MONTHLY_PRODUCT_ID;
    if (!dodoProductId) {
      console.error(`Checkout: product id env var for "${planId}" is not set.`);
      return NextResponse.json({ error: 'Checkout is not configured yet. Please contact support.' }, { status: 503 });
    }

    // The lifetime price climbs with sales, so it's computed server-side at
    // checkout time — never trusted from the client.
    const priceInDollars = planId === 'lifetime' ? (await fetchLifetimePricing()).price : undefined;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;

    const checkout = await createCheckoutSession(dodoProductId, email, baseUrl, priceInDollars);

    if (!checkout || !checkout.checkout_url) {
      const errorMessage = checkout?.error || checkout?.message || checkout?.detail || JSON.stringify(checkout);
      console.error('Dodo checkout failed:', errorMessage);
      return NextResponse.json({ error: 'Could not start checkout. Please try again or contact support.' }, { status: 502 });
    }

    return NextResponse.json({ url: checkout.checkout_url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
