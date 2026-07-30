// ============================================================
// Translation Manager — Admin Dashboard v2
// ============================================================
// Multi-view (บทความ / ภาษา / หมวดหมู่)
// พร้อม Translation Toast + Persistent History
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ArticleMaster } from "@/lib/types";
import { ALL_LOCALES, LOCALE_NAMES, isTier1 } from "@/lib/locales";
import TranslationDashboard from "@/components/admin/translation-dashboard";
import { TranslationToast } from "@/components/admin/translation-toast";
import { Globe, FileText, Languages, RefreshCw, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { getTranslationLog, clearTranslationLog } from "@/lib/translation-log-store";
import type { TranslationBatchLog } from "@/lib/translation-log-store";

const SESSION_KEY = "siam_admin_session";

export default function TranslationsAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [articles, setArticles] = useState<ArticleMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTranslation, setActiveTranslation] = useState<{
    title: string;
    slug: string;
    progress: string;
    doneCount: number;
    totalCount: number;
    status: "translating" | "done" | "error";
  } | null>(null);
  const [categories, setCategories] = useState<{ slug: string; nameTH: string; nameEN: string }[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [logs, setLogs] = useState<TranslationBatchLog[]>([]);

  useEffect(() => {
    // Check auth
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.push("/admin/login");
      return;
    }

    let userData;
    try {
      userData = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      router.push("/admin/login");
      return;
    }

    setUser(userData);

    // Load articles
    fetch("/api/admin/articles")
      .then(res => res.json())
      .then(data => {
        if (data.articles) setArticles(data.articles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load categories
    fetch("/api/admin/categories")
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setCategories(data);
        else if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);

    // Load translation logs
    setLogs(getTranslationLog());
  }, [router]);

  // Listen for translation active state from dashboard
  useEffect(() => {
    const handler = () => {
      setLogs(getTranslationLog());
    };

    // Poll logs every 5 seconds while any translation might be happening
    const interval = setInterval(handler, 5000);
    window.addEventListener("storage", handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // We expose setActiveTranslation via a custom event for child components
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setActiveTranslation(e.detail);
    };
    window.addEventListener("translation-progress" as any, handler as any);
    return () => window.removeEventListener("translation-progress" as any, handler as any);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const tiers = [
    ...new Set(ALL_LOCALES.filter(l => l !== "th").map(l => isTier1(l) ? 1 : 2)),
  ].sort();

  // Stats
  const totalArticles = articles.length;
  const localesCount = ALL_LOCALES.filter(l => l !== "th").length;
  const tier1Count = ALL_LOCALES.filter(l => l !== "th" && isTier1(l)).length;
  const tier2Count = localesCount - tier1Count;

  return (
    <div className="min-h-screen bg-[#060e1a]">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0f1f3a] to-[#162545]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-2xl font-bold text-white flex items-center gap-2">
                <Globe size={24} className="text-amber-400" />
                Translation Manager
              </h1>
              <p className="text-white/40 text-sm mt-1">
                จัดการระบบแปลภาษา {localesCount} ภาษา • {totalArticles} บทความ
              </p>
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-white font-semibold">{totalArticles}</div>
                <div className="text-white/30">บทความ</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-semibold">{tier1Count}</div>
                <div className="text-white/30">Tier 1</div>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-semibold">{tier2Count}</div>
                <div className="text-white/30">Tier 2</div>
              </div>
              <button
                onClick={() => setShowLog(!showLog)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                <Clock size={14} />
                <span className="hidden sm:inline">ประวัติ</span>
                {showLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Language legend */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/40 mr-1">Tier 1 (Full Content):</span>
            {ALL_LOCALES.filter(l => l !== "th" && isTier1(l)).map(l => (
              <span key={l} className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                {LOCALE_NAMES[l]?.native || l}
              </span>
            ))}
            <span className="text-white/20 mx-1">|</span>
            <span className="text-white/40 mr-1">Tier 2 (SEO + JIT):</span>
            {ALL_LOCALES.filter(l => !isTier1(l)).map(l => (
              <span key={l} className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300/70 border border-amber-400/20">
                {LOCALE_NAMES[l]?.native || l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <TranslationDashboard
          articles={articles}
          categories={categories}
        />
      </div>

      {/* Translation Toast */}
      <TranslationToast activeTranslation={activeTranslation} />

      {/* Translation Log Panel (collapsible) */}
      {showLog && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setShowLog(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-50 w-full max-w-2xl max-h-[80vh] rounded-xl bg-[#0f1f3a] border border-white/10 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                ประวัติการแปล
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    clearTranslationLog();
                    setLogs([]);
                  }}
                  className="text-xs text-white/30 hover:text-red-400 transition-colors"
                >
                  ล้างประวัติ
                </button>
                <button
                  onClick={() => setShowLog(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[65vh] p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 text-sm">ยังไม่มีประวัติการแปล</p>
                  <p className="text-white/20 text-xs mt-1">เมื่อคุณแปลบทความ ประวัติจะแสดงที่นี่</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium truncate">
                            {log.title || log.slug}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                            log.type === "auto_save" ? "bg-blue-400/10 text-blue-300"
                            : log.type === "batch_all" ? "bg-purple-400/10 text-purple-300"
                            : log.type === "single_article" ? "bg-amber-400/10 text-amber-300"
                            : "bg-white/10 text-white/50"
                          }`}>
                            {log.type === "auto_save" ? "Auto"
                            : log.type === "batch_all" ? "Batch"
                            : log.type === "single_article" ? "Manual"
                            : log.type}
                          </span>
                        </div>
                        <p className="text-white/30 text-xs">
                          {new Date(log.timestamp).toLocaleString("th-TH", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          })}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {log.results.map(r => (
                            <span
                              key={r.locale}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                r.status === "success" ? "bg-emerald-400/10 text-emerald-300"
                                : r.status === "error" ? "bg-red-400/10 text-red-300"
                                : "bg-white/5 text-white/30"
                              }`}
                              title={r.message || r.locale}
                            >
                              {r.locale.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-emerald-400">✓{log.summary.success}</div>
                        {log.summary.error > 0 && <div className="text-xs text-red-400">✗{log.summary.error}</div>}
                        {log.summary.skipped > 0 && <div className="text-xs text-white/30">−{log.summary.skipped}</div>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
