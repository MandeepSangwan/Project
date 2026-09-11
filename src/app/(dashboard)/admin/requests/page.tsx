"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Request {
  id: string;
  title: string;
  urgency: string;
  status: string;
  address: string;
  created_at: string;
  customer?: any;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("service_requests")
        .select(`
          id, title, urgency, status, address, created_at,
          customer:profiles!service_requests_customer_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) setRequests(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

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
        <h1>Service Requests</h1>
        <p>All service requests across the platform.</p>
      </div>

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
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Customer</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Location</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td className="font-medium">{req.title}</td>
                  <td className="text-secondary">
                    {req.customer?.full_name || "—"}
                  </td>
                  <td>
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
                  </td>
                  <td>
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
                  </td>
                  <td className="text-secondary truncate" style={{ maxWidth: 160 }}>
                    {req.address || "—"}
                  </td>
                  <td className="text-secondary">
                    {new Date(req.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
