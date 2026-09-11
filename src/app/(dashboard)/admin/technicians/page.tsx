"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Technician {
  id: string;
  is_verified: boolean;
  verification_status: string;
  is_available: boolean;
  avg_rating: number;
  total_jobs: number;
  experience_years: number;
  profile?: {
    full_name: string;
    phone: string;
  };
}

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending" | "rejected">("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("technician_profiles")
        .select(`
          id, is_verified, verification_status, is_available, avg_rating, total_jobs, experience_years,
          profile:profiles!technician_profiles_user_id_fkey(full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (data) setTechnicians(data as any);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = technicians
    .filter((t) => {
      if (filter === "all") return true;
      if (filter === "verified") return t.is_verified;
      return t.verification_status === filter;
    })
    .filter((t) =>
      search
        ? t.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
        : true
    );

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
        <h1>All Technicians</h1>
        <p>{technicians.length} registered technicians.</p>
      </div>

      {/* Search and filter */}
      <div className="flex gap-4" style={{ marginBottom: "var(--space-4)" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <div className="tabs">
          {(["all", "verified", "pending", "rejected"] as const).map((f) => (
            <button
              key={f}
              className={`tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">👷</span>
          <h3>No technicians found</h3>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Experience</th>
                <th>Rating</th>
                <th>Jobs</th>
                <th>Status</th>
                <th>Online</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tech) => (
                <tr key={tech.id}>
                  <td>
                    <div className="flex gap-2">
                      <div className="avatar avatar-sm">
                        {tech.profile?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </div>
                      <span className="font-medium">
                        {tech.profile?.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="text-secondary">
                    {tech.profile?.phone || "—"}
                  </td>
                  <td>{tech.experience_years} yr</td>
                  <td>
                    <span style={{ color: "var(--warning)" }}>★</span>{" "}
                    {tech.avg_rating.toFixed(1)}
                  </td>
                  <td>{tech.total_jobs}</td>
                  <td>
                    <span
                      className={`badge ${
                        tech.is_verified
                          ? "badge-success"
                          : tech.verification_status === "rejected"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {tech.is_verified
                        ? "Verified"
                        : tech.verification_status === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: tech.is_available
                          ? "var(--success)"
                          : "var(--text-tertiary)",
                      }}
                    >
                      {tech.is_available ? "🟢" : "⚫"}
                    </span>
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
