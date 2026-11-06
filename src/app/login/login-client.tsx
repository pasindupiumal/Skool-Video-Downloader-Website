"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resumeCheckout } from "@/lib/resume-checkout";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

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
    } else if (!(await resumeCheckout(plan))) {
      router.push("/dashboard");
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
            <h1>Welcome back</h1>
            <p>{plan ? "Log in to continue to checkout" : "Login to your account to continue"}</p>
          </div>
          <div className="auth-body">
            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

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
          </div>
          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href={plan ? `/register?plan=${encodeURIComponent(plan)}` : "/register"}
                className="auth-link"
                style={{ textDecoration: 'underline', color: 'inherit', font: 'inherit' }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
