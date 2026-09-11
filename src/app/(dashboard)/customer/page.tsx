"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  { id: "industrial", name: "Industrial Machinery", icon: "🏭" },
  { id: "electrical", name: "Electrical", icon: "⚡" },
  { id: "plumbing", name: "Plumbing", icon: "🔧" },
  { id: "hvac", name: "HVAC", icon: "❄️" },
  { id: "cnc", name: "CNC Machines", icon: "⚙️" },
  { id: "welding", name: "Welding", icon: "🔥" },
  { id: "appliance", name: "Appliance Repair", icon: "🔌" },
  { id: "it-ot", name: "IT / OT Support", icon: "💻" },
];

interface ServiceRequest {
  id: string;
  title: string;
  urgency: string;
  status: string;
  created_at: string;
}

export default function CustomerHomePage() {
  const [userName, setUserName] = useState("");
  const [activeRequests, setActiveRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile) setUserName(profile.full_name);

        const { data: requests } = await supabase
          .from("service_requests")
          .select("id, title, urgency, status, created_at")
          .eq("customer_id", user.id)
          .in("status", ["open", "matched", "accepted", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(5);

        if (requests) setActiveRequests(requests);
      }
      setLoading(false);
    }
    load();
  }, []);

  function getUrgencyBadge(urgency: string) {
    switch (urgency) {
      case "emergency":
        return <span className="badge badge-danger">🚨 Emergency</span>;
      case "same_day":
        return <span className="badge badge-warning">⚡ Same Day</span>;
      case "scheduled":
        return <span className="badge badge-neutral">📅 Scheduled</span>;
      default:
        return null;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return <span className="badge badge-accent">Open</span>;
      case "matched":
        return <span className="badge badge-warning">Matched</span>;
      case "accepted":
        return <span className="badge badge-success">Accepted</span>;
      case "in_progress":
        return <span className="badge badge-accent">In Progress</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div className="page-header">
        <h1>
          Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p>Find verified technicians for any repair or maintenance need.</p>
      </div>

      {/* Report Breakdown CTA */}
      <Link
        href="/customer/request/new"
        className="card card-clickable"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
          borderColor: "var(--accent)",
          background: "var(--accent-light)",
          textDecoration: "none",
          color: "var(--text)",
        }}
      >
        <span style={{ fontSize: 36 }}>🚨</span>
        <div>
          <h3 style={{ color: "var(--accent)" }}>Report Breakdown</h3>
          <p className="text-sm text-secondary">
            Get matched with a qualified technician in minutes
          </p>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "var(--font-size-xl)",
            color: "var(--accent)",
          }}
        >
          →
        </span>
      </Link>

      {/* Service Categories */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>Browse Services</h3>
        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/customer/request/new?category=${cat.id}`}
              className="category-card"
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div>
          <div className="flex-between" style={{ marginBottom: "var(--space-4)" }}>
            <h3>Active Requests</h3>
            <Link href="/customer/requests" className="btn btn-ghost btn-sm">
              View All →
            </Link>
          </div>
          <div className="stack-sm">
            {activeRequests.map((req) => (
              <Link
                key={req.id}
                href={`/customer/request/${req.id}`}
                className="card card-clickable"
                style={{ textDecoration: "none", color: "var(--text)" }}
              >
                <div className="flex-between">
                  <div>
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getUrgencyBadge(req.urgency)}
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeRequests.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <p className="text-secondary">
            No active requests. Tap &quot;Report Breakdown&quot; to get started!
          </p>
        </div>
      )}
    </div>
  );
}
