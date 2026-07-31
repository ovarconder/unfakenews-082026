// ============================================================
// robots.txt — สำหรับ Search Engine Crawlers
// ============================================================
// - อนุญาตให้ crawl ทุกหน้า (ยกเว้น admin)
// - ชี้ไป sitemap.xml
// ============================================================

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unfakenews.asia";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
