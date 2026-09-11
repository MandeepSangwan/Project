"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TechProfile {
  is_available: boolean;
  is_verified: boolean;
  verification_status: string;
  avg_rating: number;
  total_jobs: number;
}

interface IncomingJob {
  id: string;
  request_id: string;
  status: string;
  estimated_cost: number;
  request?: {
    title: string;
    urgency: string;
    address: string;
    created_at: string;
  };
}

export default function TechnicianHomePage() {
  const [profile, setProfile] = useState<TechProfile | null>(null);
  const [userName, setUserName] = useState("");
  const [activeJobs, setActiveJobs] = useState<IncomingJob[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get user name
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (userProfile) setUserName(userProfile.full_name);

        // Get tech profile
        const { data: tech } = await supabase
          .from("technician_profiles")
          .select("is_available, is_verified, verification_status, avg_rating, total_jobs")
          .eq("user_id", user.id)
          .single();

        if (tech) setProfile(tech);

        // Get active bookings for this technician
        const { data: techProfile } = await supabase
          .from("technician_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (techProfile) {
          const { data: jobs } = await supabase
            .from("bookings")
            .select(`
              id, request_id, status, estimated_cost,
              request:service_requests!bookings_request_id_fkey(title, urgency, address, created_at)
            `)
            .eq("technician_id", techProfile.id)
            .in("status", ["pending", "accepted", "en_route", "arrived", "in_progress"])
            .order("created_at", { ascending: false });

          if (jobs) setActiveJobs(jobs as any);

          // Today's earnings
          const today = new Date().toISOString().split("T")[0];
          const { data: completedToday } = await supabase
            .from("bookings")
            .select("final_cost")
            .eq("technician_id", techProfile.id)
            .eq("status", "completed")
            .gte("completed_at", today);

          if (completedToday) {
            const total = completedToday.reduce(
              (sum, b) => sum + (b.final_cost || 0),
              0
            );
            setTodayEarnings(total);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function toggleAvailability() {
    if (!profile) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const newStatus = !profile.is_available;
      await supabase
        .from("technician_profiles")
        .update({ is_available: newStatus })
        .eq("user_id", user.id);

      setProfile({ ...profile, is_available: newStatus });
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
      <div className="page-header">
        <h1>
          Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
      </div>

      {/* Verification status */}
      {profile && profile.verification_status === "pending" && (
        <div
          className="card"
          style={{
            marginBottom: "var(--space-4)",
            background: "var(--warning-light)",
            borderColor: "var(--warning)",
          }}
        >
          <div className="flex gap-3">
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <p className="font-medium">Verification Pending</p>
              <p className="text-sm text-secondary">
                Your profile is under review. You&apos;ll be able to accept jobs once verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile && profile.verification_status === "rejected" && (
        <div
          className="card"
          style={{
            marginBottom: "var(--space-4)",
            background: "var(--danger-light)",
            borderColor: "var(--danger)",
          }}
        >
          <div className="flex gap-3">
            <span style={{ fontSize: 24 }}>❌</span>
            <div>
              <p className="font-medium" style={{ color: "var(--danger)" }}>
                Verification Rejected
              </p>
              <p className="text-sm text-secondary">
                Please update your documents and resubmit for verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Availability toggle */}
      <div
        className="card"
        style={{
          marginBottom: "var(--space-4)",
          borderColor: profile?.is_available ? "var(--success)" : "var(--border)",
        }}
      >
        <div className="flex-between">
          <div>
            <p className="font-semibold" style={{ fontSize: "var(--font-size-lg)" }}>
              {profile?.is_available ? "🟢 You're Online" : "⚫ You're Offline"}
            </p>
            <p className="text-sm text-secondary">
              {profile?.is_available
                ? "You can receive job requests"
                : "Toggle online to start receiving jobs"}
            </p>
          </div>
          <div className="toggle-wrapper">
            <input
              type="checkbox"
              className="toggle"
              checked={profile?.is_available || false}
              onChange={toggleAvailability}
              id="availToggle"
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid-3" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <p className="stat-label">Today&apos;s Earnings</p>
          <p className="stat-value">₹{todayEarnings}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Jobs</p>
          <p className="stat-value">{profile?.total_jobs || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rating</p>
          <p className="stat-value">
            ★ {profile?.avg_rating?.toFixed(1) || "0.0"}
          </p>
        </div>
      </div>

      {/* Active jobs */}
      <div className="flex-between" style={{ marginBottom: "var(--space-4)" }}>
        <h3>Active Jobs ({activeJobs.length})</h3>
        <Link href="/technician/jobs" className="btn btn-ghost btn-sm">
          View All →
        </Link>
      </div>

      {activeJobs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <p className="text-secondary">
            No active jobs right now.{" "}
            {profile?.is_available
              ? "New requests will appear here."
              : "Go online to receive jobs."}
          </p>
        </div>
      ) : (
        <div className="stack-sm">
          {activeJobs.map((job) => (
            <Link
              key={job.id}
              href={`/technician/jobs/${job.id}`}
              className="card card-clickable"
              style={{ textDecoration: "none", color: "var(--text)" }}
            >
              <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
                <p className="font-medium">{job.request?.title}</p>
                <span
                  className={`badge ${
                    job.request?.urgency === "emergency"
                      ? "badge-danger"
                      : job.request?.urgency === "same_day"
                      ? "badge-warning"
                      : "badge-neutral"
                  }`}
                >
                  {job.request?.urgency === "emergency"
                    ? "🚨 Emergency"
                    : job.request?.urgency === "same_day"
                    ? "⚡ Same Day"
                    : "📅 Scheduled"}
                </span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-secondary">
                  📍 {job.request?.address || "No address"}
                </span>
                <span className="font-semibold">₹{job.estimated_cost}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
