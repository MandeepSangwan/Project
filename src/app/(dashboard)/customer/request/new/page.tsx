"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get("category") || "";

  const [category, setCategory] = useState(preselectedCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"emergency" | "same_day" | "scheduled">("same_day");
  const [scheduledDate, setScheduledDate] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setDetectingLocation(false);
      },
      () => {
        setError("Unable to detect location. Please enter address manually.");
        setDetectingLocation(false);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      setError("Please select a service category.");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("service_requests")
      .insert({
        customer_id: user.id,
        title,
        description,
        urgency,
        scheduled_date: urgency === "scheduled" ? scheduledDate : null,
        address,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/customer/request/${data.id}`);
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="page-header">
        <h1>Report a Breakdown</h1>
        <p>Describe the issue and we&apos;ll find the best technician for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        {error && (
          <div
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              background: "var(--danger-light)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* Category selection */}
        <div className="form-group">
          <label className="form-label">
            Service Category <span className="required">*</span>
          </label>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={`category-card ${category === cat.id ? "selected" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Issue Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="form-input"
            placeholder="e.g., Compressor not starting, Motor overheating"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Describe the Issue
          </label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Provide details about the problem, equipment model, symptoms, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Photo/Video upload placeholder */}
        <div className="form-group">
          <label className="form-label">Photos / Videos</label>
          <div className="file-upload">
            <span className="file-upload-icon">📷</span>
            <span className="file-upload-text">
              Tap to upload photos or videos of the issue
            </span>
            <span className="text-xs text-secondary" style={{ marginTop: "var(--space-1)" }}>
              Supports JPG, PNG, MP4 (max 10MB each)
            </span>
          </div>
        </div>

        {/* Urgency */}
        <div className="form-group">
          <label className="form-label">
            Urgency Level <span className="required">*</span>
          </label>
          <div className="urgency-options">
            <div
              className={`urgency-option ${urgency === "emergency" ? "selected emergency" : ""}`}
              onClick={() => setUrgency("emergency")}
            >
              <span className="urgency-icon">🚨</span>
              <span className="urgency-label">Emergency</span>
              <span className="urgency-desc">Need help ASAP</span>
            </div>
            <div
              className={`urgency-option ${urgency === "same_day" ? "selected" : ""}`}
              onClick={() => setUrgency("same_day")}
            >
              <span className="urgency-icon">⚡</span>
              <span className="urgency-label">Same Day</span>
              <span className="urgency-desc">Within today</span>
            </div>
            <div
              className={`urgency-option ${urgency === "scheduled" ? "selected" : ""}`}
              onClick={() => setUrgency("scheduled")}
            >
              <span className="urgency-icon">📅</span>
              <span className="urgency-label">Scheduled</span>
              <span className="urgency-desc">Pick a date</span>
            </div>
          </div>
        </div>

        {urgency === "scheduled" && (
          <div className="form-group">
            <label htmlFor="scheduledDate" className="form-label">
              Preferred Date
            </label>
            <input
              id="scheduledDate"
              type="date"
              className="form-input"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}

        {/* Location */}
        <div className="form-group">
          <label className="form-label">Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={detectLocation}
              disabled={detectingLocation}
              style={{ whiteSpace: "nowrap" }}
            >
              {detectingLocation ? "Detecting..." : "📍 Auto-detect"}
            </button>
          </div>
          {location && (
            <span className="form-hint">
              📍 Location detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-full"
          disabled={loading}
          style={{ marginTop: "var(--space-4)" }}
        >
          {loading ? (
            <>
              <span className="spinner" /> Submitting...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </form>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <span className="spinner" /> Loading request form...
        </div>
      }
    >
      <NewRequestForm />
    </Suspense>
  );
}
