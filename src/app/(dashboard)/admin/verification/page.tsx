"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PendingTechnician {
  id: string;
  user_id: string;
  bio: string;
  experience_years: number;
  verification_status: string;
  base_visit_charge: number;
  hourly_rate: number;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string;
  };
  skills?: { skill_name: string }[];
  documents?: { document_type: string; file_url: string }[];
}

export default function AdminVerificationPage() {
  const [technicians, setTechnicians] = useState<PendingTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function loadTechnicians() {
    const supabase = createClient();

    const { data } = await supabase
      .from("technician_profiles")
      .select(`
        *,
        profile:profiles!technician_profiles_user_id_fkey(full_name, phone),
        skills:technician_skills(skill_name),
        documents:technician_documents(document_type, file_url)
      `)
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true });

    if (data) setTechnicians(data);
    setLoading(false);
  }

  async function handleAction(techId: string, action: "approved" | "rejected") {
    setProcessing(techId);
    const supabase = createClient();

    await supabase
      .from("technician_profiles")
      .update({
        verification_status: action,
        is_verified: action === "approved",
      })
      .eq("id", techId);

    setTechnicians((prev) => prev.filter((t) => t.id !== techId));
    setProcessing(null);
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
        <h1>Verification Queue</h1>
        <p>
          {technicians.length} technician{technicians.length !== 1 ? "s" : ""}{" "}
          pending verification.
        </p>
      </div>

      {technicians.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">✅</span>
          <h3>All caught up!</h3>
          <p>No technicians pending verification.</p>
        </div>
      ) : (
        <div className="stack">
          {technicians.map((tech) => (
            <div key={tech.id} className="card">
              <div
                className="flex-between"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setExpandedId(expandedId === tech.id ? null : tech.id)
                }
              >
                <div className="flex gap-3">
                  <div className="avatar avatar-md">
                    {tech.profile?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {tech.profile?.full_name}
                    </p>
                    <p className="text-xs text-secondary">
                      {tech.experience_years} years exp · Applied{" "}
                      {new Date(tech.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <span style={{ color: "var(--text-tertiary)" }}>
                  {expandedId === tech.id ? "▲" : "▼"}
                </span>
              </div>

              {expandedId === tech.id && (
                <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border)" }}>
                  {/* Bio */}
                  {tech.bio && (
                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <p className="text-xs font-medium text-secondary">BIO</p>
                      <p className="text-sm">{tech.bio}</p>
                    </div>
                  )}

                  {/* Contact */}
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <p className="text-xs font-medium text-secondary">CONTACT</p>
                    <p className="text-sm">📞 {tech.profile?.phone || "—"}</p>
                  </div>

                  {/* Pricing */}
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <p className="text-xs font-medium text-secondary">PRICING</p>
                    <p className="text-sm">
                      Visit: ₹{tech.base_visit_charge} · Hourly: ₹{tech.hourly_rate}
                    </p>
                  </div>

                  {/* Skills */}
                  {tech.skills && tech.skills.length > 0 && (
                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <p className="text-xs font-medium text-secondary">SKILLS</p>
                      <div className="flex flex-wrap gap-1" style={{ marginTop: "var(--space-1)" }}>
                        {tech.skills.map((s) => (
                          <span key={s.skill_name} className="tag">
                            {s.skill_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {tech.documents && tech.documents.length > 0 && (
                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <p className="text-xs font-medium text-secondary">DOCUMENTS</p>
                      <div className="stack-sm" style={{ marginTop: "var(--space-1)" }}>
                        {tech.documents.map((doc, i) => (
                          <a
                            key={i}
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm"
                          >
                            📄 {doc.document_type}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3" style={{ marginTop: "var(--space-4)" }}>
                    <button
                      className="btn btn-success"
                      style={{ flex: 1 }}
                      onClick={() => handleAction(tech.id, "approved")}
                      disabled={processing === tech.id}
                    >
                      {processing === tech.id ? "..." : "✓ Approve"}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ flex: 1 }}
                      onClick={() => handleAction(tech.id, "rejected")}
                      disabled={processing === tech.id}
                    >
                      {processing === tech.id ? "..." : "✕ Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
