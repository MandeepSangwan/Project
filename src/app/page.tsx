import Link from "next/link";

export default function HomePage() {
  return (
    <div className="auth-page">
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <span className="brand-icon">🔧</span> FixFleet
        </h1>
        <p className="text-secondary" style={{ marginBottom: "var(--space-8)" }}>
          On-demand repair &amp; maintenance marketplace.
          <br />
          Get matched with verified technicians in minutes.
        </p>
        <div className="flex-center gap-4">
          <Link href="/login" className="btn btn-primary btn-lg">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-outline btn-lg">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
