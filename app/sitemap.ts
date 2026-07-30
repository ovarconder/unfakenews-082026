// ============================================================
// sitemap.xml — Dynamic Sitemap Generator
// ============================================================
// - รองรับ 15 ภาษา
// - รวมทุกหน้า: home, about, contact, privacy, articles
// - ใช้ข้อมูลจาก Supabase เพื่อ generate URL ของบทความ
// ============================================================

import type { MetadataRoute } from "next";
import { getActiveLocales } from "@/lib/locales";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://siamheritage.org";
  const activeLocales = getActiveLocales();

  const entries: MetadataRoute.Sitemap = [];

  //
  // === Static Pages (ทุกภาษา active) ===
  const staticPaths = ["", "/about", "/contact", "/privacy"];

  for (const locale of activeLocales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "monthly",
        priority: path === "" ? 1.0 : 0.5,
      });
    }
  }

  // === Articles List Page (แต่ละภาษา) ===
  for (const locale of activeLocales) {
    entries.push({
      url: `${baseUrl}/${locale}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  console.log(
    `[Sitemap] Generated ${entries.length} URLs for ${activeLocales.length} active locales`
  );

  return entries;
}
