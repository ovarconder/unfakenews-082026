// ============================================================
// Auth Callback Route
// ============================================================
// Supabase OAuth redirect หลัง login สำเร็จ
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect ไปยังหน้า finish (client) เพื่อ set sessionStorage + แยก path ตาม role
      // แต่ที่จริงตัว callback นี้เรียกผ่าน middleware เป็นหลัก —
      // เรา redirect ไป finish route เพื่อให้ browser ตั้ง sessionStorage ได้
      return NextResponse.redirect(new URL(`/auth/finish?next=${encodeURIComponent(next)}`, origin));
    }
  }

  // Return to login page on error
  return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
}
