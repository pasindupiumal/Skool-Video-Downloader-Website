import React from 'react';
import { CHROME_STORE_URL, DISCORD_INVITE_URL } from "@/lib/site";
import styles from './dashboard.module.css';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { usersCollection, subscriptionsCollection, licenseKeysCollection } from "@/lib/db";
import { fetchLifetimePricingForDisplay } from "@/lib/pricing";
import { isSubscriptionCurrentlyActive } from "@/lib/subscription";
import { redirect } from "next/navigation";
import DashboardNavbar from "./navbar";
import PricingSection from "./pricing-section";
import LicenseList from "./license-list";
import BillingPortalButton from "./billing-portal-button";

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const users = await usersCollection();
  const user = await users.findOne({ email: session.user.email! });

  if (!user) {
    redirect("/login");
  }

  const subscriptions = await subscriptionsCollection();
  const subscription = await subscriptions.findOne({ userId: user._id!.toString() });

  const isPremiumActive = isSubscriptionCurrentlyActive(subscription);
  // "expired" specifically flags the case where our own currentPeriodEnd
  // safety net cut off access even though Dodo's own status still says
  // active (i.e. its cancellation webhook hasn't caught up yet) — see
  // src/lib/subscription.ts.
  const subscriptionStatus = subscription
    ? (isPremiumActive ? subscription.status : (subscription.status === "active" ? "expired" : subscription.status))
    : "Free";
  // Which billing portal applies: wherever this customer actually paid. Free
  // accounts follow the currently selected checkout gateway.
  const usesStripe = subscription?.stripeId || subscription?.stripeCustomerId
    ? true
    : subscription?.dodoId ? false : process.env.PAYMENT_GATEWAY === 'stripe';
  const planName = subscription?.plan || "No Plan";
  const isFree = !isPremiumActive;

  const licenseKeysCol = await licenseKeysCollection();
  const licenseKeys = (await licenseKeysCol.find({ email: user.email! }).toArray()).map((lk) => ({
    id: lk._id!.toString(),
    key: lk.key,
    plan: lk.plan,
    deviceId: lk.deviceId ?? null,
  }));

  const { price: currentLifetimePrice, slotsTaken: currentSlotsTaken, nextPrice } = await fetchLifetimePricingForDisplay();

  return (
    <div className={styles.dashboardPage}>
      <DashboardNavbar userEmail={user.email || ''} userName={user.name} />

      <main className={styles.container}>
        <header className={styles.header}>
          <div className={styles.greetingBox}>
            <div className={styles.avatarCircle}>
              {user.name ? user.name[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
            </div>
            <div>
              <h1>Welcome back, {user.name || user.email?.split('@')[0]}</h1>
              <p>Manage your account, subscription status, and access your extension tools.</p>
            </div>
          </div>
          <div className={styles.planBadge}>{planName}</div>
        </header>

        {isFree && (
          <PricingSection 
            userEmail={user.email || ''} 
            lifetimePrice={currentLifetimePrice}
            slotsTaken={currentSlotsTaken}
            nextPrice={nextPrice}
          />
        )}

        {licenseKeys.length > 0 && <LicenseList licenseKeys={licenseKeys} />}

        <div className={styles.grid}>
          {/* Account Status Card */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.blueIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Account Status</h3>
            </div>
            <p className={styles.cardText}>
              Your subscription is currently <span className={styles.highlightText}>{subscriptionStatus}</span>.
            </p>
            <div className={styles.meta}>
              <span>Member since: {user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Downloads Card */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.purpleIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <h3>Downloads</h3>
            </div>
            <p className={styles.cardText}>Total videos archived: <strong>0</strong></p>
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
              <button className={styles.button}>Download Chrome Extension</button>
            </a>
          </div>

          {/* Tools Card */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.greenIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <h3>Pro Tools</h3>
            </div>
            <p className={styles.cardText}>Included with every paid plan:</p>
            <div className={styles.toolLinks}>
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className={styles.toolLinkItem}>
                <span>Unlimited downloads</span>
                <span className={styles.extensionBadge}>{isPremiumActive ? 'Active' : 'Pro'}</span>
              </a>
            </div>
          </div>

          {/* Billing Card */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.orangeIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h3>Billing & Invoices</h3>
            </div>
            <p className={styles.cardText}>Manage invoices, subscription status, and payment methods via {usesStripe ? 'Stripe' : 'Dodo Payments'}.</p>
            {usesStripe ? (
              <BillingPortalButton className={styles.secondaryButton} />
            ) : (
              <a href="https://customer.dodopayments.com" target="_blank" rel="noopener noreferrer" style={{ width: '100%', marginTop: '20px' }}>
                <button className={styles.secondaryButton} style={{ marginTop: 0 }}>Open Billing Portal</button>
              </a>
            )}
          </div>

          {/* Support Card */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.discordIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
              </div>
              <h3>Need Help?</h3>
            </div>
            <p className={styles.cardText}>If you have any trouble, contact us on Discord and we&apos;ll help you out.</p>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
              <button className={styles.secondaryButton}>Contact Us on Discord</button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

