// ============================================================
// POST /api/admin/maintenance — Toggle maintenance mode
// ============================================================
// ง่ายที่สุด: update ค่าเดียวใน DB โดยตรง
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase-server";

async function getRequestUser(request: NextRequest) {
  const cookieSession = await getCurrentSession();
  if (cookieSession.user) return cookieSession.user;
  const sessionHeader = request.headers.get("x-session-data");
  if (sessionHeader) {
    try {
      const decoded = decodeURIComponent(atob(sessionHeader));
      const userData = JSON.parse(decoded);
      if (userData && userData.id) return userData;
    } catch {}
  }
  return null;
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "editor"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maintenanceMode } = await request.json();

    const supabase = createAdminClient();

    // หา id ของแถว settings ก่อน (รองรับทั้ง UUID และ TEXT id)
    const { data: existing, error: readErr } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }
    if (!existing?.id) {
      return NextResponse.json(
        { error: "ไม่พบแถวการตั้งค่าในตาราง site_settings" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("site_settings")
      .update({ maintenance_mode: !!maintenanceMode })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, maintenanceMode: !!maintenanceMode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
