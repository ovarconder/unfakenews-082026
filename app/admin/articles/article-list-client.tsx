// ============================================================
// Admin: Article List Client
// ============================================================

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Globe,
  Eye,
  MoreHorizontal,
  Star,
  AlertCircle,
  Languages,
} from "lucide-react";
import type { ArticleMaster } from "@/lib/types";
import { addNotification } from "@/lib/notification-store";

interface ArticleListClientProps {
  articles: ArticleMaster[];
  categoryMap?: Record<string, string>;
  currentUserId: string;
  userRole: string;
  canCreate: boolean;
  canDelete: boolean;
}

export default function ArticleListClient({
  articles,
  categoryMap: categoryMapProp,
  currentUserId,
  userRole,
  canCreate,
  canDelete,
}: ArticleListClientProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<"title" | "date" | "category">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [translatingBatch, setTranslatingBatch] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<string | null>(null);
  const [translatingSlug, setTranslatingSlug] = useState<string | null>(null);
  const [featuredToggling, setFeaturedToggling] = useState<string | null>(null);

  // categoryMap: from parent prop (page.tsx), fallback to empty
  const categoryMap = categoryMapProp || {};
  const categories = [...new Set(articles.map((a) => a.category))];

  // Permission helpers
  const isAdmin = userRole === "admin";
  const isEditor = userRole === "editor" || isAdmin;
  const isWriter = userRole === "writer";

  const canEditArticle = (article: ArticleMaster) => {
    // Editor/Admin can edit any article
    if (isEditor) return true;
    // Writer can only edit their own
    return isWriter && (article as any).authorId === currentUserId;
  };

  const canDeleteArticle = (article: ArticleMaster) => {
    return canDelete && (isEditor || ((article as any).authorId === currentUserId));
  };

  const canTranslateArticle = (article: ArticleMaster) => {
    // Only editor/admin can trigger translations
    return isEditor;
  };

  // Helper: count translated locales
  const getTranslatedCount = (a: ArticleMaster): number => {
    const status = (a as any).translationStatus;
    if (!status) return 0;
    return Object.values(status as Record<string, string>).filter(v => v === "complete").length;
  };

  let filtered = articles.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.originalTitle.toLowerCase().includes(q) && !a.slug.includes(q)) return false;
    }
    if (filterCategory && a.category !== filterCategory) return false;
    if (filterStatus === "featured" && !a.featured) return false;
    if (filterStatus === "translated" && getTranslatedCount(a) === 0) return false;
    if (filterStatus === "untranslated" && getTranslatedCount(a) > 0) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "title") cmp = a.originalTitle.localeCompare(b.originalTitle);
    else if (sortBy === "category") cmp = a.category.localeCompare(b.category);
    else cmp = a.publishedAt.localeCompare(b.publishedAt);
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Cycle sort column + direction
  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`แน่ใจว่าต้องการลบบทความ "${slug}"?`)) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Toggle featured (highlight) — editor/admin only
  const toggleFeatured = async (article: ArticleMaster) => {
    if (!isEditor) return;
    setFeaturedToggling(article.slug);
    try {
      const res = await fetch(`/api/admin/articles/${article.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-data": sessionStorage.getItem("siam_admin_session")
            ? btoa(encodeURIComponent(sessionStorage.getItem("siam_admin_session") || ""))
            : "",
        },
        body: JSON.stringify({ featured: !article.featured }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFeaturedToggling(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">บทความทั้งหมด</h1>
          <p className="text-white/50 text-sm mt-1">จัดการบทความภาษาไทย ({articles.length} เรื่อง)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Batch Translate Button */}
          {canCreate && (
            <button
              onClick={async () => {
                if (!confirm(`จะแปลบทความที่ยังไม่ได้แปลทั้งหมด ${articles.length} เรื่อง? (อาจใช้เวลานาน)`)) return;
                setTranslatingBatch(true);
                setTranslateProgress("กำลังโหลดการตั้งค่า...");
                try {
                  // 1. Get tier config
                  const tiersRes = await fetch("/api/settings/tiers");
                  const tiersData = await tiersRes.json();
                  const tierConfig: Record<string, "0" | "1" | "2"> = tiersData.tiers || {};
                  const localesToTranslate = Object.entries(tierConfig)
                    .filter(([locale, tier]) => locale !== "th" && tier !== "0")
                    .map(([locale]) => locale);

                  setTranslateProgress(`กำลังแปล ${articles.length} บทความ → ${localesToTranslate.length} ภาษา...`);

                  // 2. For each article, translate (sequentially to avoid rate limits)
                  let done = 0;
                  for (const article of articles) {
                    for (const locale of localesToTranslate) {
                      try {
                        await fetch("/api/translate-new", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ slug: article.slug, locale }),
                        });
                      } catch {
                        // continue despite errors
                      }
                    }
                    done++;
                    setTranslateProgress(`แปลแล้ว ${done}/${articles.length} บทความ`);
                  }

                  setTranslateProgress("แปลทั้งหมดเสร็จเรียบร้อย ✅");
                  addNotification({
                    type: "translation_done",
                    title: "📦 Batch Translate เสร็จ",
                    message: `แปล ${done}/${articles.length} บทความ`,
                    category: "batch",
                  });
                  setTimeout(() => setTranslateProgress(null), 3000);
                } catch (err) {
                  setTranslateProgress("เกิดข้อผิดพลาด ❌");
                  addNotification({
                    type: "translation_error",
                    title: "📦 Batch Translate ล้มเหลว",
                    message: "เกิดข้อผิดพลาดขณะ Batch Translate",
                    category: "batch",
                  });
                  console.error(err);
                } finally {
                  setTranslatingBatch(false);
                }
              }}
              disabled={translatingBatch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 transition-all text-sm disabled:opacity-50"
            >
              <Languages size={16} />
              {translatingBatch ? "กำลังแปล..." : "แปลทั้งหมด"}
            </button>
          )}

          {canCreate && (
            <Link
              href="/admin/articles/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              <Plus size={18} />
              เขียนบทความใหม่
            </Link>
          )}
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง หรือ slug..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-300/50 text-sm"
        >
          <option value="">หมวดหมู่ทั้งหมด</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-300/50 text-sm"
        >
          <option value="">สถานะทั้งหมด</option>
          <option value="featured">ไฮไลต์ (Highlight)</option>
          <option value="translated">มีคำแปลแล้ว</option>
          <option value="untranslated">ยังไม่มีคำแปล</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th
                  className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort("title")}
                >
                  บทความ {sortBy === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th
                  className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider hidden md:table-cell cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort("category")}
                >
                  หมวดหมู่ {sortBy === "category" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider hidden md:table-cell">ผู้เขียน</th>
                <th
                  className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort("date")}
                >
                  วันที่ {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="text-center px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                  <Star size={12} className="inline" />
                </th>
                <th className="text-right px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/40">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    ไม่พบบทความ
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium text-sm line-clamp-1">
                          {article.featured && (
                            <Star size={12} className="inline text-amber-300 mr-1" />
                          )}
                          {article.originalTitle}
                        </p>
                        <p className="text-white/30 text-xs mt-0.5 font-mono">/{article.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-amber-300/10 text-amber-300/80 text-[10px]">
                        {categoryMap[article.category] || article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm hidden md:table-cell">{article.author}</td>
                    <td className="px-4 py-3 text-white/40 text-sm hidden lg:table-cell">{article.publishedAt}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <button
                        onClick={() => toggleFeatured(article)}
                        disabled={!isEditor || featuredToggling === article.slug}
                        title={article.featured ? "เอาออกจากไฮไลต์ (Highlight)" : "ตั้งเป็นไฮไลต์ (Highlight)"}
                        className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                          article.featured
                            ? "bg-amber-400/15 border-amber-400/40 text-amber-300 hover:bg-amber-400/25"
                            : "bg-white/5 border-white/10 text-white/25 hover:text-amber-300 hover:border-amber-300/30"
                        }`}
                      >
                        {featuredToggling === article.slug ? (
                          <div className="animate-spin w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full" />
                        ) : article.featured ? (
                          <Star size={14} fill="currentColor" />
                        ) : (
                          <Star size={14} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview - visible to all (เพิ่ม ?preview=1 ให้ draft ดูได้) */}
                        <Link
                          href={`/${"th"}/articles/${article.slug}?preview=1`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-amber-300 transition-all"
                          title="ดูตัวอย่าง"
                        >
                          <Eye size={14} />
                        </Link>

                        {/* Translate - only editor/admin */}
                        {canTranslateArticle(article) && (
                          <button
                            onClick={async () => {
                              if (translatingSlug) return;
                              setTranslatingSlug(article.slug);
                              try {
                                // Get tier config
                                const tiersRes = await fetch("/api/settings/tiers");
                                const tiersData = await tiersRes.json();
                                const tierConfig: Record<string, "0" | "1" | "2"> = tiersData.tiers || {};
                                const localesToTranslate = Object.entries(tierConfig)
                                  .filter(([locale, tier]) => locale !== "th" && tier !== "0")
                                  .map(([locale]) => locale);

                                // Translate for all locales
                                await Promise.all(
                                  localesToTranslate.map(async (locale) => {
                                    await fetch("/api/translate-new", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ slug: article.slug, locale }),
                                    });
                                  })
                                );
                                addNotification({
                                  type: "translation_done",
                                  title: `✅ แปล "${article.originalTitle}"`,
                                  message: `เสร็จ ${localesToTranslate.length} ภาษา`,
                                  slug: article.slug,
                                  category: article.category,
                                });
                              } catch {
                                addNotification({
                                  type: "translation_error",
                                  title: `❌ แปล "${article.originalTitle}" ล้มเหลว`,
                                  message: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
                                  slug: article.slug,
                                  category: article.category,
                                });
                              } finally {
                                setTranslatingSlug(null);
                              }
                            }}
                            disabled={translatingSlug === article.slug}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-emerald-300 transition-all disabled:opacity-30"
                            title="เริ่มแปลภาษา"
                          >
                            {translatingSlug === article.slug ? (
                              <div className="animate-spin w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full" />
                            ) : (
                              <Globe size={14} />
                            )}
                          </button>
                        )}

                        {/* Edit - check ownership */}
                        {canEditArticle(article) ? (
                          <Link
                            href={`/admin/articles/edit/${article.slug}`}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-amber-300 transition-all"
                            title="แก้ไข"
                          >
                            <Edit size={14} />
                          </Link>
                        ) : (
                          <span
                            className="p-1.5 rounded text-white/20 cursor-not-allowed"
                            title={isWriter ? "คุณไม่สามารถแก้ไขบทความของคนอื่นได้" : ""}
                          >
                            <Edit size={14} />
                          </span>
                        )}

                        {/* Delete - check ownership */}
                        {canDeleteArticle(article) ? (
                          <button
                            onClick={() => handleDelete(article.slug)}
                            disabled={deleting === article.slug}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-all disabled:opacity-30"
                            title="ลบ"
                          >
                            {deleting === article.slug ? (
                              <div className="animate-spin w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        ) : (
                          <span
                            className="p-1.5 rounded text-white/20 cursor-not-allowed"
                            title={isWriter ? "คุณไม่สามารถลบบทความของคนอื่นได้" : ""}
                          >
                            <Trash2 size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress indicator */}
      {translateProgress && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-sm flex items-center gap-2">
          {translatingBatch ? (
            <div className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
          ) : (
            <span>✓</span>
          )}
          {translateProgress}
        </div>
      )}

      {/* Summary */}
      <p className="text-white/30 text-xs mt-4">
        แสดง {filtered.length} จาก {articles.length} บทความ
      </p>
    </div>
  );
}
