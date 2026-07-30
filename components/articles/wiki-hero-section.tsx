// ============================================================
// WikiHeroSection — Hero Section แบบ Wiki-Style
// ============================================================
// - รูปภาพเต็มจอ + Title (16:9 aspect ratio บนจอใหญ่)
// - Parallax effect อ่อนๆ เมื่อ scroll
// - Static image loading (ไม่มี animation fade-in)
// ============================================================

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, BookOpen } from "lucide-react";
import type { ArticleFull } from "@/lib/article-service-supabase";
import type { Locale } from "@/lib/locales";
import type { ArticleAbstract } from "@/lib/wiki-types";
import type { ArticleMaster } from "@/lib/types";

interface WikiHeroSectionProps {
  article: ArticleFull;
  locale: Locale;
  abstract?: ArticleAbstract;
  master: ArticleMaster;
}

export default function WikiHeroSection({
  article,
  locale,
  abstract,
  master,
}: WikiHeroSectionProps) {
  const [imgError, setImgError] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Parallax: ติดตาม scroll position เบาๆ
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom > 0) {
        setScrollY(-rect.top);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const date = new Date(article.publishedAt).toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const readTime = estimateReadingTime(article.content);
  const hasImage = article.imageUrl && article.imageUrl.trim().length > 0;
  const showImage = hasImage && !imgError;

  return (
    <section className="relative w-full" aria-label="Article header">
      {/* === Hero Background (full-width image) === */}
      <div
        ref={sectionRef}
        className="relative w-full flex items-end bg-[#060e1a] overflow-hidden
          min-h-[57vh] sm:min-h-[63vh] lg:min-h-0 lg:aspect-[16/9] lg:max-h-[80vh]"
      >
        {/* Background image — static, no animation */}
        {showImage && (
          <img
            src={article.imageUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              transform: scrollY > 0 ? `translateY(${scrollY * 0.15}px)` : "translateY(0)",
            }}
            loading="eager"
            onError={() => setImgError(true)}
          />
        )}

        {/* Fallback gradient when no image or error */}
        {(!hasImage || imgError) && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#060e1a]" />
        )}

        {/* Gradient overlay — สำหรับข้อความให้อ่านง่าย */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060e1a] via-[#060e1a]/40 to-transparent pointer-events-none" />

        {/* Back button */}
        <div className="absolute top-24 sm:top-28 left-4 sm:left-8 z-10">
          <Link
            href={`/${locale}/articles`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 hover:text-amber-200 text-sm transition-all border border-white/10"
          >
            <ArrowLeft size={16} />
            {locale === "th" ? "บทความทั้งหมด" : "All articles"}
          </Link>
        </div>

        {/* === Title Block — anchored to bottom of hero === */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
          {/* Category & Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Link
              href={`/${locale}/categories/${encodeURIComponent(article.category)}`}
              className="px-3 py-1 rounded-full bg-amber-300/15 text-amber-300 text-xs font-medium hover:bg-amber-300/25 transition-colors backdrop-blur-sm"
            >
              {article.category}
            </Link>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/40 text-xs flex items-center gap-1">
              <BookOpen size={12} />
              {locale === "th" ? `${readTime} นาที` : `${readTime} min read`}
            </span>
          </div>

          <h1 className="article-hero-title">
            {article.title}
          </h1>

          {/* Meta row — at the bottom of hero area */}
          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {locale === "th" ? `เผยแพร่ ${date}` : date}
            </span>
            {(master.showAuthor !== false) && (
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {locale === "th" ? `โดย ${article.author}` : `By ${article.author}`}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-white/50">
              <Clock size={14} />
              {locale === "th" ? `อ่าน ${readTime} นาที` : `${readTime} min read`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Estimate reading time based on content length
 */
function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const charCount = content.length;
  const wordCount = content.split(/\s+/).length;
  
  const thaiRatio = (content.match(/[\u0E00-\u0E7F]/g) || []).length / charCount;
  
  if (thaiRatio > 0.3) {
    return Math.max(1, Math.ceil(charCount / 300));
  }
  
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
