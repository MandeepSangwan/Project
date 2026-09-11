"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TechnicianProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [baseVisitCharge, setBaseVisitCharge] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [emergencySurcharge, setEmergencySurcharge] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name);
          setPhone(profile.phone || "");
        }

        const { data: tech } = await supabase
          .from("technician_profiles")
          .select("*, skills:technician_skills(skill_name)")
          .eq("user_id", user.id)
          .single();

        if (tech) {
          setBio(tech.bio || "");
          setExperienceYears(String(tech.experience_years || ""));
          setBaseVisitCharge(String(tech.base_visit_charge || ""));
          setHourlyRate(String(tech.hourly_rate || ""));
          setEmergencySurcharge(String(tech.emergency_surcharge_pct || "0"));
          setVerificationStatus(tech.verification_status);
          setSkills(tech.skills?.map((s: any) => s.skill_name) || []);
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
      // Update profile
      await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      // Update tech profile
      const { error } = await supabase
        .from("technician_profiles")
        .update({
          bio,
          experience_years: parseInt(experienceYears) || 0,
          base_visit_charge: parseFloat(baseVisitCharge) || 0,
          hourly_rate: parseFloat(hourlyRate) || 0,
          emergency_surcharge_pct: parseInt(emergencySurcharge) || 0,
        })
        .eq("user_id", user.id);

      if (error) {
        setMessage("Error saving profile.");
      } else {
        setMessage("Profile updated successfully!");
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
        <h1>My Profile</h1>
      </div>

      {/* Verification status */}
      <div
        className="card"
        style={{
          marginBottom: "var(--space-4)",
          borderColor:
            verificationStatus === "approved"
              ? "var(--success)"
              : verificationStatus === "rejected"
              ? "var(--danger)"
              : "var(--warning)",
        }}
      >
        <div className="flex-between">
          <div className="flex gap-2">
            <span>
              {verificationStatus === "approved"
                ? "✅"
                : verificationStatus === "rejected"
                ? "❌"
                : "⏳"}
            </span>
            <div>
              <p className="font-medium">
                Verification:{" "}
                {verificationStatus.charAt(0).toUpperCase() +
                  verificationStatus.slice(1)}
              </p>
              <p className="text-xs text-secondary">
                {verificationStatus === "approved"
                  ? "Your profile is verified and visible to customers."
                  : verificationStatus === "rejected"
                  ? "Please update your documents and resubmit."
                  : "Your profile is under review by our team."}
              </p>
            </div>
          </div>
          {verificationStatus === "approved" && (
            <span className="badge badge-verified">Verified</span>
          )}
        </div>
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

        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Personal Info</h3>
          <div className="stack">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea
                id="bio"
                className="form-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="exp" className="form-label">Years of Experience</label>
              <input
                id="exp"
                type="number"
                className="form-input"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Pricing</h3>
          <div className="stack">
            <div className="form-group">
              <label htmlFor="base" className="form-label">Base Visit Charge (₹)</label>
              <input
                id="base"
                type="number"
                className="form-input"
                value={baseVisitCharge}
                onChange={(e) => setBaseVisitCharge(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="hourly" className="form-label">Hourly Rate (₹)</label>
              <input
                id="hourly"
                type="number"
                className="form-input"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="surcharge" className="form-label">Emergency Surcharge (%)</label>
              <input
                id="surcharge"
                type="number"
                className="form-input"
                value={emergencySurcharge}
                onChange={(e) => setEmergencySurcharge(e.target.value)}
              />
            </div>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: "var(--space-3)" }}>Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="tag tag-selected">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
