"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const field: React.CSSProperties = {
  padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(128,128,128,0.35)",
  background: "transparent", color: "inherit", fontSize: "0.9rem", flex: "1 1 180px", minWidth: 0,
};

export default function AddLicenseForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("lifetime");
  const [key, setKey] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/license/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, key, paymentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Could not add the license key." });
        return;
      }
      setMessage({ ok: true, text: `Added ${key.trim()} for ${email.trim()}.` });
      setEmail(""); setKey(""); setPaymentId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
      <input style={field} type="email" required placeholder="Customer email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select style={{ ...field, flex: "0 1 130px" }} value={plan} onChange={(e) => setPlan(e.target.value)}>
        <option value="lifetime">Lifetime</option>
        <option value="monthly">Monthly</option>
      </select>
      <input style={field} required placeholder="License key" value={key} onChange={(e) => setKey(e.target.value)} />
      <input style={field} placeholder="Payment ID (optional, pay_… / pi_…)" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} />
      <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Adding..." : "Add license key"}</button>
      {message && (
        <p style={{ width: "100%", margin: 0, fontSize: "0.85rem", color: message.ok ? "#059669" : "#dc2626" }}>{message.text}</p>
      )}
    </form>
  );
}
