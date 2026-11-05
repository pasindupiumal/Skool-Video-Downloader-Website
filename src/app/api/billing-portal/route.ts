import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { usersCollection, subscriptionsCollection } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Creates a one-time Stripe billing-portal session for the logged-in customer.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const stripe = getStripe();
    const user = await (await usersCollection()).findOne({ email });
    const sub = user ? await (await subscriptionsCollection()).findOne({ userId: user._id!.toString() }) : null;

    // Purchases made before customer ids were stored fall back to an email lookup.
    let customer = sub?.stripeCustomerId || null;
    if (!customer) {
      const found = await stripe.customers.list({ email, limit: 1 });
      customer = found.data[0]?.id || null;
    }
    if (!customer) {
      return NextResponse.json({ error: "No Stripe billing record found for this account." }, { status: 404 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(/\/$/, "");
    const portal = await stripe.billingPortal.sessions.create({ customer, return_url: `${baseUrl}/dashboard` });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json({ error: "Could not open billing portal." }, { status: 500 });
  }
}
