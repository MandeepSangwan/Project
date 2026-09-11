"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "technician">("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        role,
        full_name: fullName,
        phone,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // If technician, redirect to onboarding; otherwise go to dashboard
      if (role === "technician") {
        router.push("/register/technician");
      } else {
        router.push("/customer");
      }
    }

    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            <span className="brand-icon">🔧</span> FixFleet
          </h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {error && (
            <div
              className="badge-danger"
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">I am a</label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`btn ${
                  role === "customer" ? "btn-primary" : "btn-outline"
                }`}
                style={{ flex: 1 }}
                onClick={() => setRole("customer")}
              >
                🏭 Customer
              </button>
              <button
                type="button"
                className={`btn ${
                  role === "technician" ? "btn-primary" : "btn-outline"
                }`}
                style={{ flex: 1 }}
                onClick={() => setRole("technician")}
              >
                🔧 Technician
              </button>
            </div>
            <span className="form-hint">
              {role === "customer"
                ? "I need repair & maintenance services"
                : "I provide repair & maintenance services"}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Creating account...
              </>
            ) : role === "technician" ? (
              "Continue to Setup"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
