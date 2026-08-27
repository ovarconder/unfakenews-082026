// ============================================================
// sitemap.xml — Dynamic Sitemap Generator (sitemap รวมทุกภาษา)
// ============================================================
// - รองรับ 15 ภาษา (เฉพาะ active locale)
// - ดึงบทความที่ "เผยแพร่จริง" จาก Supabase เท่านั้น
// - ใช้ "alternates.languages" เพื่อสร้าง <xhtml:link rel="alternate" hreflang>
//   แบบกลุ่มต่อ entity (บทความ / หน้า static) ตามมาตรฐาน Next.js MetadataRoute.Sitemap
// - lastmod ถูกทำความสะอาดให้ไม่มี milliseconds (ผ่าน toSitemapLastmod)
//   เพื่อให้ Googlebot อ่าน XML ได้โดยไม่มีปัญหา
// ============================================================

import type { MetadataRoute } from "next";
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();

  const entries: MetadataRoute.Sitemap = [];

  // ชุด locale ที่ "มีข้อมูลจริง" (มี variant ที่เผยแพร่จริงอย่างน้อยหนึ่งบทความ)
  const liveLocales = new Set<Locale>();

  //
  // === Published Articles (จาก Supabase) ===
  // เราจัดกลุ่ม variant ทุกภาษา (เดียวกันบทความ) เข้าเป็น node เดียว
  // เพื่อให้ Next.js สร้าง hreflang alternates อย่างถูกต้อง
  //
  try {
    const articleRows = await getPublishedArticleRows();

    for (const article of articleRows) {
      const variants = getPublishedVariants(article);

      // กรองเฉพาะ variant ภาษาที่ยัง active อยู่
      const activeVariants = variants.filter((v) =>
        activeLocales.includes(v.locale)
      );

      if (activeVariants.length === 0) continue;

      // เก็บ locale ที่มีข้อมูลจริง
      for (const v of activeVariants) liveLocales.add(v.locale);

      // เลือก "ต้นฉบับ" (ไทย) เป็น canonical/default
      const canonical =
        activeVariants.find((v) => v.locale === "th") || activeVariants[0];

      entries.push({
        url: canonical.url,
        lastModified: new Date(canonical.dateModified),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: {
            ...Object.fromEntries(
              activeVariants.map((v) => [v.locale, v.url])
            ),
            // x-default ให้ชี้ไปที่ภาษาไทย (ต้นฉบับ) สำรองไว้เพื่อ SEO
            "x-default": canonical.url,
          },
        },
      });
    }
  } catch (err) {
    console.error("[Sitemap] Error loading published articles:", err);
  }

  //
  // === Static Pages (เฉพาะ locale ที่มี "ข้อมูลจริง" เท่านั้น) ===
  // กลุ่มตามหน้า static เดียวกัน แล้วเพิ่ม alternate ไปทุก locale
  //
  // ถ้าไม่มี locale ไหน live เลย (เช่น DB ว่าง) → fallback เป็น activeLocales
  // เพื่อไม่ให้ URL กลายเป็น "undefined" และไม่ให้ sitemap ว่างเปล่า
  //
  const staticLocales: Locale[] =
    liveLocales.size > 0 ? [...liveLocales] : activeLocales;

  const staticPaths = Object.values(STATIC_PUBLIC_PATHS).map((fn) => fn());

  for (const path of staticPaths) {
    const localeUrls = Object.fromEntries(
      staticLocales.map((locale) => [
        locale,
        `${baseUrl}/${locale}${path}`,
      ])
    );

    // canonical = หน้า th (ต้นฉบับ) ก่อน แล้วค่อยเป็น locale แรก
    const firstLocale = staticLocales.includes("th")
      ? "th"
      : staticLocales[0];

    entries.push({
      url: `${baseUrl}/${firstLocale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "daily" : "monthly",
      priority: path === "" ? 1.0 : 0.5,
      alternates: {
        languages: {
          ...localeUrls,
          "x-default": `${baseUrl}/${firstLocale}${path}`,
        },
      },
    });
  }

  // Article index page (รวมภาษาที่ live)
  const articleIndexLocaleUrls = Object.fromEntries(
    staticLocales.map((locale) => [
      locale,
      `${baseUrl}/${locale}/articles`,
    ])
  );
  const articleIndexFirst = staticLocales.includes("th")
    ? "th"
    : staticLocales[0];

  entries.push({
    url: `${baseUrl}/${articleIndexFirst}/articles`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.6,
    alternates: {
      languages: {
        ...articleIndexLocaleUrls,
        "x-default": `${baseUrl}/${articleIndexFirst}/articles`,
      },
    },
  });

  // === ทำความสะอาด lastmod ให้ไม่มี milliseconds ===
  const cleanEntries: MetadataRoute.Sitemap = entries.map((e) => ({
    ...e,
    lastModified: e.lastModified
      ? toSitemapLastmod(e.lastModified)
      : undefined,
  }));

  console.log(
    `[Sitemap] Generated ${cleanEntries.length} entity URLs for ${liveLocales.size} content-bearing locales`
  );

  return cleanEntries;
}

