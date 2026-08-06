// ============================================================
// POST /api/translate-all
// ============================================================
// Batch translate ALL published articles for a given locale
// Dynamic Tier System — same as translate-new
//
// ✅ ใช้ Supabase 100% — article_id เป็น UUID สำหรับ FK constraint
// ============================================================

import { NextResponse } from "next/server";
import {
  translateArticleContent,
  translateStructuredData,
  translateImageAlts,
  translateTags,
} from "@/lib/translate-service";
import type { Locale } from "@/lib/locales";
import { isDisabled, isTier2 } from "@/lib/locales";
import { createAdminClient } from "@/lib/supabase-server";
import { runPublishAutomation } from "@/lib/publish-automation";

export async function POST(request: Request) {
  try {
    const { locale } = await request.json();

    if (!locale || locale === "th") {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const targetLocale = locale as Locale;

    // ⛔ ข้ามถ้าภาษานี้ถูกปิด (Tier 0)
    if (isDisabled(targetLocale)) {
      return NextResponse.json({
        success: false,
        error: `Locale "${targetLocale}" is disabled (Tier 0) — translation skipped`,
      }, { status: 400 });
    }

    const isTier2Locale = isTier2(targetLocale);
    const supabase = createAdminClient();

    // ✅ ดึง published articles จาก Supabase
    const { data: articles, error: fetchError } = await supabase
      .from("articles")
      .select("*")
      .in("status", ["published", null])
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[Translate-all] Error fetching articles:", fetchError);
      return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        locale: targetLocale,
        tier: isTier2Locale ? "2" : "1",
        total: 0,
        results: [],
        message: "No published articles found",
      });
    }

    const results: { slug: string; status: string }[] = [];

    for (const row of articles) {
      try {
        // 1. Translate content (title + excerpts)
        const contentResult = await translateArticleContent(targetLocale, {
          title: row.original_title,
          shortExcerpt: row.short_excerpt || row.original_excerpt?.slice(0, 150) || "",
          longExcerpt: row.long_excerpt || row.original_excerpt || "",
          content: isTier2Locale ? undefined : row.original_content,
          includeFullContent: !isTier2Locale,
          isTier2Lazy: isTier2Locale,
        });

        // 2. Translate tags
        const originalTags: string[] = row.tags || [];
        const translatedTags = originalTags.length > 0
          ? await translateTags(targetLocale, originalTags)
          : [];

        // 3. Translate image alt texts
        const imageAltInput: Record<string, string> = {};
        if (row.image_url && row.image_alt) {
          imageAltInput[row.image_url] = row.image_alt;
        }
        const translatedImageAlts = Object.keys(imageAltInput).length > 0
          ? await translateImageAlts(targetLocale, imageAltInput)
          : {};

        // 4. Translate structured entity data
        const structuredInput: {
          glossary?: { term: string; context: string }[];
          quick_facts?: Record<string, string>;
          entity_values?: Record<string, string>;
        } = {};

        const originalGlossary = row.glossary || [];
        const originalQuickFacts = row.quick_facts || [];

        if (originalGlossary.length > 0) {
          structuredInput.glossary = originalGlossary.map((g: any) => ({
            term: g.term || g,
            context: g.definition || g.context || "",
          }));
        }
        if (originalQuickFacts.length > 0) {
          const qf: Record<string, string> = {};
          originalQuickFacts.forEach((f: any) => { qf[f.label || f.key] = f.value; });
          structuredInput.quick_facts = qf;
        }
        if (row.entity_name) {
          structuredInput.entity_values = structuredInput.entity_values || {};
          structuredInput.entity_values["entity_name"] = row.entity_name;
        }

        let structuredResult:
          | { glossary?: { term: string; context: string }[]; quick_facts?: Record<string, string>; entity_values?: Record<string, string> }
          | undefined;

        if (Object.keys(structuredInput).length > 0) {
          structuredResult = await translateStructuredData(targetLocale, structuredInput);
        }

        // 5. Save to translations table (ใช้ UUID id)
        const { error } = await supabase.from("translations").upsert(
          {
            article_id: row.id,
            locale: targetLocale,
            title: contentResult.title,
            excerpt: contentResult.short_excerpt || contentResult.long_excerpt,
            content: isTier2Locale ? "" : contentResult.content,
            entity_name: structuredResult?.entity_values?.entity_name || null,
            quick_facts: structuredResult?.quick_facts ? JSON.parse(JSON.stringify(structuredResult.quick_facts)) : null,
            glossary: structuredResult?.glossary ? JSON.parse(JSON.stringify(structuredResult.glossary)) : null,
            short_excerpt: contentResult.short_excerpt || null,
            long_excerpt: contentResult.long_excerpt || null,
            tags: translatedTags.length > 0 ? translatedTags : null,
            image_alt_texts: Object.keys(translatedImageAlts).length > 0 ? translatedImageAlts : null,
            social_caption: null,
            translation_status: isTier2Locale ? "summary_only" : "complete",
            is_full_translated: !isTier2Locale,
            translated_at: new Date().toISOString(),
          },
          { onConflict: "article_id,locale" }
        );

        if (error) {
          console.error(`[Translate-all] DB error for ${row.slug}:`, error);
          results.push({ slug: row.slug, status: "db_error" });
        } else {
          results.push({ slug: row.slug, status: "translated" });

          // ★ Post-Publish Automation — translation variant เป็น complete
          // (เฉพาะ Tier 1 = complete; Tier 2 = summary_only ไม่ trigger)
          if (!isTier2Locale) {
            try {
              await runPublishAutomation({ slug: row.slug, locale: targetLocale })
                .then((r) => console.log(`[Translate-all] SEO for "${row.slug}" [${targetLocale}]:`, r))
                .catch((e) => console.warn(`[Translate-all] SEO failed for "${row.slug}":`, e));
            } catch (seoErr) {
              console.warn(`[Translate-all] SEO error for "${row.slug}":`, seoErr);
            }
          }
        }
      } catch (err) {
        console.error(`[Translate-all] Error for ${row.slug}:`, err);
        results.push({ slug: row.slug, status: "error" });
      }
    }

    return NextResponse.json({
      success: true,
      locale: targetLocale,
      tier: isTier2Locale ? "2" : "1",
      total: articles.length,
      results,
    });
  } catch (err) {
    console.error("[Translate-all] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
