import React from "react";
import styles from "../dashboard/dashboard.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";
import { usersCollection, subscriptionsCollection, licenseKeysCollection, contactMessagesCollection } from "@/lib/db";
import { FREE_DOWNLOAD_LIMIT } from "@/lib/freeQuota";
import AdminLogoutButton from "./admin-logout-button";
import LicenseActions from "./license-actions";
import ResetPasswordButton from "./reset-password-button";
import MessageToggle from "./message-toggle";
import FreeDownloadsGrant from "./free-downloads-grant";
const BORDER = "1px solid #ebecedcc";

export default async function AdminDashboard() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  const users = await usersCollection();
  const subscriptions = await subscriptionsCollection();
  const licenseKeys = await licenseKeysCollection();
  const contactMessages = await contactMessagesCollection();

  const [userCount, activeSubscriberCount, lifetimeBuyCount, monthlyBuyCount, unreadMessageCount] = await Promise.all([
    users.countDocuments(),
    subscriptions.countDocuments({ status: "active" }),
    licenseKeys.countDocuments({ plan: "lifetime" }),
    licenseKeys.countDocuments({ plan: "monthly" }),
    contactMessages.countDocuments({ read: false }),
  ]);

  // Every purchase mints a license key, so the licenseKeys collection is the
  // purchase log — this doubles as "who bought the extension".
  const recentBuyers = (
    await licenseKeys.find({}).sort({ createdAt: -1 }).limit(50).toArray()
  ).map((lk) => ({
    id: lk._id!.toString(),
    email: lk.email,
    plan: lk.plan,
    key: lk.key,
    status: lk.status,
    createdAt: lk.createdAt,
  }));

  const activeSubs = await subscriptions.find({ status: "active" }).toArray();
  const premiumUserIds = new Set(activeSubs.map((s) => s.userId));

  const freeUsers = (await users.find({}).sort({ createdAt: -1 }).toArray())
    .filter((u) => !premiumUserIds.has(u._id!.toString()))
    .map((u) => ({
      id: u._id!.toString(),
      email: u.email,
      downloadsUsed: u.downloadsUsed || 0,
      limit: FREE_DOWNLOAD_LIMIT + (u.bonusDownloads || 0),
      remaining: Math.max(0, FREE_DOWNLOAD_LIMIT + (u.bonusDownloads || 0) - (u.downloadsUsed || 0)),
      createdAt: u.createdAt,
    }));

  const recentMessages = (
    await contactMessages.find({}).sort({ createdAt: -1 }).limit(50).toArray()
  ).map((m) => ({
    id: m._id!.toString(),
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    read: m.read,
    createdAt: m.createdAt,
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Admin Overview</h1>
          <p>Global system status and revenue monitoring.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className={styles.badge}>Administrator</div>
          <AdminLogoutButton />
        </div>
      </header>

      <div className={styles.grid}>
        <div className="premium-card">
          <h3>Total Users</h3>
          <h2 style={{ color: "#10b981", margin: "10px 0" }}>{userCount}</h2>
          <p>Accounts in system</p>
        </div>

        <div className="premium-card">
          <h3>Active Subscribers</h3>
          <h2 style={{ margin: "10px 0" }}>{activeSubscriberCount}</h2>
          <p>Currently paying customers</p>
        </div>

        <div className="premium-card">
          <h3>Lifetime Buys</h3>
          <h2 style={{ margin: "10px 0" }}>{lifetimeBuyCount}</h2>
          <p>Total lifetime plan purchases</p>
        </div>

        <div className="premium-card">
          <h3>Monthly Buys</h3>
          <h2 style={{ margin: "10px 0" }}>{monthlyBuyCount}</h2>
          <p>Total monthly plan purchases</p>
        </div>

        <div className="premium-card" style={{ border: "2px dashed #10b981" }}>
          <h3>Content Manager</h3>
          <p>Create and publish new blog guides for the community.</p>
          <a href="/admin/publish">
            <button className="button button--primary" style={{ marginTop: "16px", width: "100%" }}>
              Publish Article
            </button>
          </a>
        </div>
      </div>

      <div className="premium-card" style={{ marginTop: "32px" }}>
        <h3>Buyers ({recentBuyers.length}{recentBuyers.length === 50 ? "+" : ""})</h3>
        <p style={{ marginBottom: "16px" }}>Everyone who has purchased the extension, most recent first.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: BORDER }}>
                <th style={{ padding: "8px" }}>Email</th>
                <th style={{ padding: "8px" }}>Plan</th>
                <th style={{ padding: "8px" }}>License Key</th>
                <th style={{ padding: "8px" }}>Status</th>
                <th style={{ padding: "8px" }}>Purchased</th>
                <th style={{ padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentBuyers.map((buyer) => (
                <tr key={buyer.id} style={{ borderBottom: BORDER }}>
                  <td style={{ padding: "8px" }}>{buyer.email}</td>
                  <td style={{ padding: "8px", textTransform: "capitalize" }}>{buyer.plan}</td>
                  <td style={{ padding: "8px", fontFamily: "monospace" }}>{buyer.key}</td>
                  <td style={{ padding: "8px" }}>{buyer.status}</td>
                  <td style={{ padding: "8px" }}>{buyer.createdAt?.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <LicenseActions licenseKey={buyer.key} status={buyer.status} />
                    <ResetPasswordButton email={buyer.email} />
                  </td>
                </tr>
              ))}
              {recentBuyers.length === 0 && (
                <tr>
                  <td style={{ padding: "8px" }} colSpan={6}>No purchases yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FreeDownloadsGrant />

      <div className="premium-card" style={{ marginTop: "32px" }}>
        <h3>Free Users ({freeUsers.length})</h3>
        <p style={{ marginBottom: "16px" }}>Accounts on the free tier. Everyone gets {FREE_DOWNLOAD_LIMIT} free downloads, plus any bonus granted below.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: BORDER }}>
                <th style={{ padding: "8px" }}>Email</th>
                <th style={{ padding: "8px" }}>Downloads Used</th>
                <th style={{ padding: "8px" }}>Remaining</th>
                <th style={{ padding: "8px" }}>Joined</th>
                <th style={{ padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {freeUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: BORDER }}>
                  <td style={{ padding: "8px" }}>{u.email}</td>
                  <td style={{ padding: "8px" }}>{u.downloadsUsed}</td>
                  <td style={{ padding: "8px" }}>{u.remaining} of {u.limit}</td>
                  <td style={{ padding: "8px" }}>{u.createdAt?.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "8px" }}>
                    <ResetPasswordButton email={u.email} />
                  </td>
                </tr>
              ))}
              {freeUsers.length === 0 && (
                <tr>
                  <td style={{ padding: "8px" }} colSpan={5}>No free users.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="premium-card" style={{ marginTop: "32px" }}>
        <h3>Support Messages ({recentMessages.length}{recentMessages.length === 50 ? "+" : ""}{unreadMessageCount > 0 ? `, ${unreadMessageCount} unread` : ""})</h3>
        <p style={{ marginBottom: "16px" }}>Contact form submissions, most recent first. Reply from your own email client using the sender's address below.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentMessages.map((m) => (
            <div
              key={m.id}
              style={{
                border: BORDER,
                borderRadius: "10px",
                padding: "14px 16px",
                background: m.read ? "#fff" : "rgba(11,99,255,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <strong>{m.subject}</strong>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    {m.name} &lt;{m.email}&gt; · {m.createdAt?.toLocaleString("en-US")}
                  </div>
                </div>
                <MessageToggle id={m.id} read={m.read} />
              </div>
              <p style={{ marginTop: "10px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{m.message}</p>
            </div>
          ))}
          {recentMessages.length === 0 && <p>No messages yet.</p>}
        </div>
      </div>
    </div>
  );
}
