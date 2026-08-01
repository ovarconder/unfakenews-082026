// ============================================================
// Admin: Highlights Client
// ============================================================
// UI สำหรับจัดการบทความ "เด่น/ไฮไลต์" ที่แสดงบนหน้าหลัก
// - ค้นหาได้ (search)
// - ติ๊กตั้ง / เอาออก highlight ได้ทันที
// - แสดงจำนวน highlight ที่เลือกอยู่ (สูงสุดแนะนำ 6 อัน)
// ============================================================

"use client";

import { useState } from "react";
import { Search, Star, StarOff, AlertCircle, Check, ChevronDown } from "lucide-react";
import type { ArticleMaster } from "@/lib/types";

interface HighlightsClientProps {
  articles: ArticleMaster[];
  categoryMap?: Record<string, string>;
  userRole: string;
}

const MAX_HIGHLIGHTS = 6;

export default function HighlightsClient({
  articles,
  categoryMap = {},
  userRole,
}: HighlightsClientProps) {
  const [search, setSearch] = useState("");
  const [filterHighlight, setFilterHighlight] = useState<"all" | "on">("all");
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = userRole === "admin";
  const isEditor = userRole === "editor";
  const canEdit = isAdmin || isEditor;

  // List that respects filters
  const filtered = articles
    .filter((a) => {
      const q = search.toLowerCase();
      if (q && !a.originalTitle.toLowerCase().includes(q) && !a.slug.toLowerCase().includes(q)) {
        return false;
      }
      if (filterHighlight === "on" && !a.featured) return false;
      return true;
    })
    .sort((a, b) => {
      // featured ก่อนเสมอ
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      return (a.publishedAt || "").localeCompare(b.publishedAt || "") || 0;
    });

  const highlightedCount = articles.filter((a) => a.featured).length;
  const showingCount = filtered.length;

  const toggleHighlight = async (article: ArticleMaster) => {
    if (!canEdit) return;

    const nextVal = !article.featured;
    // ถ้ากำลังจะเปิดเพิ่ม แต่เต็มแล้ว → บล็อก
    if (nextVal && !article.featured && highlightedCount >= MAX_HIGHLIGHTS) {
      setError(`เปิดไฮไลต์ได้สูงสุด ${MAX_HIGHLIGHTS} บทความ กรุณาเอาบางรายการออกก่อน`);
      setNotice(null);
      return;
    }

    setUpdatingSlug(article.slug);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/articles/${article.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-data": sessionStorage.getItem("siam_admin_session")
            ? btoa(encodeURIComponent(sessionStorage.getItem("siam_admin_session") || ""))
            : "",
        },
        body: JSON.stringify({ featured: nextVal }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ไม่สามารถอัปเดตไฮไลต์ได้");
        return;
      }

      // Local state update: swap the article in the list
      // (เราจะ reload ใหม่เพื่อความถูกต้อง — สลับ state แบบง่าย)
      setNotice(nextVal ? `✔ "ไฮไลต์" บทความ "${article.originalTitle}" แล้ว` : `ยกเลิก "ไฮไลต์" ของ "${article.originalTitle}" แล้ว`);

      // force reload to reflect from server
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingSlug(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-white flex items-center gap-2">
          <Star className="text-amber-300" size={22} />
          จัดการไฮไลต์ (หน้าหลัก)
        </h1>
        <p className="text-white/50 text-sm mt-1">
          เลือกบทความที่จะแสดงในส่วน Highlight ของหน้าแรก
          <span className="text-amber-300/70"> (แนะนำสูงสุด {MAX_HIGHLIGHTS} บทความ)</span>
        </p>
      </div>

      {/* Status + error/notice */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="px-3 py-1.5 rounded-lg bg-amber-300/10 border border-amber-300/20 text-amber-300 text-xs font-medium">
          ไฮไลต์อยู่: {highlightedCount}/{MAX_HIGHLIGHTS}
        </span>
        {!canEdit && (
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs">
            เฉพาะ Editor/Admin เท่านั้นที่แก้ได้
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm mb-4">
          <Check size={16} />
          {notice}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาโดยชื่อบทความหรือ slug..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">แสดง:</span>
          <div className="relative">
            <select
              value={filterHighlight}
              onChange={(e) => setFilterHighlight(e.target.value as "all" | "on")}
              className="appearance-none px-4 py-2 pr-8 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-300/50 text-sm"
            >
              <option value="all">ทั้งหมด</option>
              <option value="on">เฉพาะไฮไลต์</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Articles list */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Star size={32} className="mx-auto mb-2 opacity-30 text-amber-300" />
            <p className="text-white/40">
              {search ? "ไม่พบบทความที่ตรงกับการค้นหา" : "ยังไม่มีบทความ"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((article) => {
              const isOn = !!article.featured;
              const updating = updatingSlug === article.slug;
              return (
                <div
                  key={article.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isOn ? "bg-amber-300/5" : "hover:bg-white/5"
                  }`}
                >
                  {/* Toggle button */}
                  <button
                    onClick={() => toggleHighlight(article)}
                    disabled={updating || !canEdit}
                    title={isOn ? "เอาออกจากไฮไลต์" : "ตั้งเป็นไฮไลต์"}
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40 ${
                      isOn
                        ? "bg-amber-400/15 border-amber-400/40 text-amber-300 hover:bg-amber-400/25"
                        : "bg-white/5 border-white/10 text-white/30 hover:text-white hover:border-white/30"
                    }`}
                  >
                    {updating ? (
                      <div className="animate-spin w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full" />
                    ) : isOn ? (
                      <Star size={16} fill="currentColor" />
                    ) : (
                      <StarOff size={16} />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isOn ? "text-amber-200" : "text-white"}`}>
                      {article.originalTitle}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5 font-mono">
                      /{article.slug}
                      {categoryMap[article.category] && (
                        <span className="ml-2 font-sans text-amber-300/40">
                          {categoryMap[article.category]}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Order number if featured */}
                  {isOn && (
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 text-[10px] font-bold">
                      ★ ไฮไลต์
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-white/30 text-xs mt-4">
        แสดง {showingCount} จาก {articles.length} บทความ
      </p>
    </div>
  );
}
