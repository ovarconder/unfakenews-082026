// ============================================================
// Admin: New Article
// ============================================================

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import ArticleEditor from "@/components/admin/article-editor";
import { adminFetch } from "@/lib/use-admin-fetch";
import type { ArticleFormData } from "@/components/admin/article-editor";

export default function NewArticlePage() {
  const router = useRouter();

  // ================================================================
  // Import JSON
  // ================================================================
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportLoading(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const targetSlug = payload?.article?.slug;
      if (!targetSlug) {
        setImportMsg({ type: "error", text: "ไฟล์ JSON ไม่มี article.slug — ไม่สามารถ import ได้" });
        return;
      }

      const res = await adminFetch(`/api/admin/articles/${targetSlug}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        setImportMsg({ type: "error", text: result.error || "Import ล้มเหลว" });
        return;
      }

      // Import สำเร็จ → redirect ไปหน้า edit ของ slug นั้นเลย
      router.push(`/admin/articles/edit/${result.slug}`);
      router.refresh();
    } catch (err: unknown) {
      setImportMsg({
        type: "error",
        text: err instanceof Error ? err.message : "อ่านไฟล์ไม่ได้ หรือ JSON ผิดรูปแบบ",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleSave = async (data: ArticleFormData) => {
    const res = await adminFetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to create article");
    }

    // Redirect to edit page
    router.push(`/admin/articles/edit/${data.slug}`);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">เขียนบทความใหม่</h1>
          <p className="text-white/50 text-sm mt-1">สร้างบทความภาษาไทยฉบับเต็ม</p>
        </div>

        {/* ── Import JSON ── */}
        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={importLoading}
            title="Import บทความจากไฟล์ JSON (จากเว็บอื่นที่ใช้ schema เดียวกัน) — import แล้วจะเป็น draft"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-violet-400/30 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
            {importLoading ? "กำลัง Import..." : "Import JSON"}
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />

          {importMsg && (
            <div
              className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs max-w-sm ${
                importMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/30 text-red-300"
              }`}
            >
              {importMsg.type === "success" ? (
                <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={12} className="mt-0.5 shrink-0" />
              )}
              <span>{importMsg.text}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        <ArticleEditor onSave={handleSave} locale="th" />
      </div>
    </div>
  );
}

