// ============================================================
// robots.txt — สำหรับ Search Engine Crawlers + AI Crawlers
// ============================================================
// - อนุญาตให้ crawl ทุกหน้า (ยกเว้น admin/api)
// - เปิดการเข้าใช้งานให้ AI agents (GPTBot, OAI-SearchBot, PerplexityBot,
//   ClaudeBot, Google-Extended, Applebot-Extended, ...)
// - reference sitemap ทั้งรวมและรายภาษา
// ============================================================

import type { MetadataRoute } from "next";
import { getActiveLocales } from "@/lib/locales";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unfakenews.asia";
  const activeLocales = getActiveLocales();

  // === อนุญาต AI agents อย่างชัดเจน (เพื่อไม่ให้ถูก block จาก directive ทั่วไป) ===
  const aiAgents = [
    "GPTBot",          // OpenAI — ใช้ crawler หลัก
    "OAI-SearchBot",   // OpenAI Search
    "ChatGPT-User",    // OpenAI ใช้เมื่อ user share link ใน ChatGPT
    "PerplexityBot",   // Perplexity
    "ClaudeBot",       // Anthropic Claude
    "Amazonbot",       // Amazon
    "Google-Extended", // Google Gemini (AI Overviews)
    "Applebot-Extended",
  ].map((agent) => ({
    userAgent: agent,
    allow: "/",
    disallow: ["/admin/", "/api/"],
  }));

  // === ลิสต์ sitemap ทั้งรวม + รายภาษา ===
  const sitemaps: string[] = [
    `${baseUrl}/sitemap.xml`, // sitemap รวม (ทุกภาษา)
    ...activeLocales.map((l) => `${baseUrl}/sitemap/${l}.xml`), // sitemap รายภาษา
  ];

  return {
    rules: [
      // AI agents อนุญาตชัดเจน
      ...aiAgents,
      // crawler ทั่วไป
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: sitemaps,
  };
}

