"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  full_name: string;
  phone: string;
  avatar_url: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone, avatar_url")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
          setFullName(data.full_name);
          setPhone(data.phone || "");
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
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

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
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="card">
        <div className="flex-center" style={{ marginBottom: "var(--space-6)" }}>
          <div className="avatar avatar-xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : (
              fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
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

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
