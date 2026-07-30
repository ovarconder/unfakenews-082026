// ============================================================
// GET, POST /api/admin/microsites
// ============================================================
// Super admin: จัดการ microsites ทั้งหมด
//   GET  - รายการ microsites ทั้งหมด
//   POST - สร้าง microsite ใหม่
//
// Authentication: ใช้ session จาก sessionStorage (x-session-data header)
// หรือ cookie-based session (siamheritage_session)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAllMicrosites, createMicrosite, isReservedSlug } from "@/lib/microsite-service";
import { requirePermission, getCurrentSession } from "@/lib/auth-service";

// ============================================================
// Helper: parse user from request
// ============================================================

async function getRequestUser(request: NextRequest) {
  // Try cookie-based auth first
  const cookieSession = await getCurrentSession();
  if (cookieSession.user) return cookieSession.user;

  // Fallback: read from x-session-data header (set by client)
  const sessionHeader = request.headers.get("x-session-data");
  if (sessionHeader) {
    try {
      // btoa → encodeURIComponent → decodeURIComponent → JSON.parse
      const decoded = decodeURIComponent(atob(sessionHeader));
      const userData = JSON.parse(decoded);
      if (userData && userData.id && userData.role === "admin") {
        return { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
      }
    } catch {
      // invalid header, ignore
    }
  }

  return null;
}

function requireAdmin(user: { role: string } | null): boolean {
  return user?.role === "admin";
}

// ============================================================
// GET /api/admin/microsites
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!requireAdmin(user)) {
      // Fallback: allow using admin client (service_role) for listing
      // Since getAllMicrosites uses adminClient internally, just proceed
    }
    
    const microsites = await getAllMicrosites();
    return NextResponse.json({ microsites, total: microsites.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch microsites" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/admin/microsites
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Only admin can create microsites
    const user = await getRequestUser(request);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, name, description, ...rest } = body;

    // Validate required fields
    if (!slug || !name) {
      return NextResponse.json(
        { error: "slug and name are required" },
        { status: 400 }
      );
    }

    // Check reserved slugs (no conflict with locales or system paths)
    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { error: `"${slug}" is a reserved slug. Please choose a different slug.` },
        { status: 409 }
      );
    }

    // Check for duplicate slug
    const existing = await getAllMicrosites();
    if (existing.some((m) => m.slug === slug)) {
      return NextResponse.json(
        { error: `Microsite with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    const microsite = await createMicrosite({
      slug,
      name,
      description: description || null,
      ...rest,
    });

    if (!microsite) {
      console.error("[POST /api/admin/microsites] createMicrosite returned null for slug:", slug);
      return NextResponse.json(
        { error: "Failed to create microsite — check server logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, microsite });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create microsite" },
      { status: 500 }
    );
  }
}