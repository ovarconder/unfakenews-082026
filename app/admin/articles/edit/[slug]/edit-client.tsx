// ============================================================
// Admin: Edit Article Client
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Globe, AlertCircle, Check } from "lucide-react";
import ArticleEditor from "@/components/admin/article-editor";
import { adminFetch } from "@/lib/use-admin-fetch";
import type { ArticleFormData } from "@/components/admin/article-editor";
import type { ArticleMaster, QuickFactEntry, GlossaryEntry } from "@/lib/types";
import { ALL_LOCALES, LOCALE_NAMES } from "@/lib/locales";

interface TranslationRow {
  locale: string;
  title?: string;
  content?: string;
  excerpt?: string;
  short_excerpt?: string;
  long_excerpt?: string;
  seo_title?: string;
  seo_description?: string;
  tags?: string[];
  entity_name?: string;
  quick_facts?: Record<string, unknown>;
  glossary?: Record<string, unknown>;
  google_schema_markup?: Record<string, unknown>;
  translation_status?: string;
  translated_at?: string;
}

interface EditArticleClientProps {
  article: ArticleMaster;
  articleId: string;
  translations: TranslationRow[];
}

// ─── helpers ──────────────────────────────────────────────────────

/**
 * หา translation สำหรับ locale ที่กำหนด
 * Fallback chain: locale → en → ภาษาไทย (original columns in articles)
 */
function findBestTranslation(
  translations: TranslationRow[],
  locale: string
): TranslationRow | undefined {
  // 1. locale ที่เลือก
  const direct = translations.find((t) => t.locale === locale);
  if (direct) return direct;
  // 2. fallback ภาษาอังกฤษ (ทุกภาษาที่ไม่ใช่ EN จะ fallback ไป EN ก่อน)
  if (locale !== "en") {
    const en = translations.find((t) => t.locale === "en");
    if (en) return en;
  }
  // 3. ไม่มี fallback เลย
  return undefined;
}

/**
 * สร้าง ArticleMaster-like object สำหรับ locale ที่เลือก
 * Fallback chain: locale → en → ภาษาไทย (original)
 *
 * ★ Slug ห้ามแก้ — ใช้ slug เดียวกันทุก locale
 */
function buildLocaleArticle(
  original: ArticleMaster,
  translations: TranslationRow[],
  locale: string
): ArticleMaster {
  // ภาษาไทย = ต้นฉบับ
  if (locale === "th") return original;

  const source = findBestTranslation(translations, locale);

  // ถ้าไม่มี translation เลย → ใช้ของภาษาไทย (original) ตามเดิม
  if (!source) return original;

  return {
    ...original,
    slug: original.slug,
    originalTitle: source.title || original.originalTitle,
    originalExcerpt: source.excerpt || original.originalExcerpt,
    originalContent: source.content || original.originalContent,
    tags: (source.tags && source.tags.length > 0) ? source.tags : original.tags,
    entityName: source.entity_name || original.entityName,
    quickFacts: Array.isArray(source.quick_facts) ? (source.quick_facts as QuickFactEntry[]) : original.quickFacts,
    glossary: Array.isArray(source.glossary) ? (source.glossary as GlossaryEntry[]) : original.glossary,
    googleSchemaMarkup: source.google_schema_markup || original.googleSchemaMarkup,
    shortExcerpt: (source.short_excerpt as string) || original.shortExcerpt,
    longExcerpt: (source.long_excerpt as string) || original.longExcerpt,
  };
}

export default function EditArticleClient({
  article,
  articleId,
  translations,
}: EditArticleClientProps) {
  const router = useRouter();

  // ================================================================
  // Locale state — เลือก locale ที่ต้องการแก้ไข
  // ================================================================
  const [selectedLocale, setSelectedLocale] = useState<string>("th");

  // Build locale-aware article — merge ข้อมูลจาก translations ตาม locale ที่เลือก
  const localeArticle = buildLocaleArticle(article, translations, selectedLocale);

  // Build locale status map
  const localeStatusMap: Record<string, "pending" | "complete" | "summary_only"> = {};
  const localeTranslations: Record<string, TranslationRow> = {};
  for (const t of translations) {
    localeTranslations[t.locale] = t;
    localeStatusMap[t.locale] =
      t.translation_status === "complete"
        ? "complete"
        : t.translation_status === "summary_only"
        ? "summary_only"
        : "pending";
  }
  // Fill missing locales
  for (const l of ALL_LOCALES) {
    if (l !== "th" && !localeStatusMap[l]) {
      localeStatusMap[l] = "pending";
    }
  }

  // ================================================================
  // Save
  //   locale === "th"  → save to articles table (ไม่ auto-translate)
  //   locale !== "th"  → save to translations table
  // ================================================================
  const handleSave = async (data: ArticleFormData) => {
    if (selectedLocale === "th") {
      // === บันทึกต้นฉบับภาษาไทย → articles table ===
      const res = await adminFetch(`/api/admin/articles/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

    const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update article");
      }

      // ★ ไม่ auto-translate ภาษาอังกฤษทันทีอีกต่อไป
      //   ให้กดปุ่ม "แปลอัตโนมัติ" ทีละภาษาเอง (ตั้งใจ design แบบ manual)

      router.refresh();
    } else {
      // === บันทึกคำแปล → translations table ===
      const body: Record<string, unknown> = {
        article_id: articleId,
        locale: selectedLocale,
        title: data.originalTitle || undefined,
        excerpt: data.originalExcerpt || undefined,
        content: data.originalContent || undefined,
        short_excerpt: data.shortExcerpt || undefined,
        long_excerpt: data.longExcerpt || undefined,
        tags: (data.tags && data.tags.length > 0) ? data.tags : undefined,
        entity_name: data.entityName || undefined,
        quick_facts: data.quickFacts || undefined,
        glossary: data.glossary || undefined,
        google_schema_markup: data.googleSchemaMarkup || undefined,
        translation_status: "complete",
        translated_at: new Date().toISOString(),
      };

      const res = await adminFetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save translation");
      }

      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`แน่ใจว่าต้องการลบบทความ "${article.originalTitle}"?`)) return;

    const res = await adminFetch(`/api/admin/articles/${article.slug}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/admin/articles");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete");
    }
  };

  // ================================================================
  // Auto-Translate per locale (แปลทีละภาษา)
  // ================================================================
  const [translatingLocale, setTranslatingLocale] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateSuccess, setTranslateSuccess] = useState<string | null>(null);

  // ★ Local status override — อัปเดตทันทีหลังกดปุ่มแปล (ไม่ต้องรอ router.refresh)
  //   เก็บ locale → "complete" | "summary_only"
  const [localStatus, setLocalStatus] = useState<
    Record<string, "complete" | "summary_only">
  >({});

  const handleAutoTranslate = async (locale: string) => {
    setTranslatingLocale(locale);
    setTranslateError(null);
    setTranslateSuccess(null);

    try {
      const res = await adminFetch("/api/translate-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: article.slug, locale }),
      });

      const data = await res.json();

      if (res.ok) {
        // กำหนดสถานะ label ทันทีจาก tier ที่ API ตอบกลับ
        //   tier "1" → complete (แปลเต็ม มี content)
        //   tier "2" → summary_only (transl headtopic/excerpt ไม่แปล content)
        const resultingStatus: "complete" | "summary_only" =
          data?.tier === "2" ? "summary_only" : "complete";
        setLocalStatus((prev) => ({ ...prev, [locale]: resultingStatus }));

        setTranslateSuccess(`✅ แปลภาษา ${LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]?.native || locale} สำเร็จ`);
        router.refresh();
        setTimeout(() => setTranslateSuccess(null), 5000);
      } else {
        setTranslateError(data.error || `❌ แปล ${locale} ล้มเหลว`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTranslateError(`❌ ${msg}`);
    } finally {
      setTranslatingLocale(null);
    }
  };

  // ================================================================
  // Manual Translation (เฉพาะ title, excerpt, content)
  // ================================================================
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualExcerpt, setManualExcerpt] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Manual translation submit
  const handleSaveManual = async () => {
    if (!manualTitle.trim() && !manualContent.trim()) {
      setManualError("กรุณากรอกชื่อหรือเนื้อหาที่แปล");
      return;
    }

    setManualSaving(true);
    setManualError(null);
    setManualSuccess(false);

    try {
      const body: Record<string, unknown> = {
        article_id: articleId,
        locale: selectedLocale,
      };
      if (manualTitle.trim()) body.title = manualTitle.trim();
      if (manualContent.trim()) body.content = manualContent.trim();
      if (manualExcerpt.trim()) body.excerpt = manualExcerpt.trim();
      body.translation_status = "complete";
      body.translated_at = new Date().toISOString();

      const res = await adminFetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setManualSuccess(true);
        setManualTitle("");
        setManualContent("");
        setManualExcerpt("");
        router.refresh();
        setTimeout(() => setManualSuccess(false), 3000);
      } else {
        const data = await res.json();
        setManualError(data.error || "Failed to save translation");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setManualError(msg);
    } finally {
      setManualSaving(false);
    }
  };

  // Load existing translation into manual form
  const loadTranslationIntoForm = useCallback((locale: string) => {
    const existing = localeTranslations[locale];
    if (existing) {
      setManualTitle(existing.title || "");
      setManualContent(existing.content || "");
      setManualExcerpt(existing.excerpt || existing.short_excerpt || "");
    } else {
      setManualTitle("");
      setManualContent("");
      setManualExcerpt("");
    }
    setManualError(null);
    setManualSuccess(false);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-white">แก้ไขบทความ</h1>
        <p className="text-white/50 text-sm mt-1">
          แก้ไขบทความ: {article.originalTitle}
          <span className="text-white/30 ml-2 font-mono">/{article.slug}</span>
        </p>
      </div>

      {/* ================================================================
           Locale Selector — เลือก locale ที่ต้องการแก้ไข
           ถ้าเลือก "th" = แก้ต้นฉบับภาษาไทย → articles table
           ถ้าเลือกภาษาอื่น = แก้คำแปล → translations table
      ================================================================ */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <label className="text-white/60 text-sm font-medium">เลือกภาษา</label>
          <div className="flex flex-wrap gap-2">
            {/* Thai = original language */}
            <button
              onClick={() => { setSelectedLocale("th"); setManualError(null); setManualSuccess(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                selectedLocale === "th"
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300 font-medium"
                  : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              <span>🇹🇭</span>
              <span>ไทย</span>
              <span className="text-[9px] opacity-60">TH</span>
            </button>

            {/* Other locales */}
            {ALL_LOCALES.filter((l) => l !== "th").map((locale) => {
              // ใช้ localStatus (อัปเดตทันทีหลังกดแปล) ถ้ามี ไม่งั้นใช้จาก prop translations
              const status = localStatus[locale] || localeStatusMap[locale];
              const isSelected = locale === selectedLocale;
              const isTranslating = translatingLocale === locale;
              return (
                <div key={locale} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedLocale(locale);
                      loadTranslationIntoForm(locale);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      isSelected
                        ? "border-amber-400/50 bg-amber-400/10 text-amber-300 font-medium"
                        : status === "complete"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : status === "summary_only"
                        ? "border-amber-400/20 bg-amber-400/5 text-amber-300/60"
                        : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold bg-black/20">
                      {status === "complete" ? "✓" : status === "summary_only" ? "○" : "—"}
                    </span>
                    <span>{LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]?.native || locale}</span>
                    <span className="text-[9px] opacity-60">{locale.toUpperCase()}</span>
                  </button>
                  {/* ปุ่มแปลอัตโนมัติ — แสดงตลอด แต่ disable ถ้า translate เสร็จแล้ว */}
                  <button
                    onClick={() => handleAutoTranslate(locale)}
                    disabled={
                      isTranslating ||
                      translatingLocale !== null ||
                      status === "complete"
                    }
                    title={
                      status === "complete"
                        ? `แปล ${LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]?.native || locale} เสร็จแล้ว`
                        : `แปลอัตโนมัติเป็น ${LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]?.native || locale}`
                    }
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border transition-all
                      ${
                        status === "complete"
                          ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-400/50 cursor-default"
                          : isSelected
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                          : "border-white/5 bg-white/5 text-white/30 hover:text-white/50 hover:border-white/20"
                      }
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isTranslating ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : status === "complete" ? (
                      <Check size={10} />
                    ) : (
                      <Globe size={10} />
                    )}
                    {isTranslating
                      ? "กำลังแปล..."
                      : status === "complete"
                      ? "แปลแล้ว"
                      : "แปลอัตโนมัติ"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info bar */}
        <div className={`px-3 py-2 rounded-lg text-xs ${
          selectedLocale === "th"
            ? "bg-amber-400/10 border border-amber-400/20 text-amber-300/80"
            : "bg-emerald-400/10 border border-emerald-400/20 text-emerald-300/80"
        }`}>
          {selectedLocale === "th"
            ? "🟡 กำลังแก้ไขต้นฉบับภาษาไทย — บันทึกแล้วไม่แปลอัตโนมัติ ให้กดปุ่ม \"แปลอัตโนมัติ\" ทีละภาษาเอาเอง"
            : selectedLocale === "en"
            ? "🟢 กำลังแก้ไขภาษาอังกฤษ — ภาษาที่ไม่มีคำแปลจะ fallback เป็นภาษาไทย"
            : `🟢 กำลังแก้ไข ${LOCALE_NAMES[selectedLocale as keyof typeof LOCALE_NAMES]?.native || selectedLocale} — ฟิลด์ที่ไม่มีคำแปลของภาษานี้จะ fallback เป็นภาษาอังกฤษ (ถ้ามี) หรือภาษาไทย`}
        </div>

        {/* Translate success/error messages */}
        {translateSuccess && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <span>{translateSuccess}</span>
          </div>
        )}
        {translateError && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle size={12} />
            <span>{translateError}</span>
          </div>
        )}
      </div>

      {/* ================================================================
           Manual Translation Manager (เฉพาะ title, excerpt, content)
           — ซ่อนเมื่อเลือกภาษาไทย (เพราะภาษาไทย = original)
      ================================================================ */}
      {selectedLocale !== "th" && (
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            แปลภาษาด้วยตนเอง (เฉพาะ Title, Excerpt, Content)
            <span className="text-xs text-white/30 font-normal">
              — {LOCALE_NAMES[selectedLocale as keyof typeof LOCALE_NAMES]?.native || selectedLocale}
            </span>
          </h2>

          <div className="space-y-3 border-t border-white/5 pt-4">
            <div>
              <label className="block text-white/50 text-xs mb-1">
                ชื่อเรื่องที่แปล ({selectedLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder={`ชื่อเรื่องภาษา ${LOCALE_NAMES[selectedLocale as keyof typeof LOCALE_NAMES]?.native || selectedLocale}...`}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">
                คำโปรย / Excerpt ({selectedLocale.toUpperCase()})
              </label>
              <textarea
                value={manualExcerpt}
                onChange={(e) => setManualExcerpt(e.target.value)}
                rows={2}
                placeholder="คำโปรยสั้นๆ (ไม่บังคับ)..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">
                เนื้อหาที่แปล ({selectedLocale.toUpperCase()})
              </label>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={6}
                placeholder="วางเนื้อหาที่แปลแล้ว..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>

            {manualError && (
              <p className="text-red-400 text-xs">{manualError}</p>
            )}
            {manualSuccess && (
              <p className="text-emerald-400 text-xs">✅ บันทึกคำแปลแล้ว!</p>
            )}

            <button
              onClick={handleSaveManual}
              disabled={manualSaving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold text-sm hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
            >
              {manualSaving ? "กำลังบันทึก..." : "บันทึกคำแปล"}
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
           Article Editor — รองรับทุก locale
           ถ้าเลือกไทย → แก้ไข articles table (ต้นฉบับ)
           ถ้าเลือกภาษาอื่น → แก้ไข translations table
      ================================================================ */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        <div className="mb-4 pb-3 border-b border-white/5">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span>📝</span>
            ฟิลด์ทั้งหมดของบทความ
            <span className="text-white/30 font-normal text-xs">
              ({selectedLocale === "th"
                ? "ต้นฉบับภาษาไทย"
                : `คำแปล ${LOCALE_NAMES[selectedLocale as keyof typeof LOCALE_NAMES]?.native || selectedLocale}`}
              )
            </span>
          </h3>
          <p className="text-white/30 text-xs mt-1">
            {selectedLocale === "th"
              ? "บันทึกที่ articles table (ต้นฉบับ) — แปลด้วยปุ่ม \"แปลอัตโนมัติ\" ด้านบน ทีละภาษา"
              : `บันทึกที่ translations table (ไม่กระทบต้นฉบับไทย) — Fallback chain: ${LOCALE_NAMES[selectedLocale as keyof typeof LOCALE_NAMES]?.native || selectedLocale} → อังกฤษ → ไทย`}
          </p>
        </div>

        {/* ★ key={selectedLocale} = force re-mount เพื่อให้ initialData ถูกต้องเมื่อเปลี่ยน locale */}
        <ArticleEditor
          key={selectedLocale}
          initialData={localeArticle}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
