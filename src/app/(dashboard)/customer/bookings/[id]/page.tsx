"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface BookingDetail {
  id: string;
  status: string;
  estimated_cost: number;
  final_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  request?: {
    title: string;
    description: string;
    urgency: string;
    address: string;
  };
  technician?: {
    id: string;
    experience_years: number;
    avg_rating: number;
    total_jobs: number;
    base_visit_charge: number;
    hourly_rate: number;
    profile?: {
      full_name: string;
      phone: string;
      avatar_url: string;
    };
  };
}

const STATUS_STEPS = [
  { key: "pending", label: "Pending", icon: "⏳" },
  { key: "accepted", label: "Accepted", icon: "✓" },
  { key: "en_route", label: "En Route", icon: "🚗" },
  { key: "arrived", label: "Arrived", icon: "📍" },
  { key: "in_progress", label: "In Progress", icon: "🔧" },
  { key: "completed", label: "Completed", icon: "✅" },
];

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("bookings")
        .select(`
          *,
          request:service_requests!bookings_request_id_fkey(title, description, urgency, address),
          technician:technician_profiles!bookings_technician_id_fkey(
            id, experience_years, avg_rating, total_jobs, base_visit_charge, hourly_rate,
            profile:profiles!technician_profiles_user_id_fkey(full_name, phone, avatar_url)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (data) setBooking(data);

      // Check if review exists
      if (data) {
        const { data: review } = await supabase
          .from("reviews")
          .select("id")
          .eq("booking_id", bookingId)
          .single();

        if (review) setReviewSubmitted(true);
      }

      setLoading(false);
    }
    load();
  }, [bookingId]);

  async function handleSubmitReview() {
    if (rating === 0) return;
    setSubmittingReview(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && booking?.technician) {
      await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: booking.technician.profile?.full_name, // This should be technician user_id
        rating,
        comment: reviewComment,
      });

      setReviewSubmitted(true);
    }
    setSubmittingReview(false);
  }

  function getCurrentStepIndex() {
    if (!booking) return -1;
    return STATUS_STEPS.findIndex((s) => s.key === booking.status);
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
        <h3>Booking not found</h3>
        <Link href="/customer/bookings" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
          Back to Bookings
        </Link>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Link href="/customer/bookings" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-4)" }}>
        ← Back to Bookings
      </Link>

      {/* Request info */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h2 style={{ marginBottom: "var(--space-2)" }}>
          {booking.request?.title}
        </h2>
        {booking.request?.description && (
          <p className="text-sm text-secondary" style={{ marginBottom: "var(--space-2)" }}>
            {booking.request.description}
          </p>
        )}
        {booking.request?.address && (
          <p className="text-xs text-secondary">📍 {booking.request.address}</p>
        )}
      </div>

      {/* Status timeline */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>Status</h3>
        <div className="timeline">
          {STATUS_STEPS.map((step, i) => (
            <div
              key={step.key}
              className={`timeline-item ${
                i < currentStep
                  ? "completed"
                  : i === currentStep
                  ? "active"
                  : ""
              }`}
            >
              <div className="timeline-dot">
                {i < currentStep ? "✓" : step.icon}
              </div>
              <div className="timeline-content">
                <div className="timeline-title">{step.label}</div>
                {i === currentStep && (
                  <div className="timeline-time">Current</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technician info */}
      {booking.technician && (
        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <h3 style={{ marginBottom: "var(--space-4)" }}>Technician</h3>
          <div className="flex gap-4">
            <div className="avatar avatar-lg">
              {booking.technician.profile?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "?"}
            </div>
            <div>
              <p className="font-semibold">
                {booking.technician.profile?.full_name}
              </p>
              <p className="text-sm text-secondary">
                {booking.technician.experience_years} years experience
              </p>
              <div className="rating" style={{ marginTop: 4 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`star ${
                      i < Math.round(booking.technician!.avg_rating) ? "filled" : ""
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="rating-value">
                  {booking.technician.avg_rating.toFixed(1)}
                </span>
              </div>
              {booking.technician.profile?.phone && (
                <p className="text-sm" style={{ marginTop: "var(--space-2)" }}>
                  📞 {booking.technician.profile.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>Cost</h3>
        <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
          <span className="text-sm text-secondary">Estimated Cost</span>
          <span className="font-medium">₹{booking.estimated_cost}</span>
        </div>
        {booking.final_cost && (
          <div className="flex-between" style={{ paddingTop: "var(--space-2)", borderTop: "1px solid var(--border)" }}>
            <span className="font-medium">Final Cost</span>
            <span className="font-bold" style={{ fontSize: "var(--font-size-lg)" }}>
              ₹{booking.final_cost}
            </span>
          </div>
        )}
      </div>

      {/* Review form (only if completed and not yet reviewed) */}
      {booking.status === "completed" && !reviewSubmitted && (
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Rate Your Experience</h3>
          <div className="stack">
            <div className="flex-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 32,
                    cursor: "pointer",
                    color: star <= rating ? "var(--warning)" : "var(--border)",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="Share your experience (optional)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleSubmitReview}
              disabled={rating === 0 || submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {reviewSubmitted && (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="text-secondary">✅ Thank you for your review!</p>
        </div>
      )}
    </div>
  );
}
