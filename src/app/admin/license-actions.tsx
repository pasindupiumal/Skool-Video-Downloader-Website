"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LicenseActions({ licenseKey, status }: { licenseKey: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isActive = status === "active";

  const handleClick = async () => {
    if (!confirm(isActive
      ? `Revoke license ${licenseKey}? This cancels the customer's subscription immediately.`
      : `Reactivate license ${licenseKey}?`
    )) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: licenseKey, action: isActive ? "revoke" : "reactivate" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "4px 10px",
        fontSize: "0.8rem",
        fontWeight: 600,
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        border: isActive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
        background: isActive ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
        color: isActive ? "#dc2626" : "#059669",
      }}
    >
      {loading ? "..." : isActive ? "Revoke" : "Reactivate"}
    </button>
  );
}
