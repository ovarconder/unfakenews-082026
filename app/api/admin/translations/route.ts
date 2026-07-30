// ============================================================
// PUT /api/admin/translations
// ============================================================
// Save manual translation for a specific article + locale
// (bypasses Gemini, saves user-entered content directly)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_id, locale, title, content, excerpt, short_excerpt, long_excerpt, tags } = body;

    if (!article_id || !locale) {
      return NextResponse.json({ error: "article_id and locale are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Build update object — only set fields that were provided
    const dbUpdate: Record<string, unknown> = {
      article_id,
      locale,
      translated_at: new Date().toISOString(),
      translation_status: "complete",
    };

    if (title !== undefined) dbUpdate.title = title;
    if (content !== undefined) dbUpdate.content = content;
    if (excerpt !== undefined) dbUpdate.excerpt = excerpt;
    if (short_excerpt !== undefined) dbUpdate.short_excerpt = short_excerpt;
    if (long_excerpt !== undefined) dbUpdate.long_excerpt = long_excerpt;
    if (tags !== undefined) dbUpdate.tags = tags;

    const { error } = await supabase
      .from("translations")
      .upsert(dbUpdate, { onConflict: "article_id,locale" });

    if (error) {
      console.error("[Manual Translation] DB error:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      article_id,
      locale,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Manual Translation] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
