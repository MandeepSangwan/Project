"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TechnicianAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isAvailable, setIsAvailable] = useState(false);
  const [isEmergencyAvailable, setIsEmergencyAvailable] = useState(false);
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [serviceRadius, setServiceRadius] = useState(25);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("technician_profiles")
          .select(
            "is_available, is_emergency_available, working_hours_start, working_hours_end, service_radius_km"
          )
          .eq("user_id", user.id)
          .single();

        if (data) {
          setIsAvailable(data.is_available);
          setIsEmergencyAvailable(data.is_emergency_available);
          setWorkingHoursStart(data.working_hours_start || "09:00");
          setWorkingHoursEnd(data.working_hours_end || "18:00");
          setServiceRadius(data.service_radius_km || 25);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("technician_profiles")
        .update({
          is_available: isAvailable,
          is_emergency_available: isEmergencyAvailable,
          working_hours_start: workingHoursStart,
          working_hours_end: workingHoursEnd,
          service_radius_km: serviceRadius,
        })
        .eq("user_id", user.id);

      if (error) {
        setMessage("Error saving settings.");
      } else {
        setMessage("Settings saved successfully!");
      }
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="page-header">
        <h1>Availability Settings</h1>
        <p>Control when and where you receive job requests.</p>
      </div>

      <div className="stack">
        {message && (
          <div
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              background: message.includes("Error")
                ? "var(--danger-light)"
                : "var(--success-light)",
              color: message.includes("Error")
                ? "var(--danger)"
                : "var(--success)",
            }}
          >
            {message}
          </div>
        )}

        {/* Online toggle */}
        <div className="card">
          <div className="flex-between">
            <div>
              <p className="font-semibold">
                {isAvailable ? "🟢 Online" : "⚫ Offline"}
              </p>
              <p className="text-sm text-secondary">
                {isAvailable
                  ? "You're receiving job requests"
                  : "You're not visible to customers"}
              </p>
            </div>
            <div className="toggle-wrapper">
              <input
                type="checkbox"
                className="toggle"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                id="onlineToggle"
              />
            </div>
          </div>
        </div>

        {/* Working hours */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Working Hours</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime" className="form-label">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                className="form-input"
                value={workingHoursStart}
                onChange={(e) => setWorkingHoursStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime" className="form-label">
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                className="form-input"
                value={workingHoursEnd}
                onChange={(e) => setWorkingHoursEnd(e.target.value)}
              />
            </div>
          </div>

          <div
            className="toggle-wrapper"
            style={{ marginTop: "var(--space-4)" }}
          >
            <input
              type="checkbox"
              id="emergencyToggle"
              className="toggle"
              checked={isEmergencyAvailable}
              onChange={(e) => setIsEmergencyAvailable(e.target.checked)}
            />
            <div>
              <label htmlFor="emergencyToggle" className="toggle-label">
                Available for 24/7 emergency calls
              </label>
              <p className="text-xs text-secondary">
                Override working hours for emergency requests
              </p>
            </div>
          </div>
        </div>

        {/* Service radius */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Service Area</h3>
          <div className="form-group">
            <label className="form-label">
              Radius: <strong>{serviceRadius} km</strong>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              className="form-input"
              style={{ padding: "var(--space-1)" }}
              value={serviceRadius}
              onChange={(e) => setServiceRadius(parseInt(e.target.value))}
            />
            <div className="flex-between text-xs text-secondary">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
