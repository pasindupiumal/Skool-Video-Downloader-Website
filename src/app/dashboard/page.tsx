import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
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
            <p className={styles.cardText}>Enable Loom and Skool download features via our extension:</p>
            <div className={styles.toolLinks}>
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className={styles.toolLinkItem}>
                <span>Skool Video Downloader</span>
                <span className={styles.extensionBadge}>Extension</span>
              </a>
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className={styles.toolLinkItem}>
                <span>Loom Video Downloader</span>
                <span className={styles.extensionBadge}>Extension</span>
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
        </div>
      </main>
    </div>
  );
}

