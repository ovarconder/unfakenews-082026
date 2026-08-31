// ============================================================
// GET /sitemap.xml — Sitemap รวมทุกภาษา (XML โดยตรง)
// ============================================================
// - คืน XML string ที่ถูกต้องโดยตรง (ไม่พึ่ง MetadataRoute serialize)
// - รองรับสถานที่: 15 ภาษา (เฉพาะ active locale)
// - ดึงบทความที่ "เผยแพร่จริง" จาก Supabase เท่านั้น
// - ใช้ <xhtml:link rel="alternate" hreflang> แบบกลุ่มต่อ entity
// - lastmod ถูกทำความสะอาดให้ไม่มี milliseconds (ผ่าน toSitemapLastmod)
// ============================================================

import { getActiveLocales, type Locale } from "@/lib/locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  getPublishedVariants,
  STATIC_PUBLIC_PATHS,
  toSitemapLastmod,
} from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// XML-escape ค่าใน attribute/content (ป้องกัน rare char ที่จะทำ XML พัง)
const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET(): Promise<Response> {
  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();

  const entries: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
    pagePath: string; // path เฉพาะ (สำหรับสร้าง hreflang alternate)
  }[] = [];

  // ชุด locale ที่ "มีข้อมูลจริง" (มี variant ที่เผยแพร่จริงอย่างน้อยหนึ่งบทความ)
  const liveLocales = new Set<Locale>();

  //
  // === Published Articles (จาก Supabase) ===
  // จัดกลุ่ม variant ทุกภาษา (บทความเดียวกัน) เข้าเป็น node เดียว
  //
  try {
    const articleRows = await getPublishedArticleRows();

    for (const article of articleRows) {
      const variants = getPublishedVariants(article);

      const activeVariants = variants.filter((v) =>
        activeLocales.includes(v.locale)
      );

      if (activeVariants.length === 0) continue;

      for (const v of activeVariants) liveLocales.add(v.locale);

      // เลือก "ต้นฉบับ" (ไทย) เป็น canonical/default
      const canonical =
        activeVariants.find((v) => v.locale === "th") || activeVariants[0];

      entries.push({
        loc: canonical.url,
        lastmod: toSitemapLastmod(new Date(canonical.dateModified)),
        changefreq: "weekly",
        priority: "0.8",
        pagePath: `/articles/${article.slug}`,
      });
    }
  } catch (err) {
    console.error("[Sitemap] Error loading published articles:", err);
  }

  //
  // === Static Pages ===
  // ถ้าไม่มี locale ไหน live เลย → fallback เป็น activeLocales
  //
  const staticLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

  for (const path of Object.values(STATIC_PUBLIC_PATHS)) {
    const p = path();
    const firstLocale = staticLocales.includes("th") ? "th" : staticLocales[0];
    entries.push({
      loc: `${baseUrl}/${firstLocale}${p}`,
      lastmod: toSitemapLastmod(new Date()),
      changefreq: p === "" ? "daily" : "monthly",
      priority: p === "" ? "1.0" : "0.5",
      pagePath: p,
    });
  }

  // Article index page (รวมภาษาที่ live)
  const articleIndexFirst = staticLocales.includes("th")
    ? "th"
    : staticLocales[0];
  entries.push({
    loc: `${baseUrl}/${articleIndexFirst}/articles`,
    lastmod: toSitemapLastmod(new Date()),
    changefreq: "daily",
    priority: "0.6",
    pagePath: "/articles",
  });

  // ชุด locale ทั้งหมดที่ใช้สำหรับ hreflang alternate
  const effectiveLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

  // Build hreflang alternates สำหรับ path
  const buildAlternates = (pagePath: string): string => {
    const links: string[] = [];
    for (const locale of effectiveLocales) {
      links.push(
        `    <xhtml:link rel="alternate" hreflang="${esc(locale)}" href="${esc(
          `${baseUrl}/${locale}${pagePath}`
        )}" />`
      );
    }
    const defaultLocale = effectiveLocales.includes("th")
      ? "th"
      : effectiveLocales[0];
    if (defaultLocale) {
      links.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(
          `${baseUrl}/${defaultLocale}${pagePath}`
        )}" />`
      );
    }
    return links.join("\n");
  };

  // Build <url> nodes
  const urlset = entries
    .map((u) => {
      const alternates = buildAlternates(u.pagePath);
      return `  <url>
    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `\n    <priority>${u.priority}</priority>` : ""}${alternates ? `\n${alternates}` : ""}
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlset}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=0",
    },
  });
}
