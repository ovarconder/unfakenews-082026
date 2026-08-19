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
  translateGoogleSchemaMarkup,
} from "@/lib/translate-service";
import type { Locale } from "@/lib/locales";
import { createAdminClient } from "@/lib/supabase-server";
import { isDisabled } from "@/lib/locales";
import { runPublishAutomation } from "@/lib/publish-automation";

export type DirtyField =
  | "title"
  | "short_excerpt"
  | "long_excerpt"
  | "content"
  | "seo_title"
  | "seo_description"
  | "tags"
  | "image_alts"
  | "entity_name"
  | "quick_facts"
  | "glossary"
  | "google_schema_markup";

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

    // ★ ทุกภาษา (รวม tier 2) แปล content เต็มเหมือน tier 1
    //   (ผู้ใช้กดปุ่ม "แปลอัตโนมัติ" เอาเองทุกภาษา ไม่มี JIT content แล้ว)
    if (translateTitleOrExcerpt || translateContent) {
      contentResult = await translateArticleContent(targetLocale, {
        title: articleRow.original_title,
        shortExcerpt: articleRow.short_excerpt || articleRow.original_excerpt?.slice(0, 150) || "",
        longExcerpt: articleRow.long_excerpt || articleRow.original_excerpt || "",
        content: articleRow.original_content,
        includeFullContent: translateContent,
        isTier2Lazy: false,
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
    // 4.5 SEO + Google Schema Markup (สำหรับ Google ของแต่ละภาษา)
    // ================================================================

    // --- seo_title / seo_description ---
    // ไม่มี field แยกจากบทความ → สร้างจาก title + excerpt ที่แปลแล้ว
    // (guard null/empty ก่อน)
    let translatedSeoTitle: string | undefined;
    let translatedSeoDescription: string | undefined;

    const translateSeo =
      shouldTranslate("seo_title") ||
      shouldTranslate("seo_description");

    if (translateSeo && contentResult) {
      // guard: ใช้เฉพาะที่มีค่า ไม่เป็น null/empty
      const baseTitle = (contentResult.title || "").trim();
      const baseDesc =
        (contentResult.long_excerpt || "").trim() ||
        (contentResult.short_excerpt || "").trim();

      if (shouldTranslate("seo_title") && baseTitle) {
        // SEO title — ปกติต่อท้ายชื่อเว็บ ใช้ title ที่แปลแล้วตรงๆ
        translatedSeoTitle = baseTitle.slice(0, 60); // จำกัดความยาว
      }
      if (shouldTranslate("seo_description") && baseDesc) {
        translatedSeoDescription = baseDesc.slice(0, 160); // meta description 160
      }
    }

    // --- google_schema_markup (JSON-LD) ---
    // แปลเฉพาะข้อความ ข้าม URL / ตัวเลข / null / empty
    let translatedSchema: Record<string, unknown> | null | undefined;
    const originalSchema = articleRow.google_schema_markup as Record<string, unknown> | null | undefined;

    if (shouldTranslate("google_schema_markup")) {
      // guard: ถ้าไม่มีค่า หรือไม่ใช่ object → ข้าม
      if (originalSchema && typeof originalSchema === "object" && !Array.isArray(originalSchema)) {
        translatedSchema = await translateGoogleSchemaMarkup(targetLocale, originalSchema);
        // ถ้า null (เกิด error) → เก็บเป็น undefined (ไม่เขียนทับ)
        if (translatedSchema !== null && Object.keys(translatedSchema).length === 0) {
          translatedSchema = undefined; // ป้องกันเขียน object ว่าง
        }
      } else {
        translatedSchema = undefined;
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

    // SEO — guard null/empty ไม่เขียนค่าเปล่าไป DB
    if (translatedSeoTitle) dbUpdate.seo_title = translatedSeoTitle;
    if (translatedSeoDescription) dbUpdate.seo_description = translatedSeoDescription;

    // Google Schema Markup — guard null/empty
    if (translatedSchema && Object.keys(translatedSchema).length > 0) {
      dbUpdate.google_schema_markup = translatedSchema;
    }

    // ★ ทุกภาษา (รวม tier 2) แปล content เต็ม → เก็บลง DB เป็น complete
    if (shouldTranslate("content")) {
      dbUpdate.content = contentResult?.content || "";
      dbUpdate.is_full_translated = true;
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
      tier: "1", // ทุกภาษาแปลเต็มแล้ว → complete เสมอ
      dirtyFields: hasDirtyFields ? fields : undefined,
      title: contentResult?.title,
      isFullTranslated: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Translate-new] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
