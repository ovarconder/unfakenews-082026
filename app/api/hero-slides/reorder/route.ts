// ============================================================
// POST /api/hero-slides/reorder
// ============================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { slides } = await request.json();
    const supabase = createAdminClient();

    for (const slide of slides) {
      await supabase
        .from("hero_slides")
        .update({ sort_order: slide.sort_order })
        .eq("id", slide.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
