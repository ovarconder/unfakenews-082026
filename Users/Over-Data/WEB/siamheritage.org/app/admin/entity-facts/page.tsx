// ============================================================
// Entity Facts Manager — Admin Page (บันทึกผ่าน DB)
// ============================================================
// หน้าจัดการ Entity Name (Title) และ Entity Quick Facts
// สำหรับบทความที่เป็นสารานุกรม เช่น โขนไทย, วัดพระแก้ว,
// ประเพณีสงกรานต์, ฯลฯ
//
// ใช้ API /api/admin/articles/[slug] (PUT) เพื่อบันทึกลง
// Supabase articles table โดยตรง (ไม่ใช่ in-memory)
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArticleMaster } from "@/lib/types";
import { Plus, Trash2, Save, AlertCircle, Check, Eye, EyeOff, X, RefreshCw, Database } from "lucide-react";

// ============================================================
// Entity Type ตัวเลือก
// ============================================================
const ENTITY_TYPES = [
  { value: "tradition", label: "🎭 วัฒนธรรม/ประเพณี" },
  { value: "place", label: "📍 สถานที่" },
  { value: "person", label: "👤 บุคคลสำคัญ" },
  { value: "object", label: "🏺 วัตถุ/ศิลปวัตถุ" },
  { value: "event", label: "📅 เหตุการณ์" },
  { value: "concept", label: "💡 แนวคิด/ความเชื่อ" },
  { value: "other", label: "🔖 อื่นๆ" },
];

// ============================================================
// Article Selector (fetch from API)
// ============================================================
function ArticleSelector({
  selectedSlug,
  onSelect,
}: {
  selectedSlug: string;
  onSelect: (slug: string, article: ArticleMaster) => void;
}) {
  const [articles, setArticles] = useState<ArticleMaster[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.originalTitle.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-2">
        เลือกบทความ
      </label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อบทความ..."
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 mb-2"
      />
      {loading ? (
        <div className="py-3 text-center text-white/30 text-xs">กำลังโหลด...</div>
      ) : (
        <select
          value={selectedSlug}
          onChange={(e) => {
            const article = articles.find((a) => a.slug === e.target.value);
            if (article) onSelect(e.target.value, article);
          }}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400/30"
          size={Math.min(filtered.length, 6)}
        >
          {filtered.map((a) => (
            <option key={a.slug} value={a.slug} className="py-1">
              {a.originalTitle}
            </option>
          ))}
          {filtered.length === 0 && (
            <option disabled className="text-white/30">
              ไม่พบบทความ
            </option>
          )}
        </select>
      )}
    </div>
  );
}

// ============================================================
// Quick Fact Row (ไม่มี labelEn)
// ============================================================
function QuickFactRow({
  index,
  fact,
  onChange,
  onRemove,
}: {
  index: number;
  fact: { label: string; value: string };
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5 group">
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={fact.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder="ชื่อฟิลด์ (TH)"
          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
        />
        <textarea
          value={fact.value}
          onChange={(e) => onChange(index, "value", e.target.value)}
          placeholder="ค่า..."
          rows={2}
          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 resize-none"
        />
      </div>
      <button
        onClick={() => onRemove(index)}
        className="p-1.5 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="ลบ"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function EntityFactsManagerPage() {
  const [articlesWithFacts, setArticlesWithFacts] = useState<ArticleMaster[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<ArticleMaster | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState<string>("tradition");
  const [wikidataId, setWikidataId] = useState("");
  const [facts, setFacts] = useState<{ label: string; value: string }[]>([]);

  // UI state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);

  // Fetch all articles and find those with entity facts on mount
  const refreshArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      if (data.articles) {
        setArticlesWithFacts(data.articles.filter((a: any) => a.entityName || a.quickFacts));
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Load article data when selected
  const handleSelectArticle = useCallback(
    (slug: string, article: ArticleMaster) => {
      setSelectedSlug(slug);
      setSelectedArticle(article);

      if (article.entityName || article.quickFacts) {
        setEntityName(article.entityName || article.originalTitle);
        setEntityType(article.entityType || "tradition");
        setWikidataId(article.wikidataId || "");
        setFacts(
          (article.quickFacts || []).map((f: any) => ({
            label: f.label,
            value: f.value,
          }))
        );
      } else {
        setEntityName(article.originalTitle);
        setEntityType("tradition");
        setWikidataId("");
        setFacts([{ label: "", value: "" }]);
      }
      setSaveStatus("idle");
      setErrors([]);
    },
    []
  );

  const handleFactChange = (index: number, field: string, value: string) => {
    setFacts((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const addFactRow = () => setFacts((prev) => [...prev, { label: "", value: "" }]);
  const removeFactRow = (index: number) => setFacts((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!entityName.trim()) errs.push("กรุณาใส่ Entity Name");
    if (facts.some((f) => !f.label.trim())) errs.push("กรุณาใส่ชื่อฟิลด์ของ Quick Facts ทุกแถว");
    if (facts.some((f) => !f.value.trim())) errs.push("กรุณาใส่ค่าของ Quick Facts ทุกแถว");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !selectedSlug) return;

    setSaveStatus("saving");
    setErrors([]);

    try {
      const cleanFacts = facts.filter((f) => f.label.trim() && f.value.trim());

      const res = await fetch(`/api/admin/articles/${selectedSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityName: entityName.trim() || undefined,
          entityType: entityType as any,
          wikidataId: wikidataId.trim() || undefined,
          quickFacts: cleanFacts.length > 0 ? cleanFacts : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      // Refresh the list and update selected article
      await refreshArticles();
      // Re-fetch selected article data
      const listRes = await fetch("/api/admin/articles");
      const listData = await listRes.json();
      if (listData.articles) {
        const updated = listData.articles.find((a: any) => a.slug === selectedSlug);
        if (updated) setSelectedArticle(updated);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err: any) {
      setErrors([err.message]);
      setSaveStatus("error");
    }
  };

  const handleDelete = async () => {
    if (!selectedSlug) return;
    if (!confirm(`ลบ Entity Facts ของ "${selectedArticle?.originalTitle}"?`)) return;

    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/articles/${selectedSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityName: null,
          entityType: null,
          wikidataId: null,
          quickFacts: null,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      await refreshArticles();

      // Reset form
      setEntityName("");
      setEntityType("tradition");
      setWikidataId("");
      setFacts([{ label: "", value: "" }]);
      setSelectedSlug("");
      setSelectedArticle(null);
      setSaveStatus("idle");
    } catch (err: any) {
      setErrors([err.message]);
      setSaveStatus("error");
    }
  };

  const previewJson = selectedSlug
    ? {
        slug: selectedSlug,
        entityFacts: {
          entityName,
          entityType,
          wikidataId: wikidataId || undefined,
          facts: facts.filter((f) => f.label.trim() && f.value.trim()),
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-[#060e1a]">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0f1f3a] to-[#162545]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Entity Facts Manager</h1>
              <p className="text-white/40 text-sm mt-1">
                จัดการ Entity Name และ Quick Facts (บันทึกลงฐานข้อมูล)
              </p>
            </div>
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-amber-300 text-xs transition-colors border border-white/10"
            >
              {preview ? <EyeOff size={14} /> : <Eye size={14} />}
              {preview ? "ซ่อน Preview" : "Preview JSON"}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
            <span>
              บทความที่มี Entity Facts: <strong className="text-amber-300">{articlesWithFacts.length}</strong> รายการ
            </span>
            {selectedArticle && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">
                กำลังแก้ไข: {selectedArticle.originalTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Article Selector + Saved List */}
          <div className="space-y-6">
            <ArticleSelector selectedSlug={selectedSlug} onSelect={handleSelectArticle} />

            {/* Saved Entity Facts List from DB */}
            <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-4">
              <h3 className="text-white font-semibold text-sm mb-3">
                Entity Facts ในฐานข้อมูล ({articlesWithFacts.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingList ? (
                  <p className="text-white/20 text-xs text-center py-4">กำลังโหลด...</p>
                ) : articlesWithFacts.length === 0 ? (
                  <p className="text-white/20 text-xs text-center py-4">
                    <Database size={16} className="inline mr-1 -mt-0.5" />
                    ยังไม่มี Entity Facts
                  </p>
                ) : (
                  articlesWithFacts.map((a) => (
                    <button
                      key={a.slug}
                      onClick={() => handleSelectArticle(a.slug, a)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        selectedSlug === a.slug
                          ? "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                          : "bg-white/[0.03] text-white/60 hover:bg-white/[0.06] border border-white/5"
                      }`}
                    >
                      <div className="font-medium truncate">{a.entityName || a.originalTitle}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">
                        {a.entityType || "—"} · {(a.quickFacts?.length || 0)} facts
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Center: Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedSlug ? (
              <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-8 text-center">
                <Database size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm">
                  เลือกบทความจากด้านซ้ายเพื่อเริ่มแก้ไข Entity Facts
                </p>
              </div>
            ) : (
              <>
                {/* Entity Info */}
                <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 space-y-4">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Plus size={14} className="text-amber-300" />
                    Entity Information
                  </h3>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">
                      Entity Name (TH) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder="เช่น โขนไทย, วัดพระแก้ว"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Entity Type</label>
                    <select
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400/30"
                    >
                      {ENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Wikidata ID (optional)</label>
                    <input
                      type="text"
                      value={wikidataId}
                      onChange={(e) => setWikidataId(e.target.value)}
                      placeholder="เช่น Q123456"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 font-mono"
                    />
                  </div>
                </div>

                {/* Quick Facts Editor */}
                <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <Plus size={14} className="text-amber-300" />
                      Quick Facts
                    </h3>
                    <button
                      onClick={addFactRow}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-400/10 text-amber-400 text-xs hover:bg-amber-400/20 transition-colors"
                    >
                      <Plus size={12} />
                      เพิ่มแถว
                    </button>
                  </div>
                  <div className="space-y-3">
                    {facts.map((fact, index) => (
                      <QuickFactRow
                        key={index}
                        index={index}
                        fact={fact}
                        onChange={handleFactChange}
                        onRemove={removeFactRow}
                      />
                    ))}
                    {facts.length === 0 && (
                      <p className="text-white/20 text-xs text-center py-3">
                        ยังไม่มี Quick Facts — กด "เพิ่มแถว"
                      </p>
                    )}
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    {errors.map((err, i) => (
                      <p key={i} className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === "saving"}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400/10 text-amber-300 text-sm hover:bg-amber-400/20 transition-colors border border-amber-400/20 disabled:opacity-50"
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <Check size={14} />
                          บันทึกแล้ว
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          บันทึก
                        </>
                      )}
                    </button>
                    {selectedArticle?.entityName && (
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors border border-red-500/20"
                      >
                        <Trash2 size={14} />
                        ลบ
                      </button>
                    )}
                  </div>
                  {saveStatus === "saved" && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check size={12} />
                      บันทึกลงฐานข้อมูลแล้ว
                    </span>
                  )}
                </div>

                {/* JSON Preview */}
                {preview && previewJson && (
                  <div className="rounded-xl bg-[#0a0f1a] border border-white/10 p-4">
                    <h3 className="text-white/50 text-xs font-mono mb-2">
                      JSON Preview (Entity Facts)
                    </h3>
                    <pre className="text-[10px] text-white/30 font-mono overflow-x-auto">
                      {JSON.stringify(previewJson, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
