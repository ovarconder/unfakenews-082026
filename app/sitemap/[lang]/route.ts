// ============================================================
// GET /sitemap/:lang.xml — Per-language sitemap
// ============================================================
// สร้าง sitemap เฉพาะภาษา (en, th, ja, ...) โดยกรองเฉพาะ
// variant ภาษานั้นที่ "เผยแพร่จริง" เท่านั้น
//
// เพิ่ม hreflang alternates ภายในแต่ละ <url> (ลิงก์ไปหน้าเดียวกันทุกภาษา)
// คืนเป็น XML (application/xml; charset=utf-8) เพื่อให้ robots.txt / Search Console ใช้ได้
// ============================================================

import { getActiveLocales, ALL_LOCALES, type Locale } from "@/lib/locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  getPublishedVariants,
  STATIC_PUBLIC_PATHS,
  toSitemapLastmod,
} from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ฟังก์ชันสร้าง hreflang alternates สำหรับหน้า path เดียวกันในทุกภาษา
// - liveLocales: ชุด locale ที่มีข้อมูลจริง (ใช้สร้าง alternate link ทั้งหมด)
// - currentUrl: URL ของภาษาปัจจุบัน (จะถูก exclude จากการเป็น self-reference ว่างเปล่า
//   แต่ Google อนุญาต self reference ได้ — เราจึงรวมด้วยให้ชัดเจน)
function buildAlternates(
  baseUrl: string,
  liveLocales: Locale[],
  pagePath: string
): string {
  const links: string[] = [];

  for (const locale of liveLocales) {
    const href = `${baseUrl}/${locale}${pagePath}`;
    // XML-escape สำหรับค่า hreflang & href (ไม่น่ามี แต่ป้องกันไว้)
    const safeLocale = locale.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const safeHref = href.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    links.push(
      `    <xhtml:link rel="alternate" hreflang="${safeLocale}" href="${safeHref}" />`
    );
  }

  // x-default → ภาษาไทย (ต้นฉบับ) ถ้ามี ไม่งั้นใช้ locale แรก
  const defaultLocale = liveLocales.includes("th") ? "th" : liveLocales[0];
  if (defaultLocale) {
    links.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/${defaultLocale}${pagePath}" />`
    );
  }

  return links.join("\n");
}

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

  // ชุด locale ที่ "มีข้อมูลจริง" (มี variant ที่เผยแพร่จริง)
  const liveLocales = new Set<Locale>();

  const urls: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
    pagePath: string; // path เฉพาะ (สำหรับสร้าง alternate links)
    hasAlternates: boolean;
  }[] = [];

  if (isActive) {
    // Static pages ของภาษานี้
    for (const path of Object.values(STATIC_PUBLIC_PATHS)) {
      const p = path();
      urls.push({
        loc: `${baseUrl}/${locale}${p}`,
        lastmod: toSitemapLastmod(new Date()),
        changefreq: p === "" ? "daily" : "monthly",
        priority: p === "" ? 1.0 : 0.5,
        pagePath: p,
        hasAlternates: true,
      });
    }
    urls.push({
      loc: `${baseUrl}/${locale}/articles`,
      lastmod: toSitemapLastmod(new Date()),
      changefreq: "daily",
      priority: 0.6,
      pagePath: "/articles",
      hasAlternates: true,
    });

    // Articles ของภาษานี้ที่เผยแพร่จริง
    try {
      const articleRows = await getPublishedArticleRows();
      for (const article of articleRows) {
        const variants = getPublishedVariants(article);
        const v = variants.find((vv) => vv.locale === locale);
        if (v) {
          // เก็บ locale ทุกตัวของบทความนี้ (ที่ยัง active) สำหรับ hreflang
          for (const vv of variants) {
            if (activeLocales.includes(vv.locale)) liveLocales.add(vv.locale);
          }
          urls.push({
            loc: v.url,
            lastmod: toSitemapLastmod(new Date(v.dateModified)),
            changefreq: "weekly",
            priority: 0.8,
            pagePath: `/articles/${article.slug}`,
            // บทความภาษาเดียวไม่มี alternate (แค่ self-reference) — ยังคงเพิ่ม th/os
            hasAlternates: true,
          });
        }
      }

      // รวบรวม locale ทั้งหมดจากบทความที่เผยแพร่จริง (ทั้งที่เกิดใน sitemap รายภาษานี้)
      for (const article of articleRows) {
        const variants = getPublishedVariants(article);
        for (const vv of variants) {
          if (activeLocales.includes(vv.locale)) liveLocales.add(vv.locale);
        }
      }
    } catch (err) {
      console.error(`[Sitemap:${locale}] Error:`, err);
    }
  }

  // ถ้าไม่มี locale ไหน live เลย (เช่น DB ว่าง) ให้ fallback เป็น activeLocales
  const effectiveLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

  // Build XML
  const urlset = urls
    .map((u) => {
      const alternates = u.hasAlternates
        ? buildAlternates(baseUrl, effectiveLocales, u.pagePath)
        : "";
      return `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : ""}${alternates ? `\n${alternates}` : ""}
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
