// ============================================================
// GET, POST /api/admin/categories
// ============================================================
// Admin: จัดการหมวดหมู่บทความ
// Authentication: รองรับทั้ง cookie และ x-session-data header
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getCurrentSession } from "@/lib/auth-service";
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
// GET — ดึงหมวดหมู่ทั้งหมด
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Categories API] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get article count per category
    const { data: counts } = await supabase
      .from("articles")
      .select("category_id")
      .eq("is_published", true);

    const countMap: Record<string, number> = {};
    if (counts) {
      counts.forEach((a: any) => {
        countMap[a.category_id] = (countMap[a.category_id] || 0) + 1;
      });
    }

    const categoriesWithCounts = (categories || []).map((cat: any) => ({
      id: cat.id,
      slug: cat.slug,
      nameTH: cat.name_th,
      nameEN: cat.name_en,
      descriptionTH: cat.description_th,
      descriptionEN: cat.description_en,
      imageUrl: cat.image_url,
      sortOrder: cat.sort_order || 0,
      articleCount: countMap[cat.id] || 0,
    }));

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (err: any) {
    console.error("[Categories API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// POST — สร้างหมวดหมู่ใหม่
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!requireEditor(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, nameTH, nameEN, descriptionTH, descriptionEN, imageUrl, sortOrder } = body;

    if (!slug || !nameTH) {
      return NextResponse.json(
        { error: "slug and nameTH are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        slug,
        name_th: nameTH,
        name_en: nameEN || nameTH,
        description_th: descriptionTH || null,
        description_en: descriptionEN || null,
        image_url: imageUrl || null,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `Category with slug "${slug}" already exists` },
          { status: 409 }
        );
      }
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
        articleCount: 0,
      },
    });
  } catch (err: any) {
    console.error("[Categories API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
