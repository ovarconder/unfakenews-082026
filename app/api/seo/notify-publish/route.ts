// ============================================================
// POST /api/seo/notify-publish
// ============================================================
// Internal endpoint แล้วแต่เรียกเมื่อ language variant ถูก publish
// เข้าแล้ว (เช่น admin publish บทความ / ส่ง manual translation)
//
// ⚠️ Guardrail: ระบบจะ "ยืนยันสถานะ published จาก DB อีกครั้ง" ก่อนทำงาน
//     ถ้ายังไม่ได้เป็น published จริง → ไม่ do indexing / revalidate
//
// วิธีใช้จาก client:
//   fetch('/api/seo/notify-publish', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ slug, locale })
//   })
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runPublishAutomation } from "@/lib/publish-automation";
import { ALL_LOCALES, type Locale } from "@/lib/locales";

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { slug, locale } = body;

    if (!slug || !locale) {
      return NextResponse.json(
        { error: "slug and locale are required" },
        { status: 400 }
      );
    }

    const l = locale as Locale;
    if (!ALL_LOCALES.includes(l)) {
      return NextResponse.json(
        { error: `Invalid locale "${locale}"` },
        { status: 400 }
      );
    }

    const result = await runPublishAutomation({ slug, locale });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Notify-publish] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
