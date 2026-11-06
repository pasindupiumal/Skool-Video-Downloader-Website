"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resumeCheckout } from "@/lib/resume-checkout";

export default function RegisterClient() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          mobile: mobile || undefined,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created, but automatic login failed. Please log in manually.");
        setLoading(false);
        return;
      }

      if (!(await resumeCheckout(plan))) {
        router.push("/dashboard");
      }
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
                alt="Video Saver for Skool"
                width={32}
                height={32}
                src="/assets/images/img_cb47fedab1.png"
              />
              <span>Video Saver for Skool</span>
            </a>
            <h1>Create an account</h1>
            <p>Sign up to start saving videos</p>
          </div>
          <div className="auth-body">
            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

            <form className="auth-form" onSubmit={handleSignUp}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    style={{ width: '100%' }}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    style={{ width: '100%' }}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="mobile">Mobile number (optional)</label>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
                <span>{loading ? "Creating account..." : "Sign up"}</span>
              </button>
            </form>
          </div>
          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link
                href={plan ? `/login?plan=${encodeURIComponent(plan)}` : "/login"}
                className="auth-link"
                style={{ textDecoration: 'underline', color: 'inherit', font: 'inherit' }}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
