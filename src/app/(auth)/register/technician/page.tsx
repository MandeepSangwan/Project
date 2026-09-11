"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SERVICE_CATEGORIES = [
  { id: "industrial-electrician", name: "Industrial Electrician", icon: "⚡" },
  { id: "plumber", name: "Plumber", icon: "🔧" },
  { id: "hvac", name: "HVAC Technician", icon: "❄️" },
  { id: "cnc", name: "CNC Technician", icon: "⚙️" },
  { id: "welder", name: "Welder", icon: "🔥" },
  { id: "boiler", name: "Boiler Technician", icon: "🏭" },
  { id: "appliance", name: "Appliance Repair", icon: "🔌" },
  { id: "it-ot", name: "IT / OT Support", icon: "💻" },
  { id: "general-electrician", name: "General Electrician", icon: "💡" },
  { id: "motor-rewinding", name: "Motor Rewinding", icon: "🔄" },
];

const SKILL_SUGGESTIONS = [
  "Motor Rewinding",
  "PLC Programming",
  "Hydraulics",
  "Welding — TIG/MIG",
  "Electrical Panel Wiring",
  "Compressor Repair",
  "CNC Machine Repair",
  "Pipe Fitting",
  "AC Installation",
  "Boiler Maintenance",
  "Circuit Board Repair",
  "Generator Repair",
  "Pump Repair",
  "Conveyor Belt Repair",
];

export default function TechnicianOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Bio
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // Step 2: Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 3: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  // Step 4: Pricing
  const [baseVisitCharge, setBaseVisitCharge] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [emergencySurcharge, setEmergencySurcharge] = useState("0");

  // Step 5: Availability
  const [isEmergencyAvailable, setIsEmergencyAvailable] = useState(false);
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [serviceRadius, setServiceRadius] = useState("25");

  const totalSteps = 5;

  function toggleCategory(catId: string) {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((c) => c !== catId)
        : [...prev, catId]
    );
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function addCustomSkill() {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated. Please log in again.");
      setLoading(false);
      return;
    }

    // Create technician profile
    const { data: techProfile, error: techError } = await supabase
      .from("technician_profiles")
      .insert({
        user_id: user.id,
        bio,
        experience_years: parseInt(experienceYears) || 0,
        base_visit_charge: parseFloat(baseVisitCharge) || 0,
        hourly_rate: parseFloat(hourlyRate) || 0,
        emergency_surcharge_pct: parseInt(emergencySurcharge) || 0,
        is_emergency_available: isEmergencyAvailable,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        service_radius_km: parseInt(serviceRadius) || 25,
        verification_status: "pending",
      })
      .select()
      .single();

    if (techError) {
      setError(techError.message);
      setLoading(false);
      return;
    }

    // Insert skills
    if (selectedSkills.length > 0 && techProfile) {
      const skillRows = selectedSkills.map((skill) => ({
        technician_id: techProfile.id,
        skill_name: skill,
      }));
      await supabase.from("technician_skills").insert(skillRows);
    }

    router.push("/technician");
    setLoading(false);
  }

  return (
    <div className="auth-page" style={{ alignItems: "flex-start", paddingTop: "var(--space-8)" }}>
      <div style={{ width: "100%", maxWidth: 600 }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <h2>Complete Your Technician Profile</h2>
          <p className="text-secondary text-sm">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                className={`stepper-step ${
                  i + 1 < step
                    ? "completed"
                    : i + 1 === step
                    ? "active"
                    : ""
                }`}
              >
                <div className="stepper-number">
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className="stepper-label">
                  {
                    ["Bio", "Categories", "Skills", "Pricing", "Availability"][
                      i
                    ]
                  }
                </span>
              </div>
              {i < totalSteps - 1 && <div className="stepper-line" />}
            </div>
          ))}
        </div>

        {error && (
          <div
            className="badge-danger"
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              marginBottom: "var(--space-4)",
            }}
          >
            {error}
          </div>
        )}

        <div className="card">
          {/* Step 1: Bio */}
          {step === 1 && (
            <div className="stack">
              <h3>About You</h3>
              <div className="form-group">
                <label htmlFor="bio" className="form-label">
                  Short Bio
                </label>
                <textarea
                  id="bio"
                  className="form-textarea"
                  placeholder="Tell customers about your experience and specialization..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="experience" className="form-label">
                  Years of Experience
                </label>
                <input
                  id="experience"
                  type="number"
                  className="form-input"
                  placeholder="e.g., 5"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Categories */}
          {step === 2 && (
            <div className="stack">
              <h3>Service Categories</h3>
              <p className="text-secondary text-sm">
                Select all categories you provide services in.
              </p>
              <div className="category-grid">
                {SERVICE_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-card ${
                      selectedCategories.includes(cat.id) ? "selected" : ""
                    }`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="stack">
              <h3>Skills &amp; Expertise</h3>
              <p className="text-secondary text-sm">
                Select your skills or add custom ones.
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={`tag ${
                      selectedSkills.includes(skill) ? "tag-selected" : ""
                    }`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={addCustomSkill}
                >
                  Add
                </button>
              </div>
              {selectedSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium" style={{ marginBottom: "var(--space-2)" }}>
                    Selected ({selectedSkills.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="tag tag-selected tag-removable"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill} ✕
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div className="stack">
              <h3>Pricing</h3>
              <p className="text-secondary text-sm">
                Set your charges. Customers will see estimated costs upfront.
              </p>
              <div className="form-group">
                <label htmlFor="baseCharge" className="form-label">
                  Base Visit / Call-out Charge (₹)
                </label>
                <input
                  id="baseCharge"
                  type="number"
                  className="form-input"
                  placeholder="e.g., 300"
                  min="0"
                  value={baseVisitCharge}
                  onChange={(e) => setBaseVisitCharge(e.target.value)}
                />
                <span className="form-hint">
                  One-time charge for visiting the site
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="hourlyRate" className="form-label">
                  Hourly Rate (₹)
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  className="form-input"
                  placeholder="e.g., 500"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="surcharge" className="form-label">
                  Emergency Surcharge (%)
                </label>
                <input
                  id="surcharge"
                  type="number"
                  className="form-input"
                  placeholder="e.g., 25"
                  min="0"
                  max="100"
                  value={emergencySurcharge}
                  onChange={(e) => setEmergencySurcharge(e.target.value)}
                />
                <span className="form-hint">
                  Additional percentage charged for emergency/urgent requests
                </span>
              </div>
            </div>
          )}

          {/* Step 5: Availability */}
          {step === 5 && (
            <div className="stack">
              <h3>Availability &amp; Service Area</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime" className="form-label">
                    Working Hours Start
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
                    Working Hours End
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
              <div className="toggle-wrapper">
                <input
                  type="checkbox"
                  id="emergencyToggle"
                  className="toggle"
                  checked={isEmergencyAvailable}
                  onChange={(e) => setIsEmergencyAvailable(e.target.checked)}
                />
                <label htmlFor="emergencyToggle" className="toggle-label">
                  Available for 24/7 emergency calls
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="radius" className="form-label">
                  Service Radius: {serviceRadius} km
                </label>
                <input
                  id="radius"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  className="form-input"
                  style={{ padding: "var(--space-1)" }}
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                />
                <span className="form-hint">
                  You&apos;ll receive job requests within this radius
                </span>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div
            className="flex-between"
            style={{ marginTop: "var(--space-6)" }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              ← Back
            </button>
            {step < totalSteps ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
