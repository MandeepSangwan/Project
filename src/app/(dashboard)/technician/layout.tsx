"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/technician", label: "Home", icon: "🏠" },
  { href: "/technician/jobs", label: "Jobs", icon: "📋" },
  { href: "/technician/availability", label: "Availability", icon: "🟢" },
  { href: "/technician/earnings", label: "Earnings", icon: "💰" },
  { href: "/technician/profile", label: "Profile", icon: "👤" },
];

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div>
      <nav className="navbar">
        <Link href="/technician" className="navbar-brand">
          <span className="brand-icon">🔧</span> FixFleet
          <span className="badge badge-accent" style={{ fontSize: "var(--font-size-xs)" }}>
            Technician
          </span>
        </Link>
        <div className="navbar-actions">
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </div>
      </nav>

      <main className="container page-content">{children}</main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${
              pathname === item.href ? "active" : ""
            }`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
