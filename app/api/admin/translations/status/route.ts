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
        isStale: false,
      });
    }

    const supabase = createAdminClient();

    // Get tier config
    const settings = await getSettings();
    const localeTiers: Record<string, number> = (settings.localeTiers as any) || {};
    const tier = localeTiers[locale] || 1;

    // ★ ดึง content_updated_at ของต้นฉบับ เพื่อตรวจ "ความล้าสมัย" ของคำแปล
    //   (ถ้าต้นฉบับแก้หลังแปล → คำแปล stale → ต้องแปลใหม่)
    const { data: articleRow } = await supabase
      .from("articles")
      .select("content_updated_at, updated_at")
      .eq("id", articleId)
      .maybeSingle();
    const contentUpdatedAt: string | null =
      (articleRow as any)?.content_updated_at || (articleRow as any)?.updated_at || null;

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
        isStale: false,
      });
    }

    if (!trans) {
      return NextResponse.json({
        status: "pending",
        tier,
        translatedAt: null,
        isFullTranslated: false,
        isStale: false,
      });
    }

    const t = trans as any;

    // ★ คำนวณ isStale — ต้นฉบับถูกแก้หลังคำแปลล่าสุดหรือไม่
    //   (ต้องมีทั้ง translated_at และ content_updated_at จึงเทียบได้)
    let isStale = false;
    if (t.translated_at && contentUpdatedAt) {
      const translatedMs = new Date(t.translated_at).getTime();
      const contentMs = new Date(contentUpdatedAt).getTime();
      isStale = contentMs > translatedMs;
    }

    return NextResponse.json({
      status: t.translation_status || "pending",
      tier,
      translatedAt: t.translated_at || null,
      isFullTranslated: t.is_full_translated || false,
      isStale,
      contentUpdatedAt,
    });
  } catch (err) {
    console.error("[Translation Status] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
