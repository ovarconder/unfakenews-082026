// ============================================================
// GET /sitemap/:lang.xml — Per-language sitemap
// ============================================================
// สร้าง sitemap เฉพาะภาษา (en, th, ja, ...) โดยกรองเฉพาะ
// variant ภาษานั้นที่ "เผยแพร่จริง" เท่านั้น
//
// คืนเป็น XML (text/xml) เพื่อให้ robots.txt / Search Console ใช้ได้
// ============================================================

import { getActiveLocales, ALL_LOCALES, type Locale } from "@/lib/locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  getPublishedVariants,
  STATIC_PUBLIC_PATHS,
} from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  // lang จะเป็น "en.xml" → ตัด ".xml" ออก
  const rawLocale = lang.endsWith(".xml") ? lang.slice(0, -".xml".length) : lang;
  const locale = rawLocale as Locale;

  if (!ALL_LOCALES.includes(locale)) {
    return new Response("Not Found", { status: 404 });
  }

  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();
  const isActive = activeLocales.includes(locale);

  const urls: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }[] = [];

  if (isActive) {
    // Static pages ของภาษานี้
    for (const path of Object.values(STATIC_PUBLIC_PATHS)) {
      const p = path();
      urls.push({
        loc: `${baseUrl}/${locale}${p}`,
        lastmod: new Date().toISOString(),
        changefreq: p === "" ? "daily" : "monthly",
        priority: p === "" ? 1.0 : 0.5,
      });
    }
    urls.push({
      loc: `${baseUrl}/${locale}/articles`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 0.6,
    });

    // Articles ของภาษานี้ที่เผยแพร่จริง
    try {
      const articleRows = await getPublishedArticleRows();
      for (const article of articleRows) {
        const variants = getPublishedVariants(article);
        const v = variants.find((vv) => vv.locale === locale);
        if (v) {
          urls.push({
            loc: v.url,
            lastmod: new Date(v.dateModified).toISOString(),
            changefreq: "weekly",
            priority: 0.8,
          });
        }
      }
    } catch (err) {
      console.error(`[Sitemap:${locale}] Error:`, err);
    }
  }

  // Build XML
  const urlset = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : ""}
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=0",
    },
  });
}
