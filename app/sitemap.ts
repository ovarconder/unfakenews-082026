// ============================================================
// sitemap.xml — Dynamic Sitemap Generator (รวมทุกภาษา)
// ============================================================
// - รองรับ 15 ภาษา (เฉพาะ active locale)
// - รวมหน้า static + รายการบทความ (แต่ละภาษา)
// - ดึงบทความที่ "เผยแพร่จริง" จาก Supabase เท่านั้น
//   (กรอง variant ภาษาที่ยังไม่ published ออก — ป้องกัน 404/half-baked)
// ============================================================

import type { MetadataRoute } from "next";
import { getActiveLocales } from "@/lib/locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  STATIC_PUBLIC_PATHS,
} from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();

  const entries: MetadataRoute.Sitemap = [];

  //
  // === Static Pages (ทุกภาษา active) ===
  //
  for (const locale of activeLocales) {
    for (const path of Object.values(STATIC_PUBLIC_PATHS)) {
      const p = path();
      entries.push({
        url: `${baseUrl}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: p === "" ? "daily" : "monthly",
        priority: p === "" ? 1.0 : 0.5,
      });
    }

    // Article index page
    entries.push({
      url: `${baseUrl}/${locale}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  //
  // === Published Articles (จาก Supabase) — กรอง variant ที่เผยแพร่จริงเท่านั้น ===
  //
  try {
    const articleRows = await getPublishedArticleRows();

    for (const article of articleRows) {
      // ใช้ getPublishedVariants เพื่อตีดแค่ variant ที่ published จริง
      const { getPublishedVariants } = await import("@/lib/seo-utils");
      const variants = getPublishedVariants(article);

      for (const v of variants) {
        // active locale check — ข้าม variant ภาษาที่ถูกปิด
        if (!activeLocales.includes(v.locale)) continue;

        entries.push({
          url: v.url,
          lastModified: new Date(v.dateModified),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch (err) {
    console.error("[Sitemap] Error loading published articles:", err);
  }

  console.log(
    `[Sitemap] Generated ${entries.length} URLs for ${activeLocales.length} active locales`
  );

  return entries;
}
