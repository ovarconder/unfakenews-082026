// ============================================================
// GET /api/article-locales?slug=xxx
// ============================================================
// Public — คืนรายการภาษาที่ "เผยแพร่จริง" (published variants) ของบทความ slug นั้น
// ใช้ใน navbar language switcher เพื่อแสดงเฉพาะภาษาที่ slug ปัจจุบันมีจริง
// (รวมถึงภาษา Tier 2 ที่มี translation complete เช่น เกาหลี)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getPublishedVariants } from "@/lib/seo-utils";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ locales: [] });
  }

  try {
    const supabase = createAdminClient();
    const { data: articleRow } = await supabase
      .from("articles")
      .select(`
        id, slug, status, original_title, updated_at, published_at,
        translations(article_id, locale, title, translated_at, translation_status)
      `)
      .eq("slug", slug)
      .is("microsite_id", null)
      .maybeSingle();

    if (!articleRow) {
      return NextResponse.json({ locales: [] });
    }

    const variants = getPublishedVariants(articleRow);

    // คืนเฉพาะ locale codes ที่เผยแพร่จริง (เรียงตามลำดับ ALL_LOCALES เดิม)
    const locales = variants.map((v) => v.locale);

    return NextResponse.json({ slug, locales });
  } catch (err: any) {
    console.error("[API article-locales] error:", err?.message || err);
    return NextResponse.json({ locales: [] });
  }
}
