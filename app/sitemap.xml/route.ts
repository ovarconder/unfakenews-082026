// ============================================================
// GET /sitemap.xml — Sitemap handler (safety net)
// ============================================================
// beforeFiles rewrite ใน next.config.mjs จะ intercept
// /sitemap.xml → /sitemap-xml ก่อนถึงไฟล์นี้
//
// แต่ถ้า route นี้ถูก hit โดยตรง (เช่น dev mode / edge case)
// จะ serve XML จริงๆ แทนการ redirect เพื่อป้องกัน
// "couldn't fetch" บน Google Search Console
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
    pagePath: string;
  }[] = [];

  const liveLocales = new Set<Locale>();

  try {
    const articleRows = await getPublishedArticleRows();
    for (const article of articleRows) {
      const variants = getPublishedVariants(article);
      const activeVariants = variants.filter((v) =>
        activeLocales.includes(v.locale)
      );
      if (activeVariants.length === 0) continue;
      for (const v of activeVariants) liveLocales.add(v.locale);
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

  const effectiveLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

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
