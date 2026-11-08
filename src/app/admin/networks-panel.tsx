"use client";

import { useState } from "react";

const BORDER = "1px solid #ebecedcc";

interface DeviceRow {
  id: string;
  code: string;
  used: number;
  limit: number;
  blocked: boolean;
  lastSeen?: string;
}

interface Network {
  id: string;
  poolUsed: number;
  poolLimit: number;
  devices: DeviceRow[];
}

const buttonStyle = {
  padding: "4px 10px",
  fontSize: "0.8rem",
  fontWeight: 600,
  borderRadius: "6px",
  cursor: "pointer",
  border: BORDER,
  background: "#fff",
  color: "#000",
};

// Devices grouped by the (hashed) network they use the extension from. A
// network with several devices - especially with a full pool - is the sign of
// someone creating browser profiles to farm free trials. Block a device here
// and it just sees a friendly "limit reached, contact us on Discord" message.
export default function NetworksPanel() {
  const [networks, setNetworks] = useState<Network[] | null>(null);
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

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await call({ action: "networks" });
      setNetworks(data.networks);
      if (data.networks.length === 0) {
        setMessage("No devices recorded yet. A device appears here after it downloads or opens the extension post-deploy.");
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (d: DeviceRow) => {
    const block = !d.blocked;
    const msg = block
      ? `Block device ${d.code}? They'll see a friendly "free download limit reached - contact us on Discord" message.`
      : `Unblock device ${d.code}?`;
    if (!confirm(msg)) return;
    setLoading(true);
    try {
      await call({ action: block ? "block" : "unblock", target: { id: d.id }, reason: "Trial abuse" });
      await load();
      setMessage(`Device ${d.code} ${block ? "blocked" : "unblocked"}.`);
    } catch (err: any) {
      setMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="premium-card" style={{ marginTop: "32px" }}>
      <h3>Devices by Network</h3>
      <p style={{ marginBottom: "16px" }}>
        Devices that share one network (same IP), busiest first. Several devices on one network, or a full pool, usually
        means someone is creating browser profiles to get more free trials. Network IDs are hashed - real IPs are never
        stored.
      </p>
      <button onClick={load} disabled={loading} style={{ ...buttonStyle, marginBottom: "16px" }}>
        {loading ? "..." : networks ? "Refresh" : "Load networks"}
      </button>

      {message && <p style={{ marginBottom: "12px", fontWeight: 500 }}>{message}</p>}

      {networks &&
        networks.map((n) => (
          <div key={n.id} style={{ border: BORDER, borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Network {n.id} · {n.devices.length} device(s) ·{" "}
              <span style={{ color: n.poolUsed >= n.poolLimit ? "#c62828" : undefined }}>
                pool {n.poolUsed}/{n.poolLimit}
              </span>
            </div>
            <div style={{ marginTop: "6px", fontSize: "0.85rem" }}>
              {n.devices.map((d) => (
                <div key={d.id} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "2px 0" }}>
                  <span style={{ fontFamily: "monospace" }}>{d.code}</span>
                  <span>
                    {d.used}/{d.limit} used
                  </span>
                  {d.lastSeen && <span style={{ color: "#666" }}>{new Date(d.lastSeen).toLocaleDateString()}</span>}
                  {d.blocked && <span style={{ color: "#c62828", fontWeight: 600 }}>BLOCKED</span>}
                  <button onClick={() => toggleBlock(d)} disabled={loading} style={{ ...buttonStyle, padding: "1px 8px" }}>
                    {d.blocked ? "Unblock" : "Block"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
