// ============================================================
// app/sitemap.ts — Next.js Built-in Sitemap (MetadataRoute)
// ============================================================
// ใช้ Next.js 14 built-in Metadata Route convention
// → Next.js จัดการ Content-Type: application/xml ให้เองอัตโนมัติ
// → ไม่มีปัญหา plain text / content-type ผิด
//
// รองรับ alternates.languages (hreflang) ตั้งแต่ Next.js 14.2+
// ============================================================

import type { MetadataRoute } from "next";
import { getActiveLocales, type Locale } from "@/lib/locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  getPublishedVariants,
  toSitemapLastmod,
} from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Static public paths ต่อภาษา
const STATIC_PATHS = ["", "/about", "/articles", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();

  const entries: MetadataRoute.Sitemap = [];

  // ชุด locale ที่ "มีข้อมูลจริง"
  const liveLocales = new Set<Locale>();

  // === Published Articles (จาก Supabase) ===
  try {
    const articleRows = await getPublishedArticleRows();

    for (const article of articleRows) {
      const variants = getPublishedVariants(article);
      const activeVariants = variants.filter((v) =>
        activeLocales.includes(v.locale)
      );

      if (activeVariants.length === 0) continue;

      for (const v of activeVariants) liveLocales.add(v.locale);

      // canonical = ภาษาไทย (ต้นฉบับ) หรือ variant แรก
      const canonical =
        activeVariants.find((v) => v.locale === "th") || activeVariants[0];

      // สร้าง alternates.languages สำหรับ hreflang
      const languages: Record<string, string> = {};
      for (const v of activeVariants) {
        languages[v.locale] = v.url;
      }
      // x-default → ภาษาไทย
      const defaultLocale = activeVariants.find((v) => v.locale === "th")
        ? "th"
        : activeVariants[0]?.locale;
      if (defaultLocale) {
        languages["x-default"] = `${baseUrl}/${defaultLocale}/articles/${article.slug}`;
      }

      entries.push({
        url: canonical.url,
        lastModified: new Date(canonical.dateModified),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages },
      });
    }
  } catch (err) {
    console.error("[Sitemap] Error loading published articles:", err);
  }

  // === Static Pages ===
  const staticLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

  const effectiveLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

  const defaultStaticLocale = staticLocales.includes("th")
    ? "th"
    : staticLocales[0];

  for (const p of STATIC_PATHS) {
    const languages: Record<string, string> = {};
    for (const locale of effectiveLocales) {
      languages[locale] = `${baseUrl}/${locale}${p}`;
    }
    const defLocale = effectiveLocales.includes("th")
      ? "th"
      : effectiveLocales[0];
    if (defLocale) {
      languages["x-default"] = `${baseUrl}/${defLocale}${p}`;
    }

    entries.push({
      url: `${baseUrl}/${defaultStaticLocale}${p}`,
      lastModified: new Date(),
      changeFrequency: p === "" ? "daily" : "monthly",
      priority: p === "" ? 1.0 : 0.5,
      alternates: { languages },
    });
  }

  return entries;
}
