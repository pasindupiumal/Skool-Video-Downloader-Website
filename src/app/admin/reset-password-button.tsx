"use client";

import { useState } from "react";

export default function ResetPasswordButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleClick = async () => {
    if (!confirm(`Reset the password for ${email}? Their current password will stop working immediately.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Reset failed");
        return;
      }
      setTempPassword(data.temporaryPassword);
    } finally {
      setLoading(false);
    }
  };

  if (tempPassword) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
        <code style={{ background: "#fafafa", border: "1px solid #ebecedcc", padding: "2px 6px", borderRadius: "4px" }}>
          {tempPassword}
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(tempPassword)}
          style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ebecedcc", cursor: "pointer" }}
        >
          Copy
        </button>
      </span>
    );
  }

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
        border: "1px solid #ebecedcc",
        background: "#fff",
        color: "#000",
      }}
    >
      {loading ? "..." : "Reset Password"}
    </button>
  );
}
