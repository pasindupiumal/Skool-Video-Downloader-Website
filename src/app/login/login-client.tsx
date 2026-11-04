"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export default function LoginClient() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  // After a successful login/signup, if the user arrived via a pricing button
  // (?plan=monthly|lifetime), resume checkout for that plan instead of just
  // dropping them on the dashboard with no context.
  const continueAfterAuth = async (userEmail: string) => {
    if (plan) {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        console.error("Failed to resume checkout:", err);
      }
    }
    router.push("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      // "CredentialsSignin" is NextAuth's code for a wrong email/password;
      // anything else is a message thrown on purpose by authorize().
      setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
      setLoading(false);
    } else {
      await continueAfterAuth(email);
    }
  };

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
          country,
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
        setIsSignUp(false);
        setLoading(false);
        return;
      }

      await continueAfterAuth(email);
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
            <h1>{isSignUp ? "Create an account" : "Welcome back"}</h1>
            <p>
              {isSignUp
                ? "Sign up to start saving videos"
                : plan
                ? "Log in to continue to checkout"
                : "Login to your account to continue"}
            </p>
          </div>
          <div className="auth-body">
            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

            {isSignUp ? (
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
                  <label htmlFor="country">Country</label>
                  <select
                    id="country"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
            ) : (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
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
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
                  <span>{loading ? "Logging in..." : "Login"}</span>
                </button>
              </form>
            )}
          </div>
          <div className="auth-footer">
            <p>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="auth-link"
                style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                {isSignUp ? "Login" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
