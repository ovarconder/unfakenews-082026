// ============================================================
// Article Service
// ============================================================
// Simplified version — English only, no translations.
// Returns original article content directly.
// ============================================================

import type { TranslationStatus } from "./types";
import type { ArticleMaster } from "./types";
import { type Locale } from "./locales";
import { getAllArticleMasters, getArticleMasterBySlug } from "./articles-data";
// ============================================================
// Article Interfaces (Public)
// ============================================================

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  imageAlt?: string;
  featured?: boolean;
  tags?: string[];
  translationStatus: TranslationStatus;
}

export interface ArticleFull extends ArticleSummary {
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
}

// ============================================================
// ดึง Article summaries (English only)
// ============================================================

export function getTranslatedSummaries(locale: Locale): ArticleSummary[] {
  const masters = getAllArticleMasters()
    .filter((m) => m.status === undefined || m.status === "published");

  return masters.map((master) => ({
    id: master.id,
    slug: master.slug,
    title: master.originalTitle,
    excerpt: master.originalExcerpt,
    category: master.category,
    author: master.author,
    publishedAt: master.publishedAt,
    imageUrl: master.imageUrl,
    featured: master.featured,
    tags: master.tags,
    translationStatus: "complete" as TranslationStatus,
  }));
}

export function getFeaturedSummaries(locale: Locale): ArticleSummary[] {
  return getTranslatedSummaries(locale).filter((a) => a.featured);
}

export function getLatestSummaries(locale: Locale, count?: number): ArticleSummary[] {
  const all = getTranslatedSummaries(locale);
  const sorted = all.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return count ? sorted.slice(0, count) : sorted;
}

// ============================================================
// ดึง Article แบบ Full (English only)
// ============================================================

export async function getFullArticle(
  slug: string,
  locale: Locale
): Promise<ArticleFull | null> {
  const master = getArticleMasterBySlug(slug);
  if (!master) return null;

  // Only show published articles to public
  if (master.status !== undefined && master.status !== "published") return null;

  return {
    id: master.id,
    slug: master.slug,
    title: master.originalTitle,
    excerpt: master.originalExcerpt,
    content: master.originalContent,
    category: master.category,
    author: master.author,
    publishedAt: master.publishedAt,
    imageUrl: master.imageUrl,
    featured: master.featured,
    tags: master.tags,
    translationStatus: "complete" as TranslationStatus,
    seoTitle: master.originalTitle,
    seoDescription: master.originalExcerpt,
  };
}

// ============================================================
// ข้อมูล SEO
// ============================================================

export function getArticleSEO(slug: string, locale: Locale): {
  title: string;
  description: string;
} | null {
  const master = getArticleMasterBySlug(slug);
  if (!master) return null;

  return {
    title: master.originalTitle,
    description: master.originalExcerpt,
  };
}

