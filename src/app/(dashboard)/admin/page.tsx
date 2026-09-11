"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    pendingVerification: 0,
    verifiedTechnicians: 0,
    activeRequests: 0,
    completedJobs: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [techRes, pendingRes, verifiedRes, activeRes, completedRes, customerRes] =
        await Promise.all([
          supabase.from("technician_profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("technician_profiles")
            .select("id", { count: "exact", head: true })
            .eq("verification_status", "pending"),
          supabase
            .from("technician_profiles")
            .select("id", { count: "exact", head: true })
            .eq("is_verified", true),
          supabase
            .from("service_requests")
            .select("id", { count: "exact", head: true })
            .in("status", ["open", "matched", "accepted", "in_progress"]),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("status", "completed"),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "customer"),
        ]);

      setStats({
        totalTechnicians: techRes.count || 0,
        pendingVerification: pendingRes.count || 0,
        verifiedTechnicians: verifiedRes.count || 0,
        activeRequests: activeRes.count || 0,
        completedJobs: completedRes.count || 0,
        totalCustomers: customerRes.count || 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and key metrics.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <p className="stat-label">Total Technicians</p>
          <p className="stat-value">{stats.totalTechnicians}</p>
        </div>
        <div className="stat-card" style={{ borderColor: "var(--warning)" }}>
          <p className="stat-label">Pending Verification</p>
          <p className="stat-value" style={{ color: "var(--warning)" }}>
            {stats.pendingVerification}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Verified Technicians</p>
          <p className="stat-value" style={{ color: "var(--success)" }}>
            {stats.verifiedTechnicians}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active Requests</p>
          <p className="stat-value">{stats.activeRequests}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Completed Jobs</p>
          <p className="stat-value">{stats.completedJobs}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Customers</p>
          <p className="stat-value">{stats.totalCustomers}</p>
        </div>
      </div>
    </div>
  );
}
