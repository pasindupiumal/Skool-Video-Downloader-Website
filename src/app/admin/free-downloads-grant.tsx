"use client";

import { useState } from "react";

const BORDER = "1px solid #ebecedcc";

interface Grant {
  amount: number;
  reason: string;
  grantedAt: string;
}

interface Match {
  kind: "account" | "device";
  id: string;
  label: string;
  used: number;
  limit: number;
  grants: Grant[];
}

const inputStyle = {
  padding: "8px 10px",
  fontSize: "0.9rem",
  borderRadius: "6px",
  border: BORDER,
};

const buttonStyle = {
  padding: "8px 14px",
  fontSize: "0.85rem",
  fontWeight: 600,
  borderRadius: "6px",
  cursor: "pointer",
  border: BORDER,
  background: "#fff",
  color: "#000",
};

// Look up a user by account email or by the support code shown in their
// extension popup, then grant extra free downloads (e.g. for a review).
export default function FreeDownloadsGrant() {
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState(5);
  const [reason, setReason] = useState("Chrome Web Store review");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const call = async (body: object) => {
    const res = await fetch("/api/admin/free-downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await call({ action: "lookup", query });
      setMatches(data.matches);
      if (data.matches.length === 0) setMessage("No account or device found for that email / code.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grant = async (match: Match) => {
    if (!confirm(`Give ${amount} extra free download(s) to ${match.label}?`)) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await call({ action: "grant", target: { kind: match.kind, id: match.id }, amount, reason });
      setMatches((prev) => (prev || []).map((m) => (m.id === match.id ? data.match : m)));
      setMessage(`Granted ${amount} download(s) to ${match.label}. They'll see it next time they open the extension.`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card" style={{ marginTop: "32px" }}>
      <h3>Grant Free Downloads</h3>
      <p style={{ marginBottom: "16px" }}>
        For users who sent a screenshot of their Chrome Web Store review. Search by their account email, or by the
        8-character support code shown in their extension popup (for users who never signed in).
      </p>

      <form onSubmit={lookup} style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="email@example.com or A1B2C3D4"
          style={{ ...inputStyle, flex: "1 1 260px" }}
        />
        <button type="submit" disabled={loading || !query.trim()} style={buttonStyle}>
          {loading ? "..." : "Find"}
        </button>
      </form>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
        <label style={{ fontSize: "0.85rem" }}>
          Downloads to add{" "}
          <input
            type="number"
            min={1}
            max={100}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            style={{ ...inputStyle, width: "80px" }}
          />
        </label>
        <label style={{ fontSize: "0.85rem", flex: "1 1 260px" }}>
          Reason{" "}
          <input value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...inputStyle, width: "70%" }} />
        </label>
      </div>

      {message && <p style={{ marginBottom: "12px", fontWeight: 500 }}>{message}</p>}

      {matches && matches.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: BORDER }}>
                <th style={{ padding: "8px" }}>User</th>
                <th style={{ padding: "8px" }}>Used / Limit</th>
                <th style={{ padding: "8px" }}>Previous grants</th>
                <th style={{ padding: "8px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} style={{ borderBottom: BORDER }}>
                  <td style={{ padding: "8px", fontFamily: m.kind === "device" ? "monospace" : undefined }}>
                    {m.label}
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>{m.kind === "account" ? "Signed-in account" : "Not signed in"}</div>
                  </td>
                  <td style={{ padding: "8px" }}>
                    {m.used} / {m.limit}
                  </td>
                  <td style={{ padding: "8px", fontSize: "0.8rem" }}>
                    {m.grants.length === 0
                      ? "None"
                      : m.grants.map((g, i) => (
                          <div key={i}>
                            +{g.amount} · {g.reason} · {new Date(g.grantedAt).toLocaleDateString()}
                          </div>
                        ))}
                  </td>
                  <td style={{ padding: "8px" }}>
                    <button onClick={() => grant(m)} disabled={loading} style={buttonStyle}>
                      Give +{amount}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
