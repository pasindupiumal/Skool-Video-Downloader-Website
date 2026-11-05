"use client";

import { useState } from "react";

// Opens the Stripe billing portal for the logged-in customer via our API
// (no static login link to keep in sync with the right Stripe account).
export default function BillingPortalButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Could not open billing portal.");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", marginTop: "20px" }}>
      <button className={className} style={{ marginTop: 0, width: "100%" }} onClick={open} disabled={loading}>
        {loading ? "Opening..." : "Open Billing Portal"}
      </button>
      {error && <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}
