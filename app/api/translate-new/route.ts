// ============================================================
// POST /api/translate-new
// ============================================================
// Translate/Re-translate a single article (triggered on publish or edit)
//
// Dynamic Tier System (from DB, not hardcoded):
//   Tier 1 — Full translate: title, excerpts, content, tags, imageAlts, entity, glossary, quickFacts
//   Tier 2 — SEO + Summary: title, excerpts, tags, imageAlts, entity, glossary, quickFacts
//            Content = JIT (translated on first read, cached in DB)
//   Tier 0 — Disabled (skipped)
//
// Re-translate on Edit:
//   - ถ้าไม่มี `dirtyFields` → แปลทุกอย่าง (publish ครั้งแรก)
//   - ถ้ามี `dirtyFields` → แปลเฉพาะส่วนที่ dirty
//   - Tier 2 + content dirty → clear content ใน DB (JIT จะแปลใหม่ตอนอ่าน)
//   - ถ้า dirtyFields = content แต่ Tier 2 → แค่ clear content ไม่ต้องเรียก Gemini
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
import { createAdminClient } from "@/lib/supabase-server";
import { isDisabled, isTier2 } from "@/lib/locales";
import { runPublishAutomation } from "@/lib/publish-automation";

export type DirtyField =
  | "title"
  | "short_excerpt"
  | "long_excerpt"
  | "content"
  | "tags"
  | "image_alts"
  | "entity_name"
  | "quick_facts"
  | "glossary";

// ================================================================
// fetchArticleMasterBySlug — ดึง article ภาษาไทยจาก Supabase
// article.id = UUID string ใช้เป็น foreign key ใน translations table
// ================================================================
async function fetchArticleMasterBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !row) {
    console.warn(`[Translate-new] Article not found by slug "${slug}":`, error?.message);
    return null;
  }

  return row;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, locale, dirtyFields } = body;

    if (!slug || !locale || locale === "th") {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const targetLocale = locale as Locale;

    // ⛔ ข้ามถ้าภาษานี้ถูกปิด (Tier 0)
    if (isDisabled(targetLocale)) {
      return NextResponse.json({
        success: false,
        error: `Locale "${targetLocale}" is disabled (Tier 0)`,
      }, { status: 400 });
    }

    // ✅ ดึง article ภาษาไทยจาก Supabase (ใช้ UUID id)
    const articleRow = await fetchArticleMasterBySlug(slug);
    if (!articleRow) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const articleId: string = articleRow.id; // UUID
    const isTier2Locale = isTier2(targetLocale);

    // dirtyFields — ถ้าไม่มี = แปลทุกอย่าง, ถ้ามี = แปลเฉพาะส่วนที่ dirty
    const hasDirtyFields = Array.isArray(dirtyFields) && dirtyFields.length > 0;
    const fields = hasDirtyFields ? dirtyFields as DirtyField[] : undefined;

    const shouldTranslate = (field: DirtyField): boolean => {
      if (!hasDirtyFields) return true;
      return fields!.includes(field);
    };

    const supabase = createAdminClient();

    // ================================================================
    // 1. Content (title + excerpts + content) — แปลจาก original (ภาษาไทย)
    // ================================================================
    let contentResult: {
      title: string;
      short_excerpt: string;
      long_excerpt: string;
      content?: string;
    } | undefined;

    const translateTitleOrExcerpt =
      shouldTranslate("title") ||
      shouldTranslate("short_excerpt") ||
      shouldTranslate("long_excerpt");
    const translateContent = shouldTranslate("content");

    if (translateTitleOrExcerpt || translateContent) {
      contentResult = await translateArticleContent(targetLocale, {
        title: articleRow.original_title,
        shortExcerpt: articleRow.short_excerpt || articleRow.original_excerpt?.slice(0, 150) || "",
        longExcerpt: articleRow.long_excerpt || articleRow.original_excerpt || "",
        content: (isTier2Locale && !translateContent) ? undefined : articleRow.original_content,
        includeFullContent: translateContent && !(isTier2Locale && hasDirtyFields && !translateContent),
        isTier2Lazy: isTier2Locale && !translateContent,
      });
    }

    // ================================================================
    // 2. Tags — แปลจาก original Thai tags
    // ================================================================
    const originalTags: string[] = articleRow.tags || [];
    const translatedTags = shouldTranslate("tags") && originalTags.length > 0
      ? await translateTags(targetLocale, originalTags)
      : undefined;

    // ================================================================
    // 3. Image alt texts
    // ================================================================
    let translatedImageAlts: Record<string, string> | undefined;
    if (shouldTranslate("image_alts")) {
      const imageAltInput: Record<string, string> = {};
      if (articleRow.image_url && articleRow.image_alt) {
        imageAltInput[articleRow.image_url] = articleRow.image_alt;
      }
      translatedImageAlts = Object.keys(imageAltInput).length > 0
        ? await translateImageAlts(targetLocale, imageAltInput)
        : undefined;
    }

    // ================================================================
    // 4. Structured entity data (glossary, quick facts, entity values)
    // ================================================================
    let structuredResult:
      | { glossary?: { term: string; context: string }[]; quick_facts?: Record<string, string>; entity_values?: Record<string, string> }
      | undefined;

    const translateEntity = shouldTranslate("entity_name") ||
      shouldTranslate("quick_facts") ||
      shouldTranslate("glossary");

    if (translateEntity) {
      const structuredInput: {
        glossary?: { term: string; context: string }[];
        quick_facts?: Record<string, string>;
        entity_values?: Record<string, string>;
      } = {};

      const originalGlossary = articleRow.glossary || [];
      const originalQuickFacts = articleRow.quick_facts || [];
      const originalEntityName = articleRow.entity_name || "";

      if (shouldTranslate("glossary") && originalGlossary.length > 0) {
        structuredInput.glossary = originalGlossary.map((g: any) => ({
          term: g.term || g,
          context: g.definition || g.context || "",
        }));
      }
      if (shouldTranslate("quick_facts") && originalQuickFacts.length > 0) {
        const qf: Record<string, string> = {};
        originalQuickFacts.forEach((f: any) => {
          qf[f.label || f.key] = f.value;
        });
        structuredInput.quick_facts = qf;
      }
      if (shouldTranslate("entity_name") && originalEntityName) {
        structuredInput.entity_values = structuredInput.entity_values || {};
        structuredInput.entity_values["entity_name"] = originalEntityName;
      }

      if (Object.keys(structuredInput).length > 0) {
        structuredResult = await translateStructuredData(targetLocale, structuredInput);
      }
    }

    // ================================================================
    // 5. Build DB update object (column names = translations table)
    // ================================================================
    const dbUpdate: Record<string, any> = {};

    if (contentResult) {
      if (shouldTranslate("title")) dbUpdate.title = contentResult.title;
      if (shouldTranslate("short_excerpt")) dbUpdate.short_excerpt = contentResult.short_excerpt || null;
      if (shouldTranslate("long_excerpt")) dbUpdate.long_excerpt = contentResult.long_excerpt || null;
    }

    // Handle content specially for Tier 2
    if (shouldTranslate("content")) {
      if (isTier2Locale) {
        // Tier 2 content dirty → clear content (JIT will re-translate on read)
        dbUpdate.content = "";
        dbUpdate.is_full_translated = false;
      } else {
        dbUpdate.content = contentResult?.content || "";
        dbUpdate.is_full_translated = true;
      }
    }

    if (translatedTags !== undefined) {
      dbUpdate.tags = translatedTags.length > 0 ? translatedTags : null;
    }
    if (translatedImageAlts !== undefined) {
      dbUpdate.image_alt_texts = Object.keys(translatedImageAlts).length > 0 ? translatedImageAlts : null;
    }
    if (structuredResult) {
      if (shouldTranslate("entity_name") && structuredResult.entity_values?.entity_name) {
        dbUpdate.entity_name = structuredResult.entity_values.entity_name;
      }
      if (shouldTranslate("quick_facts") && structuredResult.quick_facts) {
        dbUpdate.quick_facts = JSON.parse(JSON.stringify(structuredResult.quick_facts));
      }
      if (shouldTranslate("glossary") && structuredResult.glossary) {
        dbUpdate.glossary = JSON.parse(JSON.stringify(structuredResult.glossary));
      }
    }

    // Social caption — NEVER translated, always null
    dbUpdate.social_caption = null;

    // Update translation status
    if (dbUpdate.content !== undefined) {
      dbUpdate.translation_status = dbUpdate.content ? "complete" : "summary_only";
    }
    dbUpdate.translated_at = new Date().toISOString();

    // ================================================================
    // 6. Save to translations table (ใช้ articleId UUID)
    // ================================================================
    if (Object.keys(dbUpdate).length > 1) { // more than just translated_at
      const { error } = await supabase
        .from("translations")
        .upsert(
          {
            article_id: articleId,
            locale: targetLocale,
            ...dbUpdate,
          },
          { onConflict: "article_id,locale" }
        );

      if (error) {
        console.error("[Translate-new] DB error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // ============================================================
      // ★ Post-Publish Automation — translation variant เป็น complete
      // (Tier 1 full = complete; Trigger ต่อเมื่อผ่าน guardrail ในระบบจริง)
      // ============================================================
      if (dbUpdate.translation_status === "complete") {
        try {
          await runPublishAutomation({ slug, locale: targetLocale })
            .then((r) => console.log(`[Translate-new] SEO for "${slug}" [${targetLocale}]:`, r))
            .catch((e) => console.warn(`[Translate-new] SEO failed for "${slug}":`, e));
        } catch (seoErr) {
          console.warn(`[Translate-new] SEO error for "${slug}":`, seoErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      slug,
      locale: targetLocale,
      tier: isTier2Locale ? "2" : "1",
      dirtyFields: hasDirtyFields ? fields : undefined,
      title: contentResult?.title,
      isFullTranslated: !isTier2Locale || (dbUpdate.content !== undefined && !!dbUpdate.content),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Translate-new] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
