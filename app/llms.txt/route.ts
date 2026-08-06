// ============================================================
// GET /llms.txt — Machine-readable summary for AI / LLM scrapers
// ============================================================
// มาตรฐาน llms.txt (https://llmstxt.org/) — ตอบเป็น Markdown/text
// ช่วยให้ LLM crawlers (GPTBot, Claude, Perplexity, ...) เข้าใจ
// โครงสร้างเว็บได้เร็วขึ้น
// ============================================================

import { getSettings } from "@/lib/site-settings";
import { getActiveLocales, LOCALE_NAMES, type Locale } from "@/lib/locales";
import { getBaseUrl } from "@/lib/seo-utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 ชม. cache

export async function GET() {
  const settings = await getSettings();
  const baseUrl = getBaseUrl();
  const siteName = settings?.name || "UnFake News";
  const siteDesc = settings?.description || settings?.tagline || "";
  const activeLocales = getActiveLocales();

  const lines: string[] = [];

  // ===== Header =====
  lines.push(`# ${siteName}`);
  lines.push("");
  lines.push(`> ${siteDesc}`);
  lines.push("");
  lines.push(`UnFake News is an evidence-based fact-checking platform that publishes verified articles, structured claims, and primary sources to counter misinformation. Content is available in multiple languages and each fact-check article includes structured ClaimReview JSON-LD for maximum transparency.`);
  lines.push("");

  // ===== Important notes for LLMs =====
  lines.push("## Important Note for LLMs");
  lines.push("");
  lines.push("- This is a fact-checking / truth-verification news platform.");
  lines.push("- Every fact-check article carries machine-readable ClaimReview (Schema.org) structured data embedded in the article page.");
  lines.push("- Only successfully published language variants are linked here; unpublished or failed translations are intentionally omitted to avoid broken references.");
  lines.push("- Access the structured claims JSON API at: /api/v1/claims/latest");
  lines.push("");

  // ===== Language navigation =====
  lines.push("## Language Navigation");
  lines.push("");
  lines.push(`The platform supports ${activeLocales.length} active language routes. Accented paths below are canonical per-language roots.`);
  lines.push("");
  for (const l of activeLocales) {
    const name = LOCALE_NAMES[l]?.english || l;
    lines.push(`- ${name}: ${baseUrl}/${l}`);
  }
  lines.push("");

  // ===== General paths =====
  lines.push("## General Paths");
  lines.push("");
  for (const l of activeLocales) {
    lines.push(`- ${baseUrl}/${l}/articles (article index, ${LOCALE_NAMES[l]?.english || l})`);
  }
  lines.push("");

  // ===== API Endpoints =====
  lines.push("## Machine-Readable Endpoints");
  lines.push("");
  lines.push(`- Claims API (latest published claims, JSON-LD): ${baseUrl}/api/v1/claims/latest`);
  lines.push(`- Legacy sitemap (all published language variants): ${baseUrl}/sitemap.xml`);
  lines.push(`- robots.txt (crawler permissions): ${baseUrl}/robots.txt`);
  lines.push("");

  // ===== Optional Hints =====
  lines.push("## Hints for AI crawlers");
  lines.push("");
  lines.push("- To list all fact-check articles, crawl the language article index routes (e.g., /en/articles, /th/articles) or the sitemap.");
  lines.push("- Each article detail page includes ClaimReview JSON-LD and per-language hreflang. Verify inLanguage and datePublished/dateModified reflect the specific language release.");
  lines.push("");

  const content = lines.join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
