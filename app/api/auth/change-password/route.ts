// ============================================================
// POST /api/auth/change-password
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { createClient } from "@/lib/supabase-server";
export async function POST(request: NextRequest) {
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    // Update password via Supabase Auth
      const supabase = await createClient();
      const { error: supabaseError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (supabaseError) {
      return NextResponse.json(
        { error: supabaseError.message || "Failed to change password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "รหัสผ่านถูกเปลี่ยนเรียบร้อย" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to change password" }, { status: 500 });
  }
}

