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
    const { error } = await supabase
      .from("site_settings")
      .update({ maintenance_mode: !!maintenanceMode })
      .eq("id", "default");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, maintenanceMode: !!maintenanceMode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
