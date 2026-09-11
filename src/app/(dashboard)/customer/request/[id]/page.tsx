"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { haversineDistance, formatDistance, estimateETA, formatETA } from "@/lib/geo";

interface TechnicianMatch {
  id: string;
  user_id: string;
  bio: string;
  experience_years: number;
  is_verified: boolean;
  avg_rating: number;
  total_jobs: number;
  base_visit_charge: number;
  hourly_rate: number;
  emergency_surcharge_pct: number;
  latitude: number;
  longitude: number;
  is_emergency_available: boolean;
  distance?: number;
  eta?: number;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
  skills?: { skill_name: string }[];
}

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">("distance");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Fetch request details
      const { data: reqData } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqData) {
        setRequest(reqData);

        // Fetch available verified technicians
        const { data: techs } = await supabase
          .from("technician_profiles")
          .select(`
            *,
            profile:profiles!technician_profiles_user_id_fkey(full_name, avatar_url),
            skills:technician_skills(skill_name)
          `)
          .eq("is_verified", true)
          .eq("is_available", true);

        if (techs) {
          // Calculate distance and ETA
          const withDistance = techs
            .map((tech) => {
              const dist =
                reqData.latitude && tech.latitude
                  ? haversineDistance(
                      reqData.latitude,
                      reqData.longitude,
                      tech.latitude,
                      tech.longitude
                    )
                  : 999;
              return {
                ...tech,
                distance: dist,
                eta: estimateETA(dist),
              };
            })
            .filter((tech) => tech.distance < 100) // Within 100km
            .sort((a, b) => a.distance - b.distance);

          setTechnicians(withDistance);
        }
      }
      setLoading(false);
    }
    load();
  }, [requestId]);

  async function handleBookTechnician(techId: string) {
    setBooking(true);
    setSelectedTechId(techId);

    const supabase = createClient();
    const tech = technicians.find((t) => t.id === techId);

    const estimatedCost = tech
      ? tech.base_visit_charge + tech.hourly_rate * 2
      : 0;

    const { error } = await supabase.from("bookings").insert({
      request_id: requestId,
      technician_id: techId,
      status: "pending",
      estimated_cost: estimatedCost,
    });

    if (!error) {
      // Update request status
      await supabase
        .from("service_requests")
        .update({ status: "matched" })
        .eq("id", requestId);

      setRequest((prev) => (prev ? { ...prev, status: "matched" } : prev));
    }
    setBooking(false);
    setSelectedTechId(null);
  }

  function sortedTechnicians() {
    const sorted = [...technicians];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => b.avg_rating - a.avg_rating);
        break;
      case "price":
        sorted.sort((a, b) => a.base_visit_charge - b.base_visit_charge);
        break;
      default:
        sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return sorted;
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < Math.round(rating) ? "filled" : ""}`}>
        ★
      </span>
    ));
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🔍</span>
        <h3>Request not found</h3>
        <p>This service request may have been deleted.</p>
        <Link href="/customer" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Request summary */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="flex-between" style={{ marginBottom: "var(--space-3)" }}>
          <h2>{request.title}</h2>
          <span
            className={`badge ${
              request.urgency === "emergency"
                ? "badge-danger"
                : request.urgency === "same_day"
                ? "badge-warning"
                : "badge-neutral"
            }`}
          >
            {request.urgency === "emergency"
              ? "🚨 Emergency"
              : request.urgency === "same_day"
              ? "⚡ Same Day"
              : "📅 Scheduled"}
          </span>
        </div>
        {request.description && (
          <p className="text-sm text-secondary" style={{ marginBottom: "var(--space-2)" }}>
            {request.description}
          </p>
        )}
        {request.address && (
          <p className="text-xs text-secondary">📍 {request.address}</p>
        )}
      </div>

      {/* Available technicians */}
      {request.status === "open" && (
        <>
          <div className="flex-between" style={{ marginBottom: "var(--space-4)" }}>
            <h3>Available Technicians ({technicians.length})</h3>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${sortBy === "distance" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSortBy("distance")}
              >
                Nearest
              </button>
              <button
                className={`btn btn-sm ${sortBy === "rating" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSortBy("rating")}
              >
                Top Rated
              </button>
              <button
                className={`btn btn-sm ${sortBy === "price" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSortBy("price")}
              >
                Price ↓
              </button>
            </div>
          </div>

          {sortedTechnicians().length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👷</span>
              <h3>No technicians available</h3>
              <p>
                No verified technicians are currently available in your area. Try
                again in a few minutes.
              </p>
            </div>
          ) : (
            <div className="stack">
              {sortedTechnicians().map((tech) => (
                <div key={tech.id} className="tech-card">
                  <div className="avatar avatar-lg">
                    {tech.profile?.avatar_url ? (
                      <img src={tech.profile.avatar_url} alt="" />
                    ) : (
                      tech.profile?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "?"
                    )}
                  </div>
                  <div className="tech-card-info">
                    <div className="tech-card-name">
                      {tech.profile?.full_name || "Technician"}
                      {tech.is_verified && (
                        <span className="badge badge-verified">Verified</span>
                      )}
                    </div>
                    <div className="tech-card-category">
                      {tech.experience_years} years experience
                    </div>
                    <div className="tech-card-meta">
                      <span className="rating">
                        {renderStars(tech.avg_rating)}
                        <span className="rating-value">
                          {tech.avg_rating.toFixed(1)}
                        </span>
                        <span className="rating-count">
                          ({tech.total_jobs} jobs)
                        </span>
                      </span>
                      <span>
                        📍 {formatDistance(tech.distance || 0)}
                      </span>
                      <span>
                        🕐 ETA: {formatETA(tech.eta || 0)}
                      </span>
                    </div>
                    {tech.skills && tech.skills.length > 0 && (
                      <div className="tech-card-skills">
                        {tech.skills.slice(0, 4).map((s) => (
                          <span key={s.skill_name} className="tag">
                            {s.skill_name}
                          </span>
                        ))}
                        {tech.skills.length > 4 && (
                          <span className="tag">+{tech.skills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="tech-card-actions">
                    <div className="tech-card-price">
                      ₹{tech.base_visit_charge}
                      <span> visit</span>
                      <br />
                      <span
                        className="text-xs text-secondary"
                        style={{ fontWeight: 400 }}
                      >
                        + ₹{tech.hourly_rate}/hr
                      </span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleBookTechnician(tech.id)}
                      disabled={booking}
                    >
                      {booking && selectedTechId === tech.id ? (
                        <span className="spinner" />
                      ) : (
                        "Select"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {request.status !== "open" && (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="text-secondary">
            This request has been {request.status}. Check your{" "}
            <Link href="/customer/bookings">bookings</Link> for updates.
          </p>
        </div>
      )}
    </div>
  );
}
