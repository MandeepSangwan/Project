"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const STATUS_FLOW = ["pending", "accepted", "en_route", "arrived", "in_progress", "completed"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Accept Job",
  accepted: "Mark En Route",
  en_route: "Mark Arrived",
  arrived: "Start Work",
  in_progress: "Complete Job",
};

export default function TechnicianJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [finalCost, setFinalCost] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Try to find as a booking first
      const { data: bookingData } = await supabase
        .from("bookings")
        .select(`
          *,
          request:service_requests!bookings_request_id_fkey(
            title, description, urgency, address, latitude, longitude,
            customer:profiles!service_requests_customer_id_fkey(full_name, phone)
          )
        `)
        .eq("id", jobId)
        .single();

      if (bookingData) {
        setBooking(bookingData);
      }

      setLoading(false);
    }
    load();
  }, [jobId]);

  async function advanceStatus() {
    if (!booking) return;
    setUpdating(true);

    const currentIndex = STATUS_FLOW.indexOf(booking.status);
    const nextStatus = STATUS_FLOW[currentIndex + 1];

    if (!nextStatus) {
      setUpdating(false);
      return;
    }

    const supabase = createClient();

    const updates: any = { status: nextStatus };

    if (nextStatus === "in_progress") {
      updates.started_at = new Date().toISOString();
    }
    if (nextStatus === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.final_cost = parseFloat(finalCost) || booking.estimated_cost;

      // Also update the service request status
      await supabase
        .from("service_requests")
        .update({ status: "completed" })
        .eq("id", booking.request_id);
    }

    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", jobId);

    if (!error) {
      setBooking({ ...booking, ...updates });
    }
    setUpdating(false);
  }

  async function rejectJob() {
    setUpdating(true);
    const supabase = createClient();

    await supabase
      .from("bookings")
      .update({ status: "rejected" })
      .eq("id", jobId);

    // Reopen the request
    if (booking) {
      await supabase
        .from("service_requests")
        .update({ status: "open" })
        .eq("id", booking.request_id);
    }

    router.push("/technician/jobs");
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🔍</span>
        <h3>Job not found</h3>
        <Link href="/technician/jobs" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
          Back to Jobs
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_FLOW.indexOf(booking.status);
  const isCompleted = booking.status === "completed";
  const isCancelled = booking.status === "cancelled" || booking.status === "rejected";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Link href="/technician/jobs" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-4)" }}>
        ← Back to Jobs
      </Link>

      {/* Request details */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <div className="flex-between" style={{ marginBottom: "var(--space-3)" }}>
          <h2>{booking.request?.title}</h2>
          <span
            className={`badge ${
              booking.request?.urgency === "emergency"
                ? "badge-danger"
                : booking.request?.urgency === "same_day"
                ? "badge-warning"
                : "badge-neutral"
            }`}
          >
            {booking.request?.urgency === "emergency"
              ? "🚨 Emergency"
              : booking.request?.urgency === "same_day"
              ? "⚡ Same Day"
              : "📅 Scheduled"}
          </span>
        </div>
        {booking.request?.description && (
          <p className="text-sm text-secondary" style={{ marginBottom: "var(--space-3)" }}>
            {booking.request.description}
          </p>
        )}
        {booking.request?.address && (
          <p className="text-sm">📍 {booking.request.address}</p>
        )}
      </div>

      {/* Customer info */}
      {booking.request?.customer && (
        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <h3 style={{ marginBottom: "var(--space-3)" }}>Customer</h3>
          <p className="font-medium">{booking.request.customer.full_name}</p>
          {booking.request.customer.phone && (
            <p className="text-sm" style={{ marginTop: "var(--space-1)" }}>
              📞 {booking.request.customer.phone}
            </p>
          )}
        </div>
      )}

      {/* Status timeline */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>Job Progress</h3>
        <div className="timeline">
          {STATUS_FLOW.map((status, i) => (
            <div
              key={status}
              className={`timeline-item ${
                i < currentStepIndex
                  ? "completed"
                  : i === currentStepIndex
                  ? "active"
                  : ""
              }`}
            >
              <div className="timeline-dot">
                {i < currentStepIndex ? "✓" : i + 1}
              </div>
              <div className="timeline-content">
                <div className="timeline-title">
                  {status === "en_route"
                    ? "En Route"
                    : status === "in_progress"
                    ? "In Progress"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                {i === currentStepIndex && !isCompleted && (
                  <div className="timeline-time">Current</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h3 style={{ marginBottom: "var(--space-3)" }}>Earnings</h3>
        <div className="flex-between">
          <span className="text-sm text-secondary">Estimated</span>
          <span className="font-medium">₹{booking.estimated_cost}</span>
        </div>
        {booking.final_cost && (
          <div
            className="flex-between"
            style={{
              marginTop: "var(--space-2)",
              paddingTop: "var(--space-2)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <span className="font-medium">Final</span>
            <span className="font-bold" style={{ fontSize: "var(--font-size-lg)" }}>
              ₹{booking.final_cost}
            </span>
          </div>
        )}
      </div>

      {/* Final cost input (before completing) */}
      {booking.status === "in_progress" && (
        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <div className="form-group">
            <label htmlFor="finalCost" className="form-label">
              Final Cost (₹)
            </label>
            <input
              id="finalCost"
              type="number"
              className="form-input"
              placeholder={`Estimated: ₹${booking.estimated_cost}`}
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
            />
            <span className="form-hint">
              Enter the final amount including parts and additional charges.
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isCompleted && !isCancelled && (
        <div className="flex gap-3">
          {booking.status === "pending" && (
            <button
              className="btn btn-outline btn-lg"
              onClick={rejectJob}
              disabled={updating}
              style={{ flex: 1 }}
            >
              Reject
            </button>
          )}
          <button
            className={`btn btn-lg ${
              booking.status === "in_progress" ? "btn-success" : "btn-primary"
            }`}
            onClick={advanceStatus}
            disabled={updating}
            style={{ flex: 2 }}
          >
            {updating ? (
              <span className="spinner" />
            ) : (
              STATUS_LABELS[booking.status] || "Next"
            )}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="card" style={{ textAlign: "center", background: "var(--success-light)" }}>
          <p style={{ color: "var(--success)" }}>✅ Job completed successfully!</p>
        </div>
      )}
    </div>
  );
}
