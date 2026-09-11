"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EarningEntry {
  id: string;
  final_cost: number;
  completed_at: string;
  request?: {
    title: string;
  };
}

export default function TechnicianEarningsPage() {
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("week");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: techProfile } = await supabase
          .from("technician_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (techProfile) {
          const { data } = await supabase
            .from("bookings")
            .select(`
              id, final_cost, completed_at,
              request:service_requests!bookings_request_id_fkey(title)
            `)
            .eq("technician_id", techProfile.id)
            .eq("status", "completed")
            .not("final_cost", "is", null)
            .order("completed_at", { ascending: false });

          if (data) setEarnings(data as any);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  function getFilteredEarnings() {
    const now = new Date();
    return earnings.filter((e) => {
      if (period === "all") return true;
      const date = new Date(e.completed_at);
      switch (period) {
        case "today":
          return date.toDateString() === now.toDateString();
        case "week": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        }
        case "month": {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return date >= monthAgo;
        }
      }
    });
  }

  const filtered = getFilteredEarnings();
  const totalEarnings = filtered.reduce((sum, e) => sum + (e.final_cost || 0), 0);

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
        <h1>Earnings</h1>
        <p>Track your income from completed jobs.</p>
      </div>

      {/* Period tabs */}
      <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
        {(["today", "week", "month", "all"] as const).map((p) => (
          <button
            key={p}
            className={`tab ${period === p ? "active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {p === "today"
              ? "Today"
              : p === "week"
              ? "This Week"
              : p === "month"
              ? "This Month"
              : "All Time"}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="stat-card" style={{ marginBottom: "var(--space-6)", textAlign: "center" }}>
        <p className="stat-label">
          Total Earnings (
          {period === "today"
            ? "Today"
            : period === "week"
            ? "This Week"
            : period === "month"
            ? "This Month"
            : "All Time"}
          )
        </p>
        <p className="stat-value" style={{ fontSize: "var(--font-size-3xl)" }}>
          ₹{totalEarnings.toLocaleString("en-IN")}
        </p>
        <p className="text-sm text-secondary" style={{ marginTop: "var(--space-1)" }}>
          {filtered.length} completed job{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Job history */}
      <h3 style={{ marginBottom: "var(--space-4)" }}>Job History</h3>
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <p className="text-secondary">No completed jobs in this period.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium">
                    {e.request?.title || "Service Job"}
                  </td>
                  <td className="text-secondary">
                    {new Date(e.completed_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ textAlign: "right" }} className="font-semibold">
                    ₹{e.final_cost}
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
