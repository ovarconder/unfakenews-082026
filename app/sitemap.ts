// ============================================================
// sitemap.xml — Dynamic Sitemap Generator (เฉพาะภาษาที่มีเนื้อหาจริง)
// ============================================================
// - รองรับ 15 ภาษา (เฉพาะ active locale)
// - รวมหน้า static + รายการบทความ (แต่ละภาษา)
// - ดึงบทความที่ "เผยแพร่จริง" จาก Supabase เท่านั้น
//   (กรอง variant ภาษาที่ยังไม่ published ออก — ป้องกัน 404/half-baked)
// - static pages จะถูกสร้างเฉพาะ locale ที่มีบทความเผยแพร่จริงข้อขึ้นไป
//   (ภาษาเปล่าๆ เช่น es/ja ที่ยังไม่มีเนื้อหา จะไม่ถูกใส่ใน sitemap)
// ============================================================

import type { MetadataRoute } from "next";
import { getActiveLocales, type Locale } from "@/lib/locales";
import {
  getBaseUrl,
  getPublishedArticleRows,
  getPublishedVariants,
  STATIC_PUBLIC_PATHS,
} from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const activeLocales = getActiveLocales();

  const entries: MetadataRoute.Sitemap = [];

  //
  // === Published Articles (จาก Supabase) ===
  // รวบรวม variant ที่เผยแพร่จริง และเก็บชุด locale ที่ "มีข้อมูลจริง" ไว้
  //
  const liveLocales = new Set<Locale>();
  try {
    const articleRows = await getPublishedArticleRows();

    for (const article of articleRows) {
      const variants = getPublishedVariants(article);

      for (const v of variants) {
        // ข้าม variant ภาษาที่ถูกปิด
        if (!activeLocales.includes(v.locale)) continue;

        liveLocales.add(v.locale);

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

  //
  // === Static Pages (เฉพาะ locale ที่มี "ข้อมูลจริง" เท่านั้น) ===
  // ถ้า locale ยังไม่มีบทความที่เผยแพร่เลย → หน้านั้นจะว่าง/200 เปล่า
  // ⇒ อย่าใส่ใน sitemap จะได้ไม่เปลือง crawl budget / ดูเป็น junk
  //
  for (const locale of liveLocales) {
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

  console.log(
    `[Sitemap] Generated ${entries.length} URLs for ${liveLocales.size} content-bearing locales`
  );

  return entries;
}

