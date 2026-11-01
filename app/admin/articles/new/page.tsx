// ============================================================
// Admin: New Article
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import ArticleEditor from "@/components/admin/article-editor";
import { adminFetch } from "@/lib/use-admin-fetch";
import type { ArticleFormData } from "@/components/admin/article-editor";

type ImportResult = { file: string; ok: boolean; slug?: string; error?: string };

export default function NewArticlePage() {
  const router = useRouter();

  // ภาษาต้นฉบับเริ่มต้นจาก Settings (รอโหลดก่อน render editor เพื่อให้ค่าเริ่มต้นถูก)
  const [defaultSourceLocale, setDefaultSourceLocale] = useState<string | null>(null);
  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDefaultSourceLocale(data?.settings?.defaultSourceLocale || "th"))
      .catch(() => setDefaultSourceLocale("th"));
  }, []);

  // ================================================================
  // Import JSON — เลือกได้หลายไฟล์ (import ทีละไฟล์ตามลำดับ)
  //   1 ไฟล์สำเร็จ → ไปหน้า edit ทันที (พฤติกรรมเดิม)
  //   หลายไฟล์    → แสดงสรุปผลรายไฟล์ พร้อมลิงก์ไปหน้า edit
  // ================================================================
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setImportLoading(true);
    setImportResults([]);

    // 1. อ่าน + ตรวจทุกไฟล์ก่อน (กัน slug ซ้ำกันเองในรอบเดียว — ไฟล์หลังจะทับไฟล์แรก)
    const parsed: { file: string; slug?: string; payload?: unknown; error?: string }[] = [];
    const seen = new Set<string>();
    for (const file of files) {
      try {
        const payload = JSON.parse(await file.text());
        const slug: string | undefined = payload?.article?.slug;
        if (!slug) {
          parsed.push({ file: file.name, error: "ไม่มี article.slug" });
        } else if (seen.has(slug)) {
          parsed.push({ file: file.name, slug, error: "slug ซ้ำกับไฟล์อื่นในรอบนี้" });
        } else {
          seen.add(slug);
          parsed.push({ file: file.name, slug, payload });
        }
      } catch {
        parsed.push({ file: file.name, error: "อ่านไฟล์ไม่ได้ หรือ JSON ผิดรูปแบบ" });
      }
    }

    // 2. เตือนถ้ามีบทความ slug เดียวกันอยู่แล้ว (import จะทับ + กลับเป็น draft)
    const valid = parsed.filter((p) => p.payload);
    const existing: string[] = [];
    for (const p of valid) {
      const res = await adminFetch(`/api/admin/articles/${p.slug}`).catch(() => null);
      if (res?.ok) existing.push(p.slug!);
    }
    if (
      existing.length > 0 &&
      !confirm(
        `มีบทความ slug นี้อยู่แล้ว ${existing.length} เรื่อง:\n${existing.join("\n")}\n\n` +
          `import จะเขียนทับและเปลี่ยนเป็น draft (ถ้า publish อยู่จะหายจากหน้าเว็บ) — ดำเนินการต่อ?`
      )
    ) {
      setImportLoading(false);
      return;
    }

    // 3. import ทีละไฟล์
    const results: ImportResult[] = parsed
      .filter((p) => p.error)
      .map((p) => ({ file: p.file, ok: false, slug: p.slug, error: p.error }));
    let done = 0;
    for (const p of valid) {
      setImportProgress(`กำลัง Import ${++done}/${valid.length}...`);
      try {
        const res = await adminFetch(`/api/admin/articles/${p.slug}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p.payload),
        });
        const result = await res.json();
        results.push(
          res.ok
            ? { file: p.file, ok: true, slug: result.slug }
            : { file: p.file, ok: false, slug: p.slug, error: result.error || "Import ล้มเหลว" }
        );
      } catch (err: unknown) {
        results.push({
          file: p.file,
          ok: false,
          slug: p.slug,
          error: err instanceof Error ? err.message : "Import ล้มเหลว",
        });
      }
    }
    setImportProgress(null);
    setImportLoading(false);

    if (files.length === 1 && results[0]?.ok) {
      router.push(`/admin/articles/edit/${results[0].slug}`);
      router.refresh();
      return;
    }
    setImportResults(results);
    router.refresh();
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
          <p className="text-white/50 text-sm mt-1">สร้างบทความต้นฉบับ (เลือกภาษาต้นฉบับได้ข้างช่อง slug)</p>
        </div>

        {/* ── Import JSON ── */}
        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={importLoading}
            title="Import บทความจากไฟล์ JSON (เลือกได้หลายไฟล์) — import แล้วจะเป็น draft"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-violet-400/30 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
            {importLoading ? importProgress || "กำลัง Import..." : "Import JSON"}
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            multiple
            className="hidden"
            onChange={handleImportFile}
          />

          {importResults.length > 0 && (
            <div className="flex flex-col gap-1 px-3 py-2 rounded-lg text-xs max-w-md bg-white/5 border border-white/10">
              <span className="text-white/60">
                Import สำเร็จ {importResults.filter((r) => r.ok).length}/{importResults.length} ไฟล์ — ทุกบทความเป็น draft
              </span>
              {importResults.map((r) => (
                <div
                  key={r.file}
                  className={`flex items-start gap-1.5 ${r.ok ? "text-emerald-300" : "text-red-300"}`}
                >
                  {r.ok ? (
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={12} className="mt-0.5 shrink-0" />
                  )}
                  {r.ok ? (
                    <Link href={`/admin/articles/edit/${r.slug}`} className="underline hover:text-emerald-200">
                      {r.slug}
                    </Link>
                  ) : (
                    <span>
                      {r.file}: {r.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        {defaultSourceLocale ? (
          <ArticleEditor onSave={handleSave} defaultSourceLocale={defaultSourceLocale} />
        ) : (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <RefreshCw size={14} className="animate-spin" /> กำลังโหลด...
          </div>
        )}
      </div>
    </div>
  );
}

