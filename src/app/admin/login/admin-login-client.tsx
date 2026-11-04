"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <a className="auth-logo" href="/">
              <img
                alt="Skool Video Downloader"
                width={32}
                height={32}
                src="/assets/images/img_cb47fedab1.png"
              />
              <span>Skool Video Downloader</span>
            </a>
            <h1>Admin Login</h1>
            <p>Restricted area. Authorized staff only.</p>
          </div>
          <div className="auth-body">
            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center" }}>
                {error}
              </p>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: "1.5rem" }}>
                <span>{loading ? "Logging in..." : "Login"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
