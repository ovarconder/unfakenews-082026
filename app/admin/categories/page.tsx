// ============================================================
// Categories Manager — Admin Page
// ============================================================
// หน้าจัดการหมวดหมู่บทความ
// - CRUD Categories
// - แก้ไขชื่อไทย/อังกฤษ
// - แปลชื่อหมวดหมู่เป็น 14 ภาษา (ผ่าน API)
// ============================================================

"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Trash2,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  FileText,
  Globe,
  Image,
  GripVertical,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { adminFetch } from "@/lib/use-admin-fetch";

interface Category {
  id: string;
  slug: string;
  nameTH: string;
  nameEN: string;
  descriptionTH?: string;
  descriptionEN?: string;
  imageUrl?: string;
  sortOrder: number;
  articleCount: number;
}

interface CategoryForm {
  slug: string;
  nameTH: string;
  nameEN: string;
  descriptionTH: string;
  descriptionEN: string;
  imageUrl: string;
  sortOrder: number;
}

// ============================================================
// All 15 locales (for translation)
// ============================================================
const ALL_LOCALES_FOR_CATEGORIES = [
  "en", "zh", "ja", "es", "pt", "fr", "ko", "de", "ru", "ar", "hi", "it", "vi", "ms"
];

const defaultForm: CategoryForm = {
  slug: "",
  nameTH: "",
  nameEN: "",
  descriptionTH: "",
  descriptionEN: "",
  imageUrl: "",
  sortOrder: 0,
};

// ============================================================
// Main Page
// ============================================================
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // null = new
  const [form, setForm] = useState<CategoryForm>({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [translating, setTranslating] = useState<Set<string>>(new Set());
  const [previewTranslations, setPreviewTranslations] = useState<Map<string, any>>(new Map());

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/categories");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from TH name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F\s-]/g, "")
      .replace(/[\s]+/g, "-")
      .replace(/[\u0E00-\u0E7F]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  };

  const handleFormChange = (field: keyof CategoryForm, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-slug when nameTH changes and slug is empty or auto-generated
      if (field === "nameTH" && (!prev.slug || prev.slug === generateSlug(prev.nameTH))) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      slug: cat.slug,
      nameTH: cat.nameTH,
      nameEN: cat.nameEN,
      descriptionTH: cat.descriptionTH || "",
      descriptionEN: cat.descriptionEN || "",
      imageUrl: cat.imageUrl || "",
      sortOrder: cat.sortOrder,
    });
    setErrors([]);
    setSaveStatus("idle");
  };

  const startNew = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setErrors([]);
    setSaveStatus("idle");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setErrors([]);
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!form.nameTH.trim()) errs.push("กรุณากรอกชื่อหมวดหมู่ (ภาษาไทย)");
    if (!form.slug.trim()) errs.push("กรุณากรอก slug");
    if (!form.nameEN.trim()) errs.push("กรุณากรอกชื่อหมวดหมู่ (ภาษาอังกฤษ)");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setSaveStatus("idle");

    try {
      const apiUrl = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await adminFetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      await fetchCategories();
      setSaveStatus("saved");
      if (!editingId) cancelEdit();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err: any) {
      setErrors([err.message]);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`ลบหมวดหมู่ "${cat.nameTH}"?${
      cat.articleCount > 0 ? ` (มี ${cat.articleCount} บทความในหมวดนี้)` : ""
    }`)) return;

    try {
      const res = await adminFetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }

      await fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTranslate = async (cat: Category) => {
    setTranslating((prev) => new Set(prev).add(cat.id));

    try {
      // Translate nameTH and descriptionTH via translate-all API
      const res = await adminFetch("/api/translate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: {
            name: cat.nameTH,
            description: cat.descriptionTH || "",
          },
          sourceLocale: "th",
        }),
      });

      const data = await res.json();
      if (data.translations) {
        setPreviewTranslations((prev) => new Map(prev).set(cat.id, data.translations));
      }
    } catch (err: any) {
      console.error("Translation failed:", err);
    } finally {
      setTranslating((prev) => {
        const next = new Set(prev);
        next.delete(cat.id);
        return next;
      });
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.nameTH.toLowerCase().includes(search.toLowerCase()) ||
      c.nameEN.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060e1a]">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0f1f3a] to-[#162545]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-2xl font-bold text-white">จัดการหมวดหมู่</h1>
              <p className="text-white/40 text-sm mt-1">
                จัดการหมวดหมู่บทความภาษาไทย ({categories.length} หมวดหมู่)
              </p>
            </div>
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all text-sm"
            >
              <Plus size={16} />
              เพิ่มหมวดหมู่
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาหมวดหมู่..."
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
              />
            </div>

            {/* Categories List */}
            {loading ? (
              <div className="text-center py-12 text-white/30 text-sm">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                <FileText size={32} className="mx-auto mb-3 text-white/10" />
                ไม่พบหมวดหมู่
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((cat) => (
                  <div
                    key={cat.id}
                    className={`rounded-lg bg-gradient-to-br from-[#0f1f3a] to-[#162545] border overflow-hidden transition-all ${
                      editingId === cat.id
                        ? "border-amber-400/40 ring-1 ring-amber-400/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {cat.imageUrl && (
                              <img src={cat.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            )}
                            <div>
                              <h3 className="text-white font-medium text-sm">{cat.nameTH}</h3>
                              <p className="text-white/30 text-xs font-mono">{cat.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                            <span className="px-2 py-0.5 rounded bg-white/5">{cat.nameEN}</span>
                            <span>{cat.articleCount} บทความ</span>
                            <span>ลำดับ {cat.sortOrder}</span>
                          </div>
                          {cat.descriptionTH && (
                            <p className="text-white/50 text-xs mt-2 line-clamp-1">{cat.descriptionTH}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleTranslate(cat)}
                            disabled={translating.has(cat.id)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-emerald-300 transition-colors"
                            title="แปลเป็นภาษาต่างๆ"
                          >
                            {translating.has(cat.id) ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Globe size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-amber-300 transition-colors"
                            title="แก้ไข"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.85 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Translation Preview */}
                      {previewTranslations.has(cat.id) && (
                        <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/40 text-xs">คำแปลหมวดหมู่</span>
                            <button
                              onClick={() => {
                                setPreviewTranslations((prev) => {
                                  const next = new Map(prev);
                                  next.delete(cat.id);
                                  return next;
                                });
                              }}
                              className="text-white/20 hover:text-white text-[10px]"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(previewTranslations.get(cat.id) || {}).map(([locale, texts]: [string, any]) => (
                              <div key={locale} className="p-1.5 rounded bg-white/5">
                                <span className="text-white/30 text-[9px] uppercase">{locale}</span>
                                <p className="text-white/70 text-[10px] truncate">{texts?.name || "—"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Edit Form */}
          <div className="lg:col-span-2">
            {(editingId !== null || editingId === null) && (
              <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 space-y-4 sticky top-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Plus size={14} className="text-amber-300" />
                    {editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
                  </h3>
                  {editingId && (
                    <button onClick={cancelEdit} className="text-white/40 hover:text-white">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">
                    Slug <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleFormChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="category-slug"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 font-mono"
                  />
                </div>

                {/* Name TH */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">
                    ชื่อหมวดหมู่ (TH) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nameTH}
                    onChange={(e) => handleFormChange("nameTH", e.target.value)}
                    placeholder="เช่น มรดกไทย"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
                  />
                </div>

                {/* Name EN */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">
                    ชื่อหมวดหมู่ (EN) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nameEN}
                    onChange={(e) => handleFormChange("nameEN", e.target.value)}
                    placeholder="เช่น UnFake News"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
                  />
                </div>

                {/* Description TH */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">คำอธิบาย (TH)</label>
                  <textarea
                    value={form.descriptionTH}
                    onChange={(e) => handleFormChange("descriptionTH", e.target.value)}
                    placeholder="คำอธิบายภาษาไทย..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 resize-none"
                  />
                </div>

                {/* Description EN */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">คำอธิบาย (EN)</label>
                  <textarea
                    value={form.descriptionEN}
                    onChange={(e) => handleFormChange("descriptionEN", e.target.value)}
                    placeholder="English description..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 resize-none"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">
                    <Image size={12} className="inline mr-1" />
                    Image URL
                  </label>
                  <ImageUploader
                    value={form.imageUrl}
                    onChange={(url) => handleFormChange("imageUrl", url)}
                    previewHeight={100}
                    folder="categories"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">ลำดับ</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => handleFormChange("sortOrder", parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400/30"
                  />
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    {errors.map((err, i) => (
                      <p key={i} className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertCircle size={12} /> {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Save */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400/10 text-amber-300 text-sm hover:bg-amber-400/20 transition-colors border border-amber-400/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                    ) : saveStatus === "saved" ? (
                      <><Check size={14} /> บันทึกแล้ว</>
                    ) : (
                      <><Save size={14} /> บันทึก</>
                    )}
                  </button>
                  {editingId && (
                    <button onClick={cancelEdit} className="text-xs text-white/40 hover:text-white">
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
