// ============================================================
// Translation Dashboard — Multi-view Translation Manager
// ============================================================
// View Modes:
//   by_language — มองตามภาษา: แต่ละภาษา → รายการบทความ
//   by_article — มองตามบทความ: แต่ละบทความ → สถานะทุกภาษา (default)
//   by_category — มองตามหมวดหมู่: แต่ละหมวด → สถานะบทความ
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArticleMaster } from "@/lib/types";
import type { TranslationBatchLog } from "@/lib/translation-log-store";
import { addTranslationLog, getTranslationLog } from "@/lib/translation-log-store";
import { addNotification } from "@/lib/notification-store";
import { ALL_LOCALES, LOCALE_NAMES, getActiveLocales } from "@/lib/locales";
import type { Locale } from "@/lib/locales";
import {
  Globe, Search, FileText, RefreshCw, Check, AlertCircle,
  ChevronDown, ChevronRight, Clock, Play, Languages,
  LayoutGrid, List, Layers, Filter, X,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

type ViewMode = "by_article" | "by_language" | "by_category";
type FilterStatus = "all" | "complete" | "partial" | "pending" | "error";

interface TranslationInfo {
  locale: Locale;
  tier: 1 | 2;
  status: "complete" | "summary_only" | "pending" | "error";
  translatedAt?: string;
}

interface ArticleWithTranslations {
  master: ArticleMaster;
  translations: TranslationInfo[];
  overallStatus: "complete" | "partial" | "pending";
}

// Shared type for translation progress state
interface TranslationProgress {
  title: string;
  slug: string;
  progress: string;
  doneCount: number;
  totalCount: number;
  status: "translating" | "done" | "error";
  /** error messages (ถ้ามี) — format: "locale: message" */
  errorMessages?: string[];
}

// ============================================================
// Props
// ============================================================

interface TranslationDashboardProps {
  articles: ArticleMaster[];
  categories: { slug: string; nameTH: string; nameEN: string }[];
}

// ============================================================
// Main Component
// ============================================================

let logIdCounter = 0;
function generateLogId(): string {
  logIdCounter++;
  return `log_${Date.now()}_${logIdCounter}`;
}

export default function TranslationDashboard({ articles, categories }: TranslationDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("by_article");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterLocale, setFilterLocale] = useState<string>("");
  const [search, setSearch] = useState("");
  const [translating, setTranslating] = useState<Set<string>>(new Set());
  const [translationLogs, setTranslationLogs] = useState<TranslationBatchLog[]>([]);

  // ส่งสถานะการแปลไปยัง parent page ผ่าน CustomEvent
  const dispatchTranslationEvent = useCallback((data: {
    title: string;
    slug: string;
    progress: string;
    doneCount: number;
    totalCount: number;
    status: "translating" | "done" | "error";
  } | null) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("translation-progress", { detail: data }));
    }
  }, []);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  // ต้องประกาศ state ก่อน useCallback ที่อ้างถึง
  const [activeTranslation, setActiveTranslationInternal] = useState<TranslationProgress | null>(null);

  // setActiveTranslation wrapper — ส่ง event ไปยัง parent page ด้วย
  // รองรับทั้ง direct value และ callback form (prev => ...)
  const setActiveTranslation = useCallback(
    (data: TranslationProgress | null | ((prev: TranslationProgress | null) => TranslationProgress | null)) => {
      if (typeof data === "function") {
        const callback = data as (prev: TranslationProgress | null) => TranslationProgress | null;
        const prev = activeTranslation;
        const next = callback(prev);
        setActiveTranslationInternal(next);
        dispatchTranslationEvent(next);
      } else {
        setActiveTranslationInternal(data);
        dispatchTranslationEvent(data);
      }
    },
    [dispatchTranslationEvent, activeTranslation]
  );

  // Load logs on mount
  // ================================================================
  // ⚠️ beforeunload — ป้องกัน user ปิดหน้าต่างขณะกำลังแปล
  // ================================================================
  useEffect(() => {
    if (translating.size === 0) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "กำลังแปลบทความอยู่ หากออกตอนนี้งานแปลอาจไม่สมบูรณ์";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [translating.size]);

  useEffect(() => {
    setTranslationLogs(getTranslationLog());
  }, []);

  // Refresh logs periodically
  const refreshLogs = useCallback(() => {
    setTranslationLogs(getTranslationLog());
  }, []);

  // ================================================================
  // Build article translation status
  // ================================================================
  const buildArticleStatus = useCallback(async (master: ArticleMaster): Promise<ArticleWithTranslations> => {
    const translations: TranslationInfo[] = [];
    
    for (const locale of ALL_LOCALES) {
      if (locale === "th") {
        translations.push({ locale, tier: 1, status: "complete" });
        continue;
      }
      
      try {
        const res = await fetch(`/api/admin/translations/status?articleId=${master.id}&locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          translations.push({
            locale,
            tier: data.tier || 1,
            status: data.status || "pending",
            translatedAt: data.translatedAt,
          });
        } else {
          translations.push({ locale, tier: 1, status: "pending" });
        }
      } catch {
        translations.push({ locale, tier: 1, status: "pending" });
      }
    }

    const completeCount = translations.filter(t => t.status === "complete").length;
    const totalNonThai = translations.filter(t => t.locale !== "th").length;
    const overallStatus: "complete" | "partial" | "pending" =
      completeCount === totalNonThai ? "complete"
      : completeCount > 0 ? "partial"
      : "pending";

    return { master, translations, overallStatus };
  }, []);

  // ================================================================
  // Trigger translation for an article
  // ================================================================
  const triggerTranslate = async (master: ArticleMaster, locale?: string) => {
    const localesToTranslate = locale
      ? [locale]
      : ALL_LOCALES.filter(l => l !== "th");

    setTranslating(prev => new Set(prev).add(master.slug));
    setActiveTranslation({
      title: master.originalTitle,
      slug: master.slug,
      progress: `กำลังเตรียมแปล ${master.originalTitle}...`,
      doneCount: 0,
      totalCount: localesToTranslate.length,
      status: "translating",
    });

    const results: TranslationBatchLog["results"] = [];
    let done = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Fetch tier config once
    let tierConfig: Record<string, "0" | "1" | "2"> = {};
    try {
      const tiersRes = await fetch("/api/settings/tiers");
      const tiersData = await tiersRes.json();
      tierConfig = tiersData.tiers || {};
      // เก็บไว้ใน global เพื่อใช้ใน getTier() / isT1
      (window as any).__tierConfig = tierConfig;
    } catch {}

    for (const l of localesToTranslate) {
      // Skip disabled locales
      if (tierConfig[l] === "0") {
        results.push({ locale: l, status: "skipped", message: "Tier 0 (disabled)" });
        skippedCount++;
        done++;
        setActiveTranslation(prev => prev ? {
          ...prev,
          progress: `⏭️ ข้าม ${LOCALE_NAMES[l as Locale]?.native || l} (ปิดอยู่)`,
          doneCount: done,
        } : null);
        continue;
      }

      try {
        // Tier 2: skip content (JIT)
        const isTier2 = tierConfig[l] === "2";
        const res = await fetch("/api/translate-new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: master.slug,
            locale: l,
            dirtyFields: isTier2
              ? ["title", "short_excerpt", "long_excerpt", "tags", "image_alts", "entity_name", "quick_facts", "glossary"]
              : undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          results.push({ locale: l, status: "success" });
          successCount++;
        } else {
          results.push({ locale: l, status: "error", message: data.error });
          errorCount++;
        }
      } catch (err: any) {
        results.push({ locale: l, status: "error", message: err.message });
        errorCount++;
      }

      done++;
      setActiveTranslation(prev => prev ? {
        ...prev,
        progress: `${LOCALE_NAMES[l as Locale]?.native || l.toUpperCase()} — ${done}/${localesToTranslate.length}`,
        doneCount: done,
      } : null);
    }

    const finalStatus: "done" | "error" = errorCount > 0 && successCount === 0 ? "error" : "done";

    setActiveTranslation(prev => prev ? {
      ...prev,
      progress: finalStatus === "done"
        ? `✅ แปลครบ ${successCount}/${localesToTranslate.length} ภาษา${errorCount > 0 ? ` (${errorCount} error)` : ""}`
        : "❌ แปลไม่สำเร็จ",
      doneCount: successCount,
      status: finalStatus,
    } : null);

    // Save log
    const log: TranslationBatchLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      type: locale ? "single_article" : "auto_save",
      slug: master.slug,
      title: master.originalTitle,
      locales: localesToTranslate,
      results,
      summary: { success: successCount, error: errorCount, skipped: skippedCount },
    };
    addTranslationLog(log);
    refreshLogs();

    // 🔔 ส่ง Notification
    if (finalStatus === "done" && successCount > 0) {
      addNotification({
        type: "translation_done",
        title: `✅ แปล "${master.originalTitle}"`,
        message: `เสร็จ ${successCount}/${localesToTranslate.length} ภาษา${errorCount > 0 ? ` (⚠️${errorCount})` : ""}`,
        slug: master.slug,
        category: master.category,
      });
    }
    if (finalStatus === "error" || (errorCount > 0 && successCount === 0)) {
      addNotification({
        type: "translation_error",
        title: `❌ แปล "${master.originalTitle}" ล้มเหลว`,
        message: `ผิดพลาด ${errorCount}/${localesToTranslate.length} ภาษา — ${results.filter(r => r.status === "error").map(r => r.message).filter(Boolean).join("; ").slice(0, 100)}`,
        slug: master.slug,
        category: master.category,
      });
    }

    // Auto-dimiss after 5s
    setTimeout(() => {
      setActiveTranslation(null);
    }, 8000);

    setTranslating(prev => {
      const next = new Set(prev);
      next.delete(master.slug);
      return next;
    });
  };

  // ================================================================
  // Batch translate all untranslated articles
  // ================================================================
  const batchTranslateAll = async () => {
    const pendingArticles = await Promise.all(
      articles.map(a => buildArticleStatus(a))
    );

    const needsTranslate = pendingArticles.filter(
      a => a.overallStatus !== "complete"
    );

    if (needsTranslate.length === 0) {
      setActiveTranslation({
        title: "Batch Translate",
        slug: "batch",
        progress: "✅ ทุกบทความมีคำแปลครบแล้ว",
        doneCount: 0,
        totalCount: 0,
        status: "done",
      });
      setTimeout(() => setActiveTranslation(null), 3000);
      return;
    }

    setActiveTranslation({
      title: "Batch Translate",
      slug: "batch",
      progress: `กำลังแปล ${needsTranslate.length} บทความ...`,
      doneCount: 0,
      totalCount: needsTranslate.length,
      status: "translating",
    });

    let totalSuccess = 0;
    let totalError = 0;
    let articleDone = 0;

    for (const article of needsTranslate) {
      const localesToTranslate = ALL_LOCALES.filter(l => l !== "th");
      const results: TranslationBatchLog["results"] = [];

      for (const l of localesToTranslate) {
        try {
          const isTier2 = article.translations.find(t => t.locale === l)?.tier === 2;
          const res = await fetch("/api/translate-new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: article.master.slug,
              locale: l,
              dirtyFields: isTier2
                ? ["title", "short_excerpt", "long_excerpt", "tags", "image_alts", "entity_name", "quick_facts", "glossary"]
                : undefined,
            }),
          });
          const data = await res.json();
          if (data.success) {
            results.push({ locale: l, status: "success" });
            totalSuccess++;
          } else {
            results.push({ locale: l, status: "error", message: data.error });
            totalError++;
          }
        } catch {
          results.push({ locale: l, status: "error" });
          totalError++;
          // Update activeTranslation with error details
          setActiveTranslation(prev => prev ? {
            ...prev,
            errorMessages: [...(prev.errorMessages || []), `${LOCALE_NAMES[l as Locale]?.native || l}: Request failed`],
          } : null);
        }
      }

      articleDone++;
      setActiveTranslation(prev => prev ? {
        ...prev,
        progress: `แปลบทความ ${articleDone}/${needsTranslate.length} — สำเร็จ ${totalSuccess} รายการ`,
        doneCount: articleDone,
      } : null);

      const log: TranslationBatchLog = {
        id: generateLogId(),
        timestamp: new Date().toISOString(),
        type: "batch_all",
        slug: article.master.slug,
        title: article.master.originalTitle,
        locales: localesToTranslate,
        results,
        summary: {
          success: results.filter(r => r.status === "success").length,
          error: results.filter(r => r.status === "error").length,
          skipped: results.filter(r => r.status === "skipped").length,
        },
      };
      addTranslationLog(log);
    }

    refreshLogs();

    // 🔔 ส่ง Notification สำหรับ Batch
    if (totalSuccess > 0) {
      addNotification({
        type: "translation_done",
        title: `📦 Batch Translate เสร็จ`,
        message: `แปล ${articleDone} บทความ (✅${totalSuccess} รายการ${totalError > 0 ? ` ⚠️${totalError}` : ""})`,
        category: "batch",
      });
    }
    if (totalError > 0 && totalSuccess === 0) {
      addNotification({
        type: "translation_error",
        title: `📦 Batch Translate ล้มเหลว`,
        message: `ผิดพลาดทั้งหมด ${totalError} รายการ`,
        category: "batch",
      });
    }

    setActiveTranslation(prev => prev ? {
      ...prev,
      progress: totalError === 0
        ? `✅ แปลครบ ${articleDone} บทความ (${totalSuccess} รายการ)`
        : `⚠️ แปล ${articleDone} บทความ (✅${totalSuccess} ⚠️${totalError})`,
      status: "done",
    } : null);

    setTimeout(() => setActiveTranslation(null), 8000);
  };

  // ================================================================
  // Filtering
  // ================================================================
  const filteredBySearch = articles.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.originalTitle.toLowerCase().includes(q) || a.slug.includes(q);
  });

  const filteredByCategory = filterCategory
    ? filteredBySearch.filter(a => a.category === filterCategory)
    : filteredBySearch;

  // ================================================================
  // Render: By Article (default)
  // ================================================================
  const renderByArticle = () => (
    <div className="space-y-1">
      {filteredByCategory.map(master => {
        const isTranslating = translating.has(master.slug);
        // ใช้ tier config จริง (จาก locale_tiers ที่ fetch มา)
        // แทนที่จะ hardcode เป็น "1" เสมอ
        const getTier = (l: string): 1 | 2 => {
          const config = (window as any).__tierConfig || {};
          const val = config[l];
          if (val === "2") return 2;
          if (val === "1") return 1;
          return 1; // default
        };
        const tier = getTier;

        return (
          <div
            key={master.slug}
            className="rounded-lg bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 overflow-hidden hover:border-white/20 transition-all"
          >
            {/* Article row */}
            <div className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div>
                  <p className="text-white text-sm font-medium truncate">{master.originalTitle}</p>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    /{master.slug} · {master.category}
                  </p>
                </div>
              </div>

              {/* Status dots */}
              <div className="hidden md:flex items-center gap-1 mr-4">
                {ALL_LOCALES.filter(l => l !== "th").slice(0, 8).map(l => {
                  // We'll fetch real status later, for now show pending
                  return (
                    <span
                      key={l}
                      className="w-2 h-2 rounded-full bg-white/10"
                      title={`${LOCALE_NAMES[l as Locale]?.english || l}: pending`}
                    />
                  );
                })}
                <span className="text-white/20 text-[10px] ml-1">+{ALL_LOCALES.length - 9}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => triggerTranslate(master)}
                  disabled={isTranslating}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-300 text-xs hover:bg-amber-400/20 transition-colors border border-amber-400/20 disabled:opacity-50"
                >
                  {isTranslating ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} />
                  )}
                  {isTranslating ? "..." : "แปล"}
                </button>
                <button
                  onClick={() => setExpandedArticles(prev => {
                    const next = new Set(prev);
                    if (next.has(master.slug)) next.delete(master.slug);
                    else next.add(master.slug);
                    return next;
                  })}
                  className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Expanded: Per-locale grid */}
            {expandedArticles.has(master.slug) && (
              <div className="border-t border-white/5 p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                  {ALL_LOCALES.filter(l => l !== "th").map(l => {
                    // ใช้ tier config จริง
            const tierVal = (window as any).__tierConfig?.[l] || "1";
            const isT1 = tierVal !== "2";
                    return (
                      <button
                        key={l}
                        onClick={() => triggerTranslate(master, l)}
                        disabled={isTranslating}
                        className={`p-2 rounded-lg border text-xs text-left hover:bg-white/5 transition-colors ${
                          "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-white font-medium">{LOCALE_NAMES[l as Locale]?.native || l}</span>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${
                            isT1 ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                          }`}>T{isT1 ? "1" : "2"}</span>
                        </div>
                        <span className="text-white/30 text-[10px]">Pending</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ================================================================
  // Render: By Language
  // ================================================================
  const renderByLanguage = () => {
    const activeLocales = ALL_LOCALES.filter(l => l !== "th");

    return (
      <div className="space-y-4">
        {activeLocales.map(locale => {
          const localeArticles = filteredByCategory;
          const doneCount = 0; // Will use real data later
          const totalCount = localeArticles.length;

          return (
            <div
              key={locale}
              className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 overflow-hidden"
            >
              {/* Language header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                    <Globe size={18} className="text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {LOCALE_NAMES[locale]?.native || locale}
                      <span className="text-white/40 text-sm ml-2 font-normal">
                        {LOCALE_NAMES[locale]?.english || locale}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        true ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                      }`}>
                        Tier 1
                      </span>
                      <span className="text-white/30 text-xs">
                        {doneCount}/{totalCount} บทความ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      // Translate all articles for this language
                      localeArticles.forEach(a => triggerTranslate(a, locale));
                    }}
                    disabled={translating.size > 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-300 text-xs hover:bg-amber-400/20 transition-colors border border-amber-400/20 disabled:opacity-50"
                  >
                    <Play size={10} />
                    แปลทั้งหมด
                  </button>
                </div>
              </div>

              {/* Article list for this language */}
              <div className="border-t border-white/5 divide-y divide-white/5">
                {localeArticles.slice(0, 5).map(master => (
                  <div key={master.slug} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs truncate">{master.originalTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Status indicator */}
                      <span className="w-2 h-2 rounded-full bg-white/10" />
                      <button
                        onClick={() => triggerTranslate(master, locale)}
                        disabled={translating.has(master.slug)}
                        className="text-[10px] text-white/30 hover:text-amber-300 transition-colors disabled:opacity-30 px-2 py-0.5 rounded hover:bg-white/5"
                      >
                        แปล
                      </button>
                    </div>
                  </div>
                ))}
                {localeArticles.length > 5 && (
                  <p className="px-4 py-2 text-white/20 text-[10px] text-center">
                    +{localeArticles.length - 5} บทความ
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ================================================================
  // Render: By Category
  // ================================================================
  const renderByCategory = () => {
    const cats = categories.length > 0 ? categories : [
      { slug: "heritage", nameTH: "มรดกไทย", nameEN: "Thai Heritage" },
      { slug: "tradition", nameTH: "ประเพณีไทย", nameEN: "Thai Traditions" },
      { slug: "wisdom", nameTH: "ภูมิปัญญาไทย", nameEN: "Thai Wisdom" },
      { slug: "food", nameTH: "อาหารไทย", nameEN: "Thai Cuisine" },
      { slug: "language", nameTH: "ภาษาไทย", nameEN: "Thai Language" },
      { slug: "crafts", nameTH: "ศิลปหัตถกรรม", nameEN: "Arts & Crafts" },
      { slug: "travel", nameTH: "ท่องเที่ยว", nameEN: "Travel" },
    ];

    return (
      <div className="space-y-4">
        {cats.map(cat => {
          const catArticles = filteredByCategory.filter(a => a.category === cat.nameTH || a.category === cat.nameEN);
          if (catArticles.length === 0) return null;

          return (
            <div
              key={cat.slug}
              className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => setExpandedCategories(prev => {
                  const next = new Set(prev);
                  if (next.has(cat.slug)) next.delete(cat.slug);
                  else next.add(cat.slug);
                  return next;
                })}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400/20 to-purple-500/10 border border-purple-400/20 flex items-center justify-center">
                    <Layers size={18} className="text-purple-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-semibold">
                      {cat.nameTH}
                      <span className="text-white/40 text-sm ml-2 font-normal">{cat.nameEN}</span>
                    </h3>
                    <p className="text-white/30 text-xs mt-0.5">{catArticles.length} บทความ</p>
                  </div>
                </div>
                <ChevronDown size={14} className="text-white/30" />
              </button>

              {/* Article list */}
              <div className="border-t border-white/5 divide-y divide-white/5">
                {(expandedCategories.has(cat.slug) ? catArticles : catArticles.slice(0, 3)).map(master => (
                  <div key={master.slug} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs truncate">{master.originalTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Mini status dots */}
                      <div className="flex items-center gap-0.5">
                        {ALL_LOCALES.filter(l => l !== "th").slice(0, 5).map(l => (
                          <span key={l} className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        ))}
                      </div>
                      <button
                        onClick={() => triggerTranslate(master)}
                        disabled={translating.has(master.slug)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 text-[10px] hover:bg-amber-400/20 transition-colors border border-amber-400/20 disabled:opacity-50"
                      >
                        {translating.has(master.slug) ? (
                          <RefreshCw size={10} className="animate-spin" />
                        ) : (
                          <Play size={10} />
                        )}
                        แปล
                      </button>
                    </div>
                  </div>
                ))}
                {!expandedCategories.has(cat.slug) && catArticles.length > 3 && (
                  <button
                    onClick={() => setExpandedCategories(prev => new Set(prev).add(cat.slug))}
                    className="w-full px-4 py-2 text-white/30 hover:text-white/60 text-[10px] transition-colors"
                  >
                    ดูทั้งหมด {catArticles.length} บทความ →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ================================================================
  // Main Render
  // ================================================================
  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={() => setViewMode("by_article")}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 ${
              viewMode === "by_article" ? "bg-amber-300/20 text-amber-300" : "text-white/50 hover:text-white"
            }`}
          >
            <FileText size={12} />
            บทความ
          </button>
          <button
            onClick={() => setViewMode("by_language")}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 ${
              viewMode === "by_language" ? "bg-amber-300/20 text-amber-300" : "text-white/50 hover:text-white"
            }`}
          >
            <Globe size={12} />
            ภาษา
          </button>
          <button
            onClick={() => setViewMode("by_category")}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 ${
              viewMode === "by_category" ? "bg-amber-300/20 text-amber-300" : "text-white/50 hover:text-white"
            }`}
          >
            <Layers size={12} />
            หมวดหมู่
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาบทความ..."
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
            />
          </div>

          {/* Filter by status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400/30"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="complete">แปลครบ</option>
            <option value="partial">แปลบางส่วน</option>
            <option value="pending">รอแปล</option>
          </select>

          {/* Batch translate button */}
          <button
            onClick={batchTranslateAll}
            disabled={translating.size > 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-300 text-xs hover:bg-emerald-400/20 transition-colors border border-emerald-400/20 disabled:opacity-50"
          >
            {translating.size > 0 ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Languages size={12} />
            )}
            แปลทั้งหมด
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {(filterStatus !== "all" || filterCategory) && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white/30 text-xs">ตัวกรอง:</span>
          {filterStatus !== "all" && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px]">
              {filterStatus === "complete" ? "แปลครบ"
               : filterStatus === "partial" ? "แปลบางส่วน"
               : "รอแปล"}
              <button onClick={() => setFilterStatus("all")} className="ml-1 hover:text-white">
                <X size={10} />
              </button>
            </span>
          )}
          {filterCategory && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-400/10 text-purple-300 text-[10px]">
              {filterCategory}
              <button onClick={() => setFilterCategory("")} className="ml-1 hover:text-white">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === "by_article" && renderByArticle()}
      {viewMode === "by_language" && renderByLanguage()}
      {viewMode === "by_category" && renderByCategory()}

      {/* Empty state */}
      {filteredByCategory.length === 0 && (
        <div className="text-center py-16">
          <Globe size={48} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/30 text-sm">ไม่พบบทความ</p>
        </div>
      )}
    </div>
  );
}
