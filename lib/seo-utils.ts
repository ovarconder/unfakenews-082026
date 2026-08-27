// ============================================================
// SEO / Indexing Shared Utilities
// ============================================================
// รวม helper ที่ใช้ร่วมกันในระบบ SEO Automation:
// - หา site URL หลัก
// - ตรวจ "สถานะเผยแพร่" ของ language variant (บทความ TH + translation)
// - เลือกภาษาเผยแพร่จริงของบทความหนึ่ง → ใช้สร้าง hreflang / sitemap
// - สร้าง IndexNow / Google Indexing payload
// ============================================================

import { createAdminClient } from "./supabase-server";
import { ALL_LOCALES, type Locale } from "./locales";
import { SITE_URL } from "./constants";

// ============================================================
// Base URL — ใช้ env/settings เป็นตัวตั้ง
// ============================================================

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || SITE_URL || "https://unfakenews.asia";
}

// ============================================================
// lastmod / date formatting — สำหรับ sitemap & hreflang
// ============================================================
// Googlebot ต้องการ ISO 8601 แบบไม่ต้องมีเศษส่วนวินาที (milliseconds)
// เช่น "2026-08-22T17:12:03Z" หรือ "2026-08-22" (feed: "YYYY-MM-DD")
// ============================================================

/**
 * แปลง Date / ISO string ให้เป็น sitemap-friendly lastmod
 * - ตัด milliseconds ออก (2026-08-22T17:12:03.039Z -> 2026-08-22T17:12:03Z)
 * - ถ้าอยากได้แบบวันที่ล้วน (YYYY-MM-DD) ให้ส่ง withTime = false
 */
export function toSitemapLastmod(
  input: string | Date,
  withTime = true
): string {
  const d = input instanceof Date ? input : new Date(input);

  // กรณีวันที่ไม่ถูกต้อง -> ใช้เวลาปัจจุบัน (ยังคงตัด milli เช่นกัน)
  if (Number.isNaN(d.getTime())) return toSitemapLastmod(new Date(), withTime);

  if (!withTime) {
    // YYYY-MM-DD (ปลอดภัยสุด — Google แนะนำสำหรับ sitemap)
    return d.toISOString().slice(0, 10);
  }

  // YYYY-MM-DDTHH:mm:ssZ (ไม่มี milliseconds)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ============================================================
// "Published" state resolution
// ============================================================
// ตาม guardrail ใน system prompt:
//   ต้องเป็นภาษา variant ที่เข้าสู่สถานะ 'published' จริงเท่านั้น
//   - ภาษาไทย (ต้นฉบับ): articles.status = 'published'
//   - ภาษาอื่น: translations.translation_status = 'complete'
//  => ถ้ายังเป็น draft / summary_only / pending อย่า expose ไปยัง sitemap/hreflang
// ============================================================

/** Articles ระดับ main-site ที่เผยแพร่ (status = published) พร้อม translations */
export async function getPublishedArticleRows(): Promise<any[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id, slug, original_title, original_excerpt, category_id,
      author_name, published_at, image_url, image_alt, featured,
      status, google_schema_markup, updated_at,
      translations(article_id, locale, title, excerpt, content, is_full_translated,
                   translated_at, translation_status)
    `)
    .is("microsite_id", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[SEO] Error loading published articles:", error?.message);
    return [];
  }

  // กรองเฉพาะที่เผยแพร่จริง
  return (data || []).filter((a: any) => a.status === "published");
}

/**
 * คืนชุดของ language variants ที่ "เผยแพร่จริง" ของบทความหนึ่ง
 * - th: เสมอ (ถ้าบทความเผยแพร่)
 * - อื่นๆ: เฉพาะที่มี translation_status = 'complete'
 */
export interface PublishedVariant {
  locale: Locale;
  title: string;
  /** วันที่ variant นี้เริ่มเผยแพร่ (th = article.published_at, อื่น = translated_at) */
  datePublished: string;
  /** วันที่แก้ไขล่าสุดของ variant (ใช้เป็น lastmod) */
  dateModified: string;
  /** URL ภาษา-specific */
  url: string;
}

export function getPublishedVariants(article: any): PublishedVariant[] {
  const baseUrl = getBaseUrl();
  const variants: PublishedVariant[] = [];

  // === Thai (ต้นฉบับ) — เผยแพร่ถ้าบทความ status = published ===
  if (article.status === "published") {
    variants.push({
      locale: "th",
      title: article.original_title,
      datePublished: article.published_at || article.updated_at || new Date().toISOString(),
      dateModified: article.updated_at || article.published_at || new Date().toISOString(),
      url: `${baseUrl}/th/articles/${article.slug}`,
    });
  }

  // === ภาษาแปล — เฉพาะที่ translation_status = 'complete' ===
  const translations: any[] = article.translations || [];
  for (const t of translations) {
    const locale = t.locale as Locale;
    // ข้าม th (จัดการด้านบน) และข้ามภาษาที่ไม่รู้จัก
    if (locale === "th" || !ALL_LOCALES.includes(locale)) continue;
    // ✅ ผ่านเกณฑ์ "verified published" เท่านั้น
    if (t.translation_status !== "complete") continue;

    // สำหรับ TIER2 (summary_only) จะไม่ผ่านที่นี่ เพราะไม่ใช่ complete
    // ถ้าอยากให้ summary_only แสดงใน sitemap ด้วย สามารถแก้เงื่อนไขเพิ่มเติมได้

    const transDate = t.translated_at || t.updated_at || article.updated_at;
    variants.push({
      locale,
      title: t.title || article.original_title,
      datePublished: transDate,
      dateModified: transDate,
      url: `${baseUrl}/${locale}/articles/${article.slug}`,
    });
  }

  return variants;
}

/** ใช้ใน generateMetadata / sitemap — ภาษา-ที่เผยแพร่จริงของบทความ */
export function getPublishedLocalesForArticle(article: any): Locale[] {
  return getPublishedVariants(article).map((v) => v.locale);
}

// ============================================================
// indexUrl → จุดที่ใช้สร้าง sitemap / IndexNow / Google Indexing
// ============================================================

export interface ArticleIndexTarget {
  /** absolute URL เช่น https://x.com/en/articles/slug */
  url: string;
  locale: Locale;
  lastModified: string;
  datePublished: string;
  title: string;
}

export function getArticleIndexTargets(article: any): ArticleIndexTarget[] {
  return getPublishedVariants(article).map((v) => ({
    url: v.url,
    locale: v.locale,
    lastModified: v.dateModified,
    datePublished: v.datePublished,
    title: v.title,
  }));
}

// ============================================================
// Static-public paths ที่ใช้ใน llms.txt และ sitemap (ต่อภาษา)
// ============================================================

export const STATIC_PUBLIC_PATHS = {
  home: () => "",
  about: () => "/about",
  articles: () => "/articles",
  contact: () => "/contact",
  privacy: () => "/privacy",
  terms: () => "/terms",
} as const;

export function getPublicStaticPaths(): string[] {
  return Object.values(STATIC_PUBLIC_PATHS).map((fn) => fn());
}
