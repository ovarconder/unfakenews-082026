// ============================================================
// SEO Resync-All — Bulk re-submit & revalidate ทั้งหมด
// ============================================================
// ใช้เรียกเมื่อต้องการ "อัปเดตทั้งหมด" ในครั้งเดียว เช่น:
//   - หลัง migrate/CMS import บทความจำนวนมาก (เช่น 10 บทความ)
//   - หลังแก้ lastmod/hreflang ใน sitemap
//   - หลัง deploy ใหม่แล้วอยากให้ Google/Bing รู้ URL ใหม่อีกครั้ง
//
// ทำหน้าที่:
//   1. ดึงบทความที่เผยแพร่จริงทั้งหมด (ทุกภาษา) จาก Supabase
//   2. Trigger IndexNow สำหรับ URL ทุกตัว (Bing/Perplexity/Yandex)
//   3. Trigger Google Indexing API (ถ้า config แล้ว)
//   4. revalidatePath/revalidateTag สำหรับ home + articles + sitemap
//
// ⚠️ ด้านหน้าเช็ค auth (admin/editor) — ผ่าน API route
// ============================================================

import { revalidatePath, revalidateTag } from "next/cache";
import { getActiveLocales, type Locale } from "./locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  getPublishedVariants,
} from "./seo-utils";
import { pingIndexNow } from "./indexnow";
import { submitUrlsToGoogle } from "./google-indexing";

export interface ResyncAllResult {
  processedArticles: number;
  urls: string[];
  indexNow: { submitted: boolean; reason?: string; hits?: number };
  google: { url: string; ok: boolean; reason?: string }[];
  revalidated: string[];
  sitemapUrl: string;
}

/**
 * อัปเดตทั้งหมด: index + revalidate ของบทความที่เผยแพร่จริงทั้งหมด
 * @param options.includeGoogle เปิด/ปิด Google Indexing (default true)
 */
export async function runResyncAll(options?: {
  includeGoogle?: boolean;
}): Promise<ResyncAllResult> {
  const includeGoogle = options?.includeGoogle ?? true;
  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();

  // === 1) ดึงบทความเผยแพร่จริงทั้งหมด (ทุกภาษา) ===
  const articleRows = await getPublishedArticleRows();

  const urls: string[] = [];
  const allTargets: { url: string; locale: Locale }[] = [];

  for (const article of articleRows) {
    const variants = getPublishedVariants(article);
    for (const v of variants) {
      if (!activeLocales.includes(v.locale)) continue;
      if (!urls.includes(v.url)) {
        urls.push(v.url);
        allTargets.push({ url: v.url, locale: v.locale });
      }
    }
  }

  // === 2) IndexNow — แจ้ง URL ทั้งหมด (Bing / Perplexity / Yandex / Seznam) ===
  const indexNow = await pingIndexNow(urls);

  // === 3) Google Indexing API — submit URL ทั้งหมด ===
  let google: ResyncAllResult["google"] = [];
  if (includeGoogle) {
    google = await submitUrlsToGoogle(urls.map((u) => ({ url: u })));
  }

  // === 4) Revalidate หน้า home + articles + sitemap (ทุกภาษา active) ===
  const revalidated: string[] = [];

  for (const locale of activeLocales) {
    try {
      revalidatePath(`/${locale}`);
      revalidated.push(`/${locale}`);
    } catch {}
    try {
      revalidatePath(`/${locale}/articles`);
      revalidated.push(`/${locale}/articles`);
    } catch {}
  }

  // sitemap รวม + รายภาษา
  try {
    revalidatePath("/sitemap.xml");
    revalidated.push("/sitemap.xml");
  } catch {}
  // https://nextjs.org/docs/app/api-reference/functions/revalidatePath
  // sitemap route handler อยู่ที่ /sitemap/[lang] → revalidate ผ่าน path
  for (const locale of activeLocales) {
    try {
      revalidatePath(`/sitemap/${locale}.xml`);
      revalidated.push(`/sitemap/${locale}.xml`);
    } catch {}
  }

  try {
    revalidateTag("articles");
    revalidated.push("tag:articles");
  } catch {}
  try {
    revalidateTag("sitemap");
    revalidated.push("tag:sitemap");
  } catch {}

  console.log(
    `[ResyncAll] processed ${articleRows.length} articles → ${urls.length} URLs, indexNow=${indexNow.submitted}, google=${google.filter((g) => g.ok).length}/${google.length}, revalidated=${revalidated.length}`
  );

  return {
    processedArticles: articleRows.length,
    urls,
    indexNow,
    google,
    revalidated,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
  };
}
