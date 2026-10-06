// ============================================================
// OAuth Callback - Google / Facebook
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // ★ ระบบใหม่: ไม่ auto-create profile จาก OAuth อีกต่อไป
      //   - ยกเลิก Google login สำหรับผู้ใช้ทั่วไป
      //   - ผู้ใช้จะถูกสร้างที่หลังบ้าน (ด้วย email) เท่านั้น
      //   - ถ้าไม่มี profile → login ได้แต่เข้า admin ไม่ได้ (role ไม่ถูกต้อง)

      // Redirect with user info as hash for client to pick up
      const redirectUrl = new URL(next, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback: redirect to login
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
