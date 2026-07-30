// ============================================================
// GET /api/admin/translations/status
// ============================================================
// Returns translation status for a specific article + locale
// Used by TranslationDashboard to show real-time status
// ============================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/site-settings";
import { ALL_LOCALES } from "@/lib/locales";
import type { Locale } from "@/lib/locales";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get("articleId");
    const localeParam = url.searchParams.get("locale");

    if (!articleId || !localeParam) {
      return NextResponse.json({ error: "articleId and locale required" }, { status: 400 });
    }

    const locale = localeParam as Locale;

    if (locale === "th") {
      return NextResponse.json({
        status: "complete",
        tier: 1,
        translatedAt: null,
        isFullTranslated: true,
      });
    }

    const supabase = createAdminClient();

    // Get tier config
    const settings = await getSettings();
    const localeTiers: Record<string, number> = (settings.localeTiers as any) || {};
    const tier = localeTiers[locale] || 1;

    // Check if translation record exists
    const { data: trans, error } = await supabase
      .from("translations")
      .select("translation_status, is_full_translated, translated_at")
      .eq("article_id", articleId)
      .eq("locale", locale)
      .maybeSingle();

    if (error) {
      console.error("[Translation Status] DB error:", error);
      return NextResponse.json({
        status: "pending",
        tier,
        translatedAt: null,
        isFullTranslated: false,
      });
    }

    if (!trans) {
      return NextResponse.json({
        status: "pending",
        tier,
        translatedAt: null,
        isFullTranslated: false,
      });
    }

    const t = trans as any;

    return NextResponse.json({
      status: t.translation_status || "pending",
      tier,
      translatedAt: t.translated_at || null,
      isFullTranslated: t.is_full_translated || false,
    });
  } catch (err) {
    console.error("[Translation Status] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
