"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/customer", label: "Home", icon: "🏠" },
  { href: "/customer/requests", label: "My Requests", icon: "📋" },
  { href: "/customer/bookings", label: "Bookings", icon: "📅" },
  { href: "/customer/profile", label: "Profile", icon: "👤" },
];

export default function CustomerLayout({
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
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/customer" className="navbar-brand">
          <span className="brand-icon">🔧</span> FixFleet
        </Link>
        <div className="navbar-actions">
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main className="container page-content">{children}</main>

      {/* Bottom navigation (mobile) */}
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
