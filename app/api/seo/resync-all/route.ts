// ============================================================
// POST /api/seo/resync-all — Bulk re-submit & revalidate ทั้งหมด
// ============================================================
// ใช้จาก admin/editor เพื่อ "อัปเดตทั้งหมด" (บทความที่เผยแพร่จริงทั้งหมด
// พร้อมทุกภาษา) → IndexNow + Google Indexing + revalidate sitemap/page
//
// Body (optional): { includeGoogle?: boolean }
//   - includeGoogle: false → ข้าม Google Indexing (ประหยัด quota)
//
// Auth: ต้องเป็น admin หรือ editor (session cookie หรือ x-session-data)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { runResyncAll } from "@/lib/seo-resync";

async function getRequestUser(request: NextRequest) {
  const cookieSession = await getCurrentSession();
  if (cookieSession.user) return cookieSession.user;

  const sessionHeader = request.headers.get("x-session-data");
  if (sessionHeader) {
    try {
      const decoded = decodeURIComponent(atob(sessionHeader));
      const userData = JSON.parse(decoded);
      if (userData && userData.id) {
        return { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
      }
    } catch {}
  }
  return null;
}

function isAuthorized(user: { role?: string } | null): boolean {
  if (!user) return false;
  return ["admin", "editor"].includes(user.role || "");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!isAuthorized(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let includeGoogle = true;
    try {
      const body = await request.json();
      if (typeof body?.includeGoogle === "boolean") {
        includeGoogle = body.includeGoogle;
      }
    } catch {
      // body ว่าง/ไม่ใช่ JSON → ใช้ default
    }

    const result = await runResyncAll({ includeGoogle });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Resync-All API] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
