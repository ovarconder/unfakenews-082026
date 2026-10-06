// ============================================================
// Category Service (Public)
// ============================================================
// ดึงข้อมูลหมวดหมู่สำหรับหน้า public (home, footer ฯลฯ)
// - กรองตาม flag: show_on_public / show_at_footer
// - รองรับการแปลชื่อหมวดหมู่ตาม locale
// ============================================================

import { createClient as createServerClient } from "./supabase-server";
import type { Locale } from "./locales";

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}

/**
 * ดึงหมวดหมู่สำหรับหน้า public
 * @param locale  ภาษาที่ต้องการ
 * @param opts.scope  "public" = เฉพาะ show_on_public = true
 *                    "footer" = เฉพาะ show_at_footer = true
 *                    "all"    = ทั้งหมด (ไม่กรอง)
 */
export async function getPublicCategories(
  locale: Locale,
  opts: { scope?: "public" | "footer" | "all" } = {}
): Promise<PublicCategory[]> {
  const scope = opts.scope || "public";
  const supabase = await createServerClient();

  let query = supabase
    .from("categories")
    .select("id, slug, name_th, name_en, description_th, description_en, image_url, sort_order, show_on_public, show_at_footer")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (scope === "public") {
    query = query.eq("show_on_public", true);
  } else if (scope === "footer") {
    query = query.eq("show_at_footer", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getPublicCategories] error:", error.message);
    return [];
  }

  // TODO: ถ้าต้องการชื่อหมวดหมู่ที่แปลแล้ว ให้ extend ให้ดึงจากตาราง category_translations
  //       ตอนนี้ใช้ name_th / name_en ตาม locale
  return (data || []).map((cat: any) => ({
    id: cat.id,
    slug: cat.slug,
    name: locale === "th" ? cat.name_th : cat.name_en || cat.name_th,
    description:
      (locale === "th" ? cat.description_th : cat.description_en) || undefined,
    imageUrl: cat.image_url || undefined,
    sortOrder: cat.sort_order || 0,
  }));
}
