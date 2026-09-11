"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  status: string;
  estimated_cost: number;
  final_cost: number | null;
  created_at: string;
  request?: {
    title: string;
    urgency: string;
  };
  technician?: {
    profile?: {
      full_name: string;
    };
  };
}

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "past">("active");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get all bookings for this customer's requests
        const { data } = await supabase
          .from("bookings")
          .select(`
            *,
            request:service_requests!bookings_request_id_fkey(title, urgency),
            technician:technician_profiles!bookings_technician_id_fkey(
              profile:profiles!technician_profiles_user_id_fkey(full_name)
            )
          `)
          .order("created_at", { ascending: false });

        if (data) setBookings(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const activeStatuses = ["pending", "accepted", "en_route", "arrived", "in_progress"];
  const activeBookings = bookings.filter((b) => activeStatuses.includes(b.status));
  const pastBookings = bookings.filter((b) => !activeStatuses.includes(b.status));

  const displayBookings = filter === "active" ? activeBookings : pastBookings;

  function getStatusBadge(status: string) {
    const map: Record<string, { class: string; label: string }> = {
      pending: { class: "badge-warning", label: "Pending" },
      accepted: { class: "badge-success", label: "Accepted" },
      en_route: { class: "badge-accent", label: "En Route" },
      arrived: { class: "badge-accent", label: "Arrived" },
      in_progress: { class: "badge-accent", label: "In Progress" },
      completed: { class: "badge-success", label: "Completed" },
      cancelled: { class: "badge-neutral", label: "Cancelled" },
      rejected: { class: "badge-danger", label: "Rejected" },
    };
    const info = map[status] || { class: "badge-neutral", label: status };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
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
        <h1>My Bookings</h1>
        <p>Track your ongoing and past service bookings.</p>
      </div>

      <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
        <button
          className={`tab ${filter === "active" ? "active" : ""}`}
          onClick={() => setFilter("active")}
        >
          Active ({activeBookings.length})
        </button>
        <button
          className={`tab ${filter === "past" ? "active" : ""}`}
          onClick={() => setFilter("past")}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      {displayBookings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📅</span>
          <h3>No {filter} bookings</h3>
          <p>
            {filter === "active"
              ? "You don't have any active bookings right now."
              : "Your completed bookings will appear here."}
          </p>
        </div>
      ) : (
        <div className="stack-sm">
          {displayBookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/customer/bookings/${booking.id}`}
              className="card card-clickable"
              style={{ textDecoration: "none", color: "var(--text)" }}
            >
              <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
                <p className="font-medium">
                  {booking.request?.title || "Service Request"}
                </p>
                {getStatusBadge(booking.status)}
              </div>
              <div className="flex-between">
                <div className="text-sm text-secondary">
                  <p>
                    👷 {booking.technician?.profile?.full_name || "Unassigned"}
                  </p>
                  <p className="text-xs" style={{ marginTop: 2 }}>
                    {new Date(booking.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{booking.final_cost || booking.estimated_cost}
                  </p>
                  {!booking.final_cost && (
                    <p className="text-xs text-secondary">estimated</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
