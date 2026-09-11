"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface OpenRequest {
  id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  address: string;
  created_at: string;
}

export default function TechnicianJobsPage() {
  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "my">("open");
  const [myJobs, setMyJobs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get open requests
        const { data: requests } = await supabase
          .from("service_requests")
          .select("id, title, description, urgency, status, address, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false });

        if (requests) setOpenRequests(requests);

        // Get my jobs (bookings)
        const { data: techProfile } = await supabase
          .from("technician_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (techProfile) {
          const { data: jobs } = await supabase
            .from("bookings")
            .select(`
              id, status, estimated_cost, created_at,
              request:service_requests!bookings_request_id_fkey(title, urgency, address)
            `)
            .eq("technician_id", techProfile.id)
            .order("created_at", { ascending: false });

          if (jobs) setMyJobs(jobs);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  function getTimeSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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
        <h1>Jobs</h1>
        <p>Browse open requests or manage your assigned jobs.</p>
      </div>

      <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
        <button
          className={`tab ${filter === "open" ? "active" : ""}`}
          onClick={() => setFilter("open")}
        >
          Open Requests ({openRequests.length})
        </button>
        <button
          className={`tab ${filter === "my" ? "active" : ""}`}
          onClick={() => setFilter("my")}
        >
          My Jobs ({myJobs.length})
        </button>
      </div>

      {filter === "open" && (
        <>
          {openRequests.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <h3>No open requests</h3>
              <p>New service requests from customers will appear here.</p>
            </div>
          ) : (
            <div className="stack-sm">
              {openRequests.map((req) => (
                <div key={req.id} className="card">
                  <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
                    <p className="font-medium">{req.title}</p>
                    <div className="flex gap-2">
                      <span
                        className={`badge ${
                          req.urgency === "emergency"
                            ? "badge-danger"
                            : req.urgency === "same_day"
                            ? "badge-warning"
                            : "badge-neutral"
                        }`}
                      >
                        {req.urgency === "emergency"
                          ? "🚨 Emergency"
                          : req.urgency === "same_day"
                          ? "⚡ Same Day"
                          : "📅 Scheduled"}
                      </span>
                      <span className="text-xs text-secondary">
                        {getTimeSince(req.created_at)}
                      </span>
                    </div>
                  </div>
                  {req.description && (
                    <p
                      className="text-sm text-secondary truncate"
                      style={{ marginBottom: "var(--space-2)" }}
                    >
                      {req.description}
                    </p>
                  )}
                  <div className="flex-between">
                    <span className="text-sm text-secondary">
                      📍 {req.address || "No address provided"}
                    </span>
                    <Link
                      href={`/technician/jobs/${req.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {filter === "my" && (
        <>
          {myJobs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📅</span>
              <h3>No assigned jobs</h3>
              <p>Jobs you accept will appear here.</p>
            </div>
          ) : (
            <div className="stack-sm">
              {myJobs.map((job: any) => (
                <Link
                  key={job.id}
                  href={`/technician/jobs/${job.id}`}
                  className="card card-clickable"
                  style={{ textDecoration: "none", color: "var(--text)" }}
                >
                  <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
                    <p className="font-medium">
                      {job.request?.title || "Service Request"}
                    </p>
                    <span
                      className={`badge ${
                        job.status === "completed"
                          ? "badge-success"
                          : job.status === "cancelled" || job.status === "rejected"
                          ? "badge-neutral"
                          : "badge-accent"
                      }`}
                    >
                      {job.status === "in_progress"
                        ? "In Progress"
                        : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex-between">
                    <span className="text-sm text-secondary">
                      📍 {job.request?.address || "—"}
                    </span>
                    <span className="font-medium">₹{job.estimated_cost}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
