// ============================================================
// GET, POST, PATCH, DELETE /api/hero-slides
// ============================================================
// จัดการ Hero Slides สำหรับ Banner Carousel
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";

// GET /api/hero-slides — ดึง slides ที่ active (สำหรับหน้า public)
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: slides, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[HeroSlides] DB error:", error);
      return NextResponse.json({ slides: [] });
    }

    return NextResponse.json({ slides: slides || [] });
  } catch (err) {
    console.error("[HeroSlides] Error:", err);
    return NextResponse.json({ slides: [] });
  }
}

// POST /api/hero-slides — สร้าง slide ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title_th, title_en, subtitle_th, subtitle_en, image_url, image_alt_th, image_alt_en, cta_text_th, cta_text_en, cta_link, article_slug } = body;

    if (!title_th || !title_en) {
      return NextResponse.json(
        { error: "title_th and title_en are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    
    // หา sort_order ล่าสุด
    const { data: lastSlide } = await supabase
      .from("hero_slides")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastSlide?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("hero_slides")
      .insert({
        title_th,
        title_en,
        subtitle_th: subtitle_th || null,
        subtitle_en: subtitle_en || null,
        image_url: image_url || "",
        image_alt_th: image_alt_th || null,
        image_alt_en: image_alt_en || null,
        cta_text_th: cta_text_th || null,
        cta_text_en: cta_text_en || null,
        cta_link: cta_link || (article_slug ? `/th/articles/${article_slug}` : null),
        sort_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[HeroSlides] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slide: data });
  } catch (err: any) {
    console.error("[HeroSlides] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/hero-slides — อัปเดต slide
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("hero_slides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[HeroSlides] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slide: data });
  } catch (err: any) {
    console.error("[HeroSlides] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/hero-slides — ลบ slide
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("hero_slides")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[HeroSlides] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[HeroSlides] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
