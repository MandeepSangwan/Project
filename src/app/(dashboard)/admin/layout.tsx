"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SIDEBAR_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/verification", label: "Verification Queue", icon: "✅" },
  { href: "/admin/technicians", label: "Technicians", icon: "👷" },
  { href: "/admin/requests", label: "Requests", icon: "📋" },
  { href: "/admin/categories", label: "Categories", icon: "📂" },
];

export default function AdminLayout({
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
        <Link href="/admin" className="navbar-brand">
          <span className="brand-icon">🔧</span> FixFleet
          <span
            className="badge badge-neutral"
            style={{ fontSize: "var(--font-size-xs)" }}
          >
            Admin
          </span>
        </Link>
        <div className="navbar-actions">
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${pathname === item.href ? "active" : ""}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="sidebar-content">
        <div className="container">{children}</div>
      </div>

      {/* Bottom nav for mobile */}
      <nav className="bottom-nav">
        {SIDEBAR_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? "active" : ""}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
