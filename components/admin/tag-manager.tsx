// ============================================================
// Admin: Tag Manager Component
// ============================================================
// สำหรับ Settings page - จัดการ tag translations
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { Plus, Save, X, AlertCircle, Check, Search, Hash } from "lucide-react";
import type { Locale } from "@/lib/locales";
import { ALL_LOCALES as ALL_LOCALES_LIST, LOCALE_NAMES } from "@/lib/locales";

interface TagEntry {
  slug: string;
  names: Record<string, string>;
}

// Use central locale definitions from lib/locales.ts (single source of truth)
const ALL_LOCALES: { code: Locale; label: string }[] = ALL_LOCALES_LIST.map(code => ({
  code,
  label: LOCALE_NAMES[code]?.native || code,
}));

export function TagManager() {
  const [tags, setTags] = useState<TagEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [newTagSlug, setNewTagSlug] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);

  useEffect(() => {
    fetch("/api/admin/tags")
      .then((r) => r.json())
      .then((data) => {
        if (data.tags) setTags(data.tags);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (tag: TagEntry) => {
    setEditingTag(tag.slug);
    setEditNames({ ...tag.names });
  };

  const handleSave = async () => {
    if (!editingTag) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: editingTag, names: editNames }),
      });
      const data = await res.json();
      if (res.ok) {
        setTags((prev) => {
          const idx = prev.findIndex((t) => t.slug === editingTag);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { slug: editingTag, names: editNames };
            return updated;
          }
          return [...prev, { slug: editingTag, names: editNames }];
        });
        setSuccess(`บันทึก #${editingTag} เรียบร้อย`);
        setEditingTag(null);
      } else {
        setError(data.error || "Failed to save");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagSlug.trim()) return;
    const slug = newTagSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Initialize with empty names
    const names: Record<string, string> = {};
    ALL_LOCALES.forEach(({ code }) => { names[code] = ""; });
    names["en"] = slug; // default: slug as English name

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, names }),
      });
      const data = await res.json();
      if (res.ok) {
        setTags((prev) => [...prev, { slug, names }]);
        setSuccess(`สร้าง #${slug} เรียบร้อย`);
        setShowNewTag(false);
        setNewTagSlug("");
      } else {
        setError(data.error || "Failed to create");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = tags.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.slug.includes(q) || Object.values(t.names).some((n) => n?.toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm mb-4">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm mb-4">
          <Check size={16} />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">✕</button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา tag..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
          />
        </div>
        <button
          onClick={() => setShowNewTag(!showNewTag)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm"
        >
          <Plus size={14} />
          เพิ่ม Tag
        </button>
      </div>

      {showNewTag && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 mb-4">
          <Hash size={16} className="text-white/30" />
          <input
            type="text"
            value={newTagSlug}
            onChange={(e) => setNewTagSlug(e.target.value)}
            placeholder="slug (เช่น family)"
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50"
          />
          <button
            onClick={handleCreateTag}
            disabled={saving || !newTagSlug.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm disabled:opacity-50"
          >
            {saving ? "..." : "สร้าง"}
          </button>
          <button onClick={() => setShowNewTag(false)} className="text-white/40 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">ไม่พบ tag</p>
        ) : (
          filtered.map((tag) => (
            <div
              key={tag.slug}
              className="rounded-lg bg-white/5 border border-white/10 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => handleEdit(tag)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-amber-300/60" />
                  <span className="text-white font-mono text-sm">#{tag.slug}</span>
                  <span className="text-white/30 text-xs ml-2">
                    {Object.values(tag.names).filter(Boolean).length} / {ALL_LOCALES.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tag.names["th"] && (
                    <span className="text-white/60 text-xs">{tag.names["th"]}</span>
                  )}
                  <span className="text-white/30 text-xs">✎</span>
                </div>
              </button>

              {/* Edit Form */}
              {editingTag === tag.slug && (
                <div className="px-4 py-3 border-t border-white/5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ALL_LOCALES.map(({ code, label }) => (
                      <div key={code}>
                        <label className="block text-white/40 text-[10px] mb-1 uppercase">
                          {code} — {label}
                        </label>
                        <input
                          type="text"
                          value={editNames[code] || ""}
                          onChange={(e) => setEditNames({ ...editNames, [code]: e.target.value })}
                          placeholder={code === "en" ? tag.slug : ""}
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-amber-300/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingTag(null)}
                      className="px-3 py-1.5 rounded text-white/50 hover:text-white text-xs"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-xs disabled:opacity-50"
                    >
                      <Save size={12} />
                      {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-white/30 text-xs mt-4">
        ทั้งหมด {tags.length} tags {search && `(พบ ${filtered.length})`}
      </p>
    </div>
  );
}
