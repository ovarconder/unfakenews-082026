// ============================================================
// GET /api/v1/claims/latest — Open JSON claims endpoint
// ============================================================
// ส่งข้อมูล fact-check ล่าสุดเป็น Clean JSON + JSON-LD ฟอร์แมต
// สำหรับ AI Search Engines / LLM crawlers / third-party
//
// Query params (optional):
//   ?limit=10            จำนวนสูงสุด (default 10, max 50)
//   ?locale=en           กรองเฉพาะภาษานั้น (default: แสดงทุก variant ที่ published)
//   ?format=jsonld       คืนเป็น @graph JSON-LD (default: flat JSON)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPublishedVariants, getBaseUrl } from "@/lib/seo-utils";
import { createAdminClient } from "@/lib/supabase-server";
import { ALL_LOCALES, type Locale } from "@/lib/locales";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = parseInt(url.searchParams.get("limit") || "10", 10);
    const limit = Math.max(1, Math.min(50, Number.isNaN(limitParam) ? 10 : limitParam));
    const localeFilter = url.searchParams.get("locale");
    const format = url.searchParams.get("format") || "json";

    const baseUrl = getBaseUrl();
    const supabase = createAdminClient();

    // 1) ดึง published articles (main-site) พร้อม translations
    const { data: articles, error } = await supabase
      .from("articles")
      .select(`
        id, slug, original_title, original_excerpt, original_content,
        category_id, author_name, published_at, status, updated_at,
        google_schema_markup, featured,
        translations(article_id, locale, title, excerpt, content,
                     is_full_translated, translated_at, translation_status)
      `)
      .is("microsite_id", null)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit * 6); // fetch เยอะพอสำหรับรอบตัวกรองภาษา

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows: any[] = articles || [];

    // 2) สำรวจ published variants เท่านั้น
    const claims: any[] = [];

    for (const article of rows) {
      const variants = getPublishedVariants(article);

      for (const v of variants) {
        // กรองตาม locale (ถ้าระบุ)
        if (localeFilter && v.locale !== localeFilter) continue;

        // หา translation record ที่ตรง locale (สำหรับ content ภาษาแปล)
        const tr = (article.translations || []).find(
          (t: any) => t.locale === v.locale
        );

        const translatedTitle =
          v.locale === "th" ? article.original_title : tr?.title || article.original_title;
        const excerpt =
          v.locale === "th"
            ? article.original_excerpt
            : tr?.excerpt || article.original_excerpt;
        const content =
          v.locale === "th"
            ? article.original_content
            : tr?.content || article.original_content;

        claims.push({
          claim: translatedTitle || article.original_title,
          claim_date: v.datePublished,
          claim_description: excerpt || "",
          url: v.url,
          locale: v.locale,
          datePublished: v.datePublished,
          dateModified: v.dateModified,
          author: article.author_name,
          inLanguage: v.locale,
          // ข้อมูล source เพิ่มเติม (จาก DB schema markup ถ้ามี)
          ...(article.google_schema_markup
            ? { structured_schema: article.google_schema_markup }
            : {}),
        });
      }
    }

    // 3) return format
    if (format === "jsonld") {
      // JSON-LD @graph — ใช้ ClaimReview wrapper ให้ AI อ่านได้
      const graph = claims.slice(0, limit).map((c) => ({
        "@type": "ClaimReview",
        "@id": c.url,
        itemReviewed: {
          "@type": "Claim",
          name: c.claim,
          description: c.claim_description,
        },
        datePublished: c.datePublished,
        url: c.url,
        inLanguage: c.inLanguage,
        author: {
          "@type": "Organization",
          name: baseUrl.replace(/^https?:\/\//, ""),
        },
      }));

      return NextResponse.json({
        "@context": "https://schema.org",
        "@graph": graph,
        meta: {
          total: claims.length,
          returned: graph.length,
          locale_filter: localeFilter || null,
          generated_at: new Date().toISOString(),
        },
      });
    }

    // Default: flat JSON
    return NextResponse.json({
      meta: {
        total: claims.length,
        returned: claims.slice(0, limit).length,
        locale_filter: localeFilter || null,
        generated_at: new Date().toISOString(),
      },
      data: claims.slice(0, limit),
    });
  } catch (err: any) {
    console.error("[Claims API] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
