// ============================================================
// GET, PUT, DELETE /api/admin/microsites/[slug]
// ============================================================
// Super admin: จัดการ microsite แต่ละอัน
// Auth: รับ session จาก cookie หรือ x-session-data header
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getMicrositeBySlug, updateMicrosite, deleteMicrosite } from "@/lib/microsite-service";
import { getCurrentSession } from "@/lib/auth-service";

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
      const userData = JSON.parse(atob(sessionHeader));
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
// GET /api/admin/microsites/[slug]
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const microsite = await getMicrositeBySlug(slug);
    if (!microsite) {
      return NextResponse.json({ error: "Microsite not found" }, { status: 404 });
    }

    return NextResponse.json({ microsite });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch microsite" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/admin/microsites/[slug]
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();

    // Don't allow changing slug
    const { slug: newSlug, ...updates } = body;

    const microsite = await updateMicrosite(slug, updates);
    if (!microsite) {
      return NextResponse.json({ error: "Microsite not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, microsite });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update microsite" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/microsites/[slug]
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const success = await deleteMicrosite(slug);
    
    if (!success) {
      return NextResponse.json({ error: "Microsite not found or could not be deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete microsite" },
      { status: 500 }
    );
  }
}
