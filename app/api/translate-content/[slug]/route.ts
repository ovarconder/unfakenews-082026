// ============================================================
// GET /api/translate-content/[slug]?locale=xx
// ============================================================
// JIT (Just-in-Time) content translation for a specific article
// ✅ ใช้ Supabase 100% — article_id เป็น UUID สำหรับ FK constraint
// ============================================================

import { NextResponse } from "next/server";
import { translateContentOnly } from "@/lib/translate-service";
import type { Locale } from "@/lib/locales";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const localeParam = url.searchParams.get("locale") || "en";

    const supabase = createAdminClient();

    // ✅ ดึง article จาก Supabase
    const { data: articleRow, error: fetchError } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (fetchError || !articleRow) {
      console.warn(`[Translate-content] Article not found by slug "${slug}":`, fetchError?.message);
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const articleId: string = articleRow.id; // UUID

    // ถ้าเป็นภาษาไทย → ส่ง content ต้นฉบับ
    if (localeParam === "th") {
      return NextResponse.json({
        success: true,
        content: articleRow.original_content,
        cached: false,
      });
    }

    const targetLocale = localeParam as Locale;

    // Check if translation already exists
    const { data: existing } = await supabase
      .from("translations")
      .select("content")
      .eq("article_id", articleId)
      .eq("locale", targetLocale)
      .maybeSingle();

    if (existing && (existing as any).content) {
      return NextResponse.json({
        success: true,
        content: (existing as any).content,
        cached: true,
      });
    }

    // Call Gemini via translateContentOnly
    const result = await translateContentOnly(targetLocale, articleRow.original_content);

    // Cache the translation (ใช้ UUID articleId)
    const { error } = await supabase.from("translations").upsert(
      {
        article_id: articleId,
        locale: targetLocale,
        content: result.content,
        translation_status: "complete",
        is_full_translated: true,
        translated_at: new Date().toISOString(),
      },
      { onConflict: "article_id,locale" }
    );

    if (error) {
      console.error("[Translate-content] DB cache error:", error);
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      cached: false,
      fromTier2: true,
      translatingInProgress: false,
    });
  } catch (err) {
    console.error("[Translate-content] Error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
