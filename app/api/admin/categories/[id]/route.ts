// ============================================================
// PUT, DELETE /api/admin/categories/[id]
// ============================================================
// Admin: แก้ไข/ลบหมวดหมู่
// Authentication: รองรับทั้ง cookie และ x-session-data header
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase-server";

// ============================================================
// Helper: parse user from request
// ============================================================

async function getRequestUser(request: NextRequest) {
  // Try cookie-based auth first
  const cookieSession = await getCurrentSession();
  if (cookieSession.user) return cookieSession.user;

  // Fallback: read from x-session-data header (set by adminFetch)
  const sessionHeader = request.headers.get("x-session-data");
  if (sessionHeader) {
    try {
      const decoded = decodeURIComponent(atob(sessionHeader));
      const userData = JSON.parse(decoded);
      if (userData && userData.id) {
        return { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
      }
    } catch {
      // invalid header, ignore
    }
  }

  return null;
}

function requireEditor(user: { role: string } | null): boolean {
  if (!user) return false;
  return ["admin", "editor"].includes(user.role);
}

// ============================================================
// PUT — อัปเดตหมวดหมู่
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!requireEditor(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { slug, nameTH, nameEN, descriptionTH, descriptionEN, imageUrl, sortOrder } = body;

    const supabase = createAdminClient();

    const updateData: Record<string, any> = {};
    if (slug !== undefined) updateData.slug = slug;
    if (nameTH !== undefined) updateData.name_th = nameTH;
    if (nameEN !== undefined) updateData.name_en = nameEN;
    if (descriptionTH !== undefined) updateData.description_th = descriptionTH;
    if (descriptionEN !== undefined) updateData.description_en = descriptionEN;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      category: {
        id: data.id,
        slug: data.slug,
        nameTH: data.name_th,
        nameEN: data.name_en,
        descriptionTH: data.description_th,
        descriptionEN: data.description_en,
        imageUrl: data.image_url,
        sortOrder: data.sort_order || 0,
      },
    });
  } catch (err: any) {
    console.error("[Categories API] PUT error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// DELETE — ลบหมวดหมู่
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!requireEditor(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // First check if any articles use this category
    const { data: articles } = await supabase
      .from("articles")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (articles && articles.length > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบหมวดหมู่ที่มีบทความอยู่ได้ — กรุณาย้ายบทความไปหมวดหมู่อื่นก่อน" },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Categories API] DELETE error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
