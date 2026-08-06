// ============================================================
// POST /api/seo/indexnow — Trigger IndexNow ping
// ============================================================
// ใช้เรียกจากภายใน (admin/client) หรือใช้เป็น webhook target ได้
// เพื่อแจ้ง Bing / Perplexity / Yandex / Seznam เมื่อ URL เปลี่ยน
//
// Body: { urls: string | string[] }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/indexnow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || (Array.isArray(urls) && urls.length === 0)) {
      return NextResponse.json({ error: "urls required" }, { status: 400 });
    }

    const result = await pingIndexNow(urls);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[IndexNow API] Error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
