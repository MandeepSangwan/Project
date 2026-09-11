"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
  parent_category: string | null;
  icon_name: string | null;
  sort_order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [iconName, setIconName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const supabase = createClient();
    const { data } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (data) setCategories(data);
    setLoading(false);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id);
    setName(cat.name);
    setParentCategory(cat.parent_category || "");
    setIconName(cat.icon_name || "");
    setShowForm(true);
  }

  function openNew() {
    setEditId(null);
    setName("");
    setParentCategory("");
    setIconName("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const supabase = createClient();

    if (editId) {
      await supabase
        .from("service_categories")
        .update({
          name,
          parent_category: parentCategory || null,
          icon_name: iconName || null,
        })
        .eq("id", editId);
    } else {
      await supabase.from("service_categories").insert({
        name,
        parent_category: parentCategory || null,
        icon_name: iconName || null,
        sort_order: categories.length,
      });
    }

    setShowForm(false);
    setSaving(false);
    await loadCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const supabase = createClient();
    await supabase.from("service_categories").delete().eq("id", id);
    await loadCategories();
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
      <div className="flex-between" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1>Service Categories</h1>
          <p className="text-secondary text-sm">
            Manage the categories available on the platform.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + Add Category
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <h3 style={{ marginBottom: "var(--space-4)" }}>
            {editId ? "Edit Category" : "New Category"}
          </h3>
          <div className="stack">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="catName" className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  id="catName"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Industrial Electrician"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="catIcon" className="form-label">
                  Icon (emoji)
                </label>
                <input
                  id="catIcon"
                  type="text"
                  className="form-input"
                  placeholder="e.g., ⚡"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="catParent" className="form-label">
                Parent Category
              </label>
              <input
                id="catParent"
                type="text"
                className="form-input"
                placeholder="e.g., Industrial Machinery"
                value={parentCategory}
                onChange={(e) => setParentCategory(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📂</span>
          <h3>No categories yet</h3>
          <p>Add your first service category.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Parent</th>
                <th>Order</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontSize: 20 }}>{cat.icon_name || "—"}</td>
                  <td className="font-medium">{cat.name}</td>
                  <td className="text-secondary">
                    {cat.parent_category || "—"}
                  </td>
                  <td className="text-secondary">{cat.sort_order}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => handleDelete(cat.id)}
                      >
                        Delete
                      </button>
                    </div>
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
