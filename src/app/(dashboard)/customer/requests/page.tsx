"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Request {
  id: string;
  title: string;
  urgency: string;
  status: string;
  created_at: string;
}

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("service_requests")
          .select("id, title, urgency, status, created_at")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (data) setRequests(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);

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
        <h1>My Requests</h1>
        <p>Track all your service requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
        {["all", "open", "matched", "in_progress", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status}
              className={`tab ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status === "all"
                ? "All"
                : status === "in_progress"
                ? "In Progress"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📋</span>
          <h3>No requests found</h3>
          <p>
            {filter === "all"
              ? "You haven't submitted any service requests yet."
              : `No ${filter} requests.`}
          </p>
          <Link
            href="/customer/request/new"
            className="btn btn-primary"
            style={{ marginTop: "var(--space-4)" }}
          >
            Create Request
          </Link>
        </div>
      ) : (
        <div className="stack-sm">
          {filtered.map((req) => (
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
                    {new Date(req.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
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
                      ? "Emergency"
                      : req.urgency === "same_day"
                      ? "Same Day"
                      : "Scheduled"}
                  </span>
                  <span
                    className={`badge ${
                      req.status === "open"
                        ? "badge-accent"
                        : req.status === "completed"
                        ? "badge-success"
                        : req.status === "cancelled"
                        ? "badge-neutral"
                        : "badge-warning"
                    }`}
                  >
                    {req.status === "in_progress"
                      ? "In Progress"
                      : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
