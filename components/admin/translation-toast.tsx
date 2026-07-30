// ============================================================
// Translation Toast with History
// ============================================================
// แสดง Toast ขณะกำลังแปล + เก็บประวัติให้ดูภายหลัง
// - Persistent (sessionStorage) — เปลี่ยนหน้าก็ยังดูได้
// - ไม่หายไปถ้า user ไม่เห็น
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, AlertCircle, Loader2, Clock, ChevronDown, ChevronUp, Languages } from "lucide-react";
import type { TranslationBatchLog } from "@/lib/translation-log-store";
import { getTranslationLog, clearTranslationLog } from "@/lib/translation-log-store";

interface TranslationToastProps {
  /** ค่าปัจจุบันของการแปล (null = หยุดแสดง) */
  activeTranslation: {
    title: string;
    slug: string;
    progress: string;
    doneCount: number;
    totalCount: number;
    status: "translating" | "done" | "error";
    /** error messages (ถ้ามี) */
    errorMessages?: string[];
  } | null;
}

export function TranslationToast({ activeTranslation }: TranslationToastProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [logs, setLogs] = useState<TranslationBatchLog[]>([]);
  const [showToast, setShowToast] = useState(true);

  // Refresh log when activeTranslation changes
  useEffect(() => {
    setLogs(getTranslationLog());
    if (activeTranslation?.status === "translating") {
      setShowToast(true);
    }
  }, [activeTranslation]);

  const refreshLogs = useCallback(() => {
    setLogs(getTranslationLog());
  }, []);

  // Refresh logs every 3 seconds while translating
  useEffect(() => {
    if (activeTranslation?.status !== "translating") return;
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, [activeTranslation?.status, refreshLogs]);

  const handleClearLog = () => {
    clearTranslationLog();
    setLogs([]);
  };

  if (!activeTranslation && logs.length === 0) return null;

  return (
    <>
      {/* Active translation toast */}
      {activeTranslation && showToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-slide-up">
          <div className={`rounded-xl p-4 border shadow-2xl backdrop-blur-xl ${
            activeTranslation.status === "translating" ? "bg-blue-900/80 border-blue-400/30"
            : activeTranslation.status === "done" ? "bg-emerald-900/80 border-emerald-400/30"
            : "bg-red-900/80 border-red-400/30"
          }`}>
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {activeTranslation.status === "translating" ? (
                  <Loader2 size={18} className="text-blue-300 animate-spin" />
                ) : activeTranslation.status === "done" ? (
                  <Check size={18} className="text-emerald-300" />
                ) : (
                  <AlertCircle size={18} className="text-red-300" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  {activeTranslation.status === "translating" ? "กำลังแปลภาษา"
                  : activeTranslation.status === "done" ? "แปลเสร็จสมบูรณ์"
                  : "เกิดข้อผิดพลาด"}
                </p>
                <p className="text-white/60 text-xs mt-0.5 truncate">
                  {activeTranslation.title}
                </p>

                {/* Progress bar */}
                {activeTranslation.status === "translating" && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-white/50 mb-1">
                      <span>{activeTranslation.progress}</span>
                      <span>{activeTranslation.doneCount}/{activeTranslation.totalCount}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${(activeTranslation.doneCount / Math.max(activeTranslation.totalCount, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error detail — clickable */}
                {activeTranslation.status === "error" && activeTranslation.errorMessages && activeTranslation.errorMessages.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        const details = activeTranslation.errorMessages!.join("\n\n");
                        alert(`รายละเอียดข้อผิดพลาด:\n\n${details}`);
                      }}
                      className="text-[10px] text-red-300/70 hover:text-red-300 underline transition-colors"
                    >
                      ⚠️ เกิด {activeTranslation.errorMessages.length} ข้อผิดพลาด — คลิกดูรายละเอียด
                    </button>
                  </div>
                )}

                {/* Done summary */}
                {activeTranslation.status === "done" && (
                  <p className="text-emerald-300/70 text-xs mt-1">
                    ✓ {activeTranslation.doneCount} ภาษา
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* View history link */}
            <button
              onClick={() => setShowHistory(true)}
              className="mt-2 text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              ดูประวัติการแปล →
            </button>
          </div>
        </div>
      )}

      {/* History Panel (bottom-left) */}
      {showHistory && (
        <div className="fixed bottom-4 left-4 z-50 max-w-md w-full max-h-[60vh] animate-slide-up">
          <div className="rounded-xl bg-[#0f1f3a] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                ประวัติการแปล
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearLog}
                  className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
                >
                  ล้าง
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Log list */}
            <div className="overflow-y-auto max-h-[50vh] p-2 space-y-1">
              {logs.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">ยังไม่มีประวัติการแปล</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium truncate">
                            {log.title || log.slug}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                            log.type === "auto_save" ? "bg-blue-400/10 text-blue-300"
                            : log.type === "batch_all" ? "bg-purple-400/10 text-purple-300"
                            : "bg-amber-400/10 text-amber-300"
                          }`}>
                            {log.type === "auto_save" ? "Auto" : log.type === "batch_all" ? "Batch" : "Manual"}
                          </span>
                        </div>
                        <p className="text-white/30 text-[10px] mt-0.5">
                          {new Date(log.timestamp).toLocaleString("th-TH")}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-emerald-400">✓{log.summary.success}</span>
                          {log.summary.error > 0 && (
                            <span className="text-red-400">✗{log.summary.error}</span>
                          )}
                          {log.summary.skipped > 0 && (
                            <span className="text-white/30">−{log.summary.skipped}</span>
                          )}
                          <span className="text-white/30">|</span>
                          <span className="text-white/50">{log.locales.length} ภาษา</span>
                        </div>
                      </div>
                    </div>
                    {/* Per-locale detail */}
                    {log.results.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {log.results.map(r => (
                          <span
                            key={r.locale}
                            className={`text-[9px] px-1 py-0.5 rounded ${
                              r.status === "success" ? "bg-emerald-400/10 text-emerald-300"
                              : r.status === "error" ? "bg-red-400/10 text-red-300"
                              : "bg-white/5 text-white/30"
                            }`}
                            title={r.message}
                          >
                            {r.locale.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating button to show history (when toast is hidden but logs exist) */}
      {!showHistory && logs.length > 0 && !activeTranslation && (
        <button
          onClick={() => setShowHistory(true)}
          className="fixed bottom-4 left-4 z-50 p-2 rounded-full bg-[#0f1f3a] border border-white/10 shadow-lg hover:bg-[#162545] transition-colors"
          title="ดูประวัติการแปล"
        >
          <Clock size={16} className="text-amber-400" />
        </button>
      )}
    </>
  );
}
