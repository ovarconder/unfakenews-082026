// ============================================================
// GET /api/categories
// ============================================================
// Public API: ดึงหมวดหมู่ที่แสดงใน footer/public
// Query params:
//   locale = th | en | ... (default: en)
//   scope  = footer | public | all (default: footer)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPublicCategories } from "@/lib/category-service";
import { getLocale } from "@/lib/locales";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = getLocale(searchParams.get("locale") || undefined);
    const scopeParam = searchParams.get("scope") || "footer";
    const scope =
      scopeParam === "public" || scopeParam === "all" ? scopeParam : "footer";

    const categories = await getPublicCategories(locale, { scope });
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("[Categories Public API] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
