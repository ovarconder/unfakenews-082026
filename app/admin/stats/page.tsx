// ============================================================
// Admin: Statistics Dashboard
// ============================================================
// หน้าแสดงสถิติคร่าว ๆ ของระบบ
// - จำนวนบทความ
// - จำนวนผู้ใช้งาน
// - จำนวน Hero Slides
// - จำนวนการแปล
// - จำนวนหมวดหมู่
// - สถานะบทความ
// - บทความล่าสุด

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Image,
  Globe,
  BookOpen,
  TrendingUp,
  Activity,
  Clock,
  Eye,
  Plus,
  ArrowRight,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface StatsData {
  totalArticles: number;
  totalPublished: number;
  totalDraft: number;
  totalPendingReview: number;
  totalHidden: number;
  totalUsers: number;
  totalSlides: number;
  totalActiveSlides: number;
  totalTranslations: number;
  totalCategories: number;
  totalLanguages: number;
  latestArticles: {
    title: string;
    slug: string;
    status: string;
    publishedAt: string;
  }[];
}

// ============================================================
// Main Component
// ============================================================

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Gather all stats in parallel
        const [articlesRes, usersRes, slidesRes] = await Promise.all([
          fetch("/api/admin/articles"),
          fetch("/api/admin/users"),
          fetch("/api/hero-slides"),
        ]);

        const articlesData = await articlesRes.json();
        const usersData = await usersRes.json();
        const slidesData = await slidesRes.json();

        const articles = articlesData.articles || [];

        // Calculate stats
        setStats({
          totalArticles: articles.length,
          totalPublished: articles.filter((a: any) => a.status === "published" || a.status === undefined).length,
          totalDraft: articles.filter((a: any) => a.status === "draft").length,
          totalPendingReview: articles.filter((a: any) => a.status === "pending_review").length,
          totalHidden: articles.filter((a: any) => a.status === "hidden").length,
          totalUsers: usersData.total || 0,
          totalSlides: slidesData.slides?.length || 0,
          totalActiveSlides: slidesData.slides?.filter((s: any) => s.is_active).length || 0,
          totalTranslations: articles.reduce((sum: number, a: any) => {
            return sum + (a.translationStatus ? Object.keys(a.translationStatus).length : 0);
          }, 0),
          totalCategories: [...new Set(articles.map((a: any) => a.category).filter(Boolean))].length,
          totalLanguages: 15,
          latestArticles: articles
            .sort((a: any, b: any) => {
              const dateA = a.publishedAt || a.createdAt || "";
              const dateB = b.publishedAt || b.createdAt || "";
              return dateB.localeCompare(dateA);
            })
            .slice(0, 5)
            .map((a: any) => ({
              title: a.originalTitle,
              slug: a.slug,
              status: a.status || "published",
              publishedAt: a.publishedAt || "",
            })),
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-white/40">
        <p>ไม่สามารถโหลดสถิติได้</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "บทความทั้งหมด",
      value: stats.totalArticles,
      icon: FileText,
      color: "from-amber-400 to-orange-500",
      href: "/admin/articles",
      detail: `${stats.totalPublished} เผยแพร่`,
    },
    {
      label: "ร่างบทความ",
      value: stats.totalDraft,
      icon: BookOpen,
      color: "from-blue-400 to-indigo-500",
      href: "/admin/articles",
      detail: `${stats.totalPendingReview} รอตรวจ`,
    },
    {
      label: "ผู้ใช้งาน",
      value: stats.totalUsers,
      icon: Users,
      color: "from-purple-400 to-pink-500",
      href: "/admin/users",
    },
    {
      label: "Hero Slides",
      value: stats.totalSlides,
      icon: Image,
      color: "from-emerald-400 to-teal-500",
      href: "/admin/hero-slides",
      detail: `${stats.totalActiveSlides} กำลังแสดง`,
    },
    {
      label: "การแปลทั้งหมด",
      value: stats.totalTranslations,
      icon: Globe,
      color: "from-cyan-400 to-blue-500",
      href: "/admin/translations",
    },
    {
      label: "หมวดหมู่",
      value: stats.totalCategories,
      icon: BookOpen,
      color: "from-rose-400 to-red-500",
      href: "/admin/articles",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px]">เผยแพร่</span>;
      case "draft":
        return <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 text-[10px]">ร่าง</span>;
      case "pending_review":
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px]">รอตรวจ</span>;
      case "hidden":
        return <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[10px]">ซ่อน</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/40 text-[10px]">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-base sm:text-2xl font-bold text-white flex items-center gap-2">
          <Activity size={24} className="text-amber-300" />
          สถิติ
        </h1>
        <p className="text-white/50 text-sm mt-1">
          ภาพรวมข้อมูลในระบบ
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 hover:border-amber-300/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon size={18} className="text-white" />
                </div>
                <ArrowRight
                  size={14}
                  className="text-white/20 group-hover:text-amber-300 transition-all -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100"
                />
              </div>
              <p className="text-3xl font-bold text-white mb-0.5">
                {stat.value}
              </p>
              <p className="text-white/50 text-sm">{stat.label}</p>
              {stat.detail && (
                <p className="text-white/30 text-[11px] mt-1">{stat.detail}</p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Article Status Pie-like */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-300" />
            สถานะบทความ
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">เผยแพร่แล้ว</span>
                <span className="text-white font-medium">{stats.totalPublished}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${stats.totalArticles > 0 ? (stats.totalPublished / stats.totalArticles) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">ร่าง</span>
                <span className="text-white font-medium">{stats.totalDraft}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${stats.totalArticles > 0 ? (stats.totalDraft / stats.totalArticles) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">รอตรวจ</span>
                <span className="text-white font-medium">{stats.totalPendingReview}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all"
                  style={{ width: `${stats.totalArticles > 0 ? (stats.totalPendingReview / stats.totalArticles) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">ซ่อน</span>
                <span className="text-white font-medium">{stats.totalHidden}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all"
                  style={{ width: `${stats.totalArticles > 0 ? (stats.totalHidden / stats.totalArticles) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Articles */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Clock size={16} className="text-amber-300" />
            บทความล่าสุด
          </h3>

          {stats.latestArticles.length === 0 ? (
            <p className="text-white/40 text-center py-8 text-sm">ยังไม่มีบทความ</p>
          ) : (
            <div className="space-y-2">
              {stats.latestArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/admin/articles/edit/${article.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate group-hover:text-amber-200 transition-colors">
                      {article.title}
                    </p>
                    <p className="text-white/30 text-[10px] mt-0.5 font-mono">/{article.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {getStatusBadge(article.status)}
                    {article.publishedAt && (
                      <span className="text-white/30 text-[10px] hidden md:inline">
                        {new Date(article.publishedAt).toLocaleDateString("th-TH")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/admin/articles"
            className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/10 text-white/40 hover:text-amber-300 text-sm transition-all"
          >
            <Eye size={14} />
            ดูบทความทั้งหมด
          </Link>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a]/50 to-[#162545]/50 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/70 mb-3">สรุปภาพรวม</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/40">บทความ</p>
            <p className="text-white font-medium">{stats.totalArticles} เรื่อง</p>
          </div>
          <div>
            <p className="text-white/40">ผู้ใช้</p>
            <p className="text-white font-medium">{stats.totalUsers} คน</p>
          </div>
          <div>
            <p className="text-white/40">Hero Slides</p>
            <p className="text-white font-medium">{stats.totalSlides} อัน (active {stats.totalActiveSlides})</p>
          </div>
          <div>
            <p className="text-white/40">หมวดหมู่</p>
            <p className="text-white font-medium">{stats.totalCategories} หมวด</p>
          </div>
        </div>
      </div>
    </div>
  );
}
