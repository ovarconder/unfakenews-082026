// ============================================================
// GET, PUT, DELETE /api/admin/articles/[slug]
// ============================================================
// Admin: จัดการบทความรายชิ้น — ใช้ Supabase Database
// Authentication: รองรับทั้ง cookie และ x-session-data header
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase-server";

// ============================================================
// Helper: parse user from request
// ============================================================

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

function requireEditor(user: { role: string } | null): boolean {
  if (!user) return false;
  return ["admin", "editor"].includes(user.role);
}

// ============================================================
// GET /api/admin/articles/[slug]
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequestUser(request);
  if (!requireEditor(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!row) {
    // Fallback: try hardcoded data
    const { getArticleMasterBySlug } = await import("@/lib/articles-data");
    const fallback = getArticleMasterBySlug(slug);
    if (!fallback) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(fallback);
  }

  const article = {
    id: row.id,
    slug: row.slug,
    originalTitle: row.original_title,
    originalExcerpt: row.original_excerpt,
    originalContent: row.original_content,
    category: row.category_id,
    author: row.author_name,
    authorId: row.author_id || "",
    publishedAt: row.published_at || row.created_at,
    imageUrl: row.image_url || "",
    imageAlt: row.image_alt || undefined,
    imageCredit: row.image_credit || undefined,
    imagePhotographer: row.image_photographer || undefined,
    imageSourceUrl: row.image_source_url || undefined,
    imageYear: row.image_year || undefined,
    featured: row.featured || false,
    tags: row.tags || [],
    status: row.status || "draft",
    showAuthor: true,
    entityName: row.entity_name || undefined,
    entityType: row.entity_type || undefined,
    wikidataId: row.wikidata_id || undefined,
    quickFacts: row.quick_facts || undefined,
    glossary: row.glossary || undefined,
    shortExcerpt: row.short_excerpt || undefined,
    longExcerpt: row.long_excerpt || undefined,
    socialCaption: row.social_caption || undefined,
    googleSchemaMarkup: row.google_schema_markup || undefined,
    };

  return NextResponse.json(article);
}

// ============================================================
// PUT /api/admin/articles/[slug]
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequestUser(request);
  if (!requireEditor(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const supabase = createAdminClient();

  // Check article exists
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const {
      originalTitle, originalExcerpt, originalContent,
      category, author, publishedAt, imageUrl, imageAlt,
      imageCredit, imagePhotographer, imageSourceUrl, imageYear,
      featured, tags, status, showAuthor,
      entityName, entityType, wikidataId,
      quickFacts, glossary, shortExcerpt, longExcerpt, socialCaption,
      googleSchemaMarkup,
    } = body;

    // Map category name (TH) → category_id (UUID) if provided
    // สำคัญ: ถ้า match ไม่เจอ อย่าส่งชื่อไทยลงไป (จะ error uuid) — ถ้า resolve ไม่ได้ก็ไม่แก้อันนี้
    let categoryId: string | null | undefined;
    if (category !== undefined && category !== null && String(category).trim() !== "") {
      const rawCategory = String(category).trim();

      // ถ้าเป็น UUID อยู่แล้ว ใช้ได้เลย
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(rawCategory)) {
        categoryId = rawCategory;
      } else {
        // 1) match name_th
        const { data: catRow } = await supabase
          .from("categories")
          .select("id")
          .eq("name_th", rawCategory)
          .maybeSingle();
        if (catRow) {
          categoryId = catRow.id;
        } else {
          // 2) match slug
          const { data: slugRow } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", rawCategory)
            .maybeSingle();
          if (slugRow) {
            categoryId = slugRow.id;
          } else {
            // 3) find-or-create "general" — ถ้ายังไม่มีให้ไม่แก้ category
            const { data: generalCat } = await supabase
              .from("categories")
              .select("id")
              .eq("slug", "general")
              .maybeSingle();
            if (generalCat) {
              categoryId = generalCat.id;
            } else {
              const { data: created } = await supabase
                .from("categories")
                .insert({ slug: "general", name_th: "ทั่วไป", name_en: "General", sort_order: 0 })
                .select("id")
                .single();
              categoryId = created?.id ?? undefined;
            }
          }
        }
      }
    }

    const updateData: Record<string, any> = {};
    if (originalTitle !== undefined) updateData.original_title = originalTitle;
    if (originalExcerpt !== undefined) updateData.original_excerpt = originalExcerpt;
    if (originalContent !== undefined) updateData.original_content = originalContent;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (author !== undefined) updateData.author_name = author;
    if (publishedAt !== undefined) updateData.published_at = publishedAt;
    if (imageUrl !== undefined) updateData.image_url = imageUrl || null;
    if (imageAlt !== undefined) updateData.image_alt = imageAlt || null;
    if (imageCredit !== undefined) updateData.image_credit = imageCredit || null;
    if (imagePhotographer !== undefined) updateData.image_photographer = imagePhotographer || null;
    if (imageSourceUrl !== undefined) updateData.image_source_url = imageSourceUrl || null;
    if (imageYear !== undefined) updateData.image_year = imageYear || null;
    if (featured !== undefined) updateData.featured = featured;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;
    if (entityName !== undefined) updateData.entity_name = entityName || null;
    if (entityType !== undefined) updateData.entity_type = entityType || null;
    if (wikidataId !== undefined) updateData.wikidata_id = wikidataId || null;
    if (quickFacts !== undefined) updateData.quick_facts = quickFacts || null;
    if (glossary !== undefined) updateData.glossary = glossary || null;
    if (shortExcerpt !== undefined) updateData.short_excerpt = shortExcerpt || null;
    if (longExcerpt !== undefined) updateData.long_excerpt = longExcerpt || null;
    if (socialCaption !== undefined) updateData.social_caption = socialCaption || null;
    if (googleSchemaMarkup !== undefined) updateData.google_schema_markup = googleSchemaMarkup || null;

    const { data: updated, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("[API] Error updating article:", error);
      return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      article: {
        id: updated.id,
        slug: updated.slug,
        originalTitle: updated.original_title,
        originalExcerpt: updated.original_excerpt,
        originalContent: updated.original_content,
        category: updated.category_id,
        author: updated.author_name,
        authorId: updated.author_id || "",
        publishedAt: updated.published_at || updated.created_at,
        imageUrl: updated.image_url || "",
        imageAlt: updated.image_alt || undefined,
        imageCredit: updated.image_credit || undefined,
        imagePhotographer: updated.image_photographer || undefined,
        imageSourceUrl: updated.image_source_url || undefined,
        imageYear: updated.image_year || undefined,
        featured: updated.featured || false,
        tags: updated.tags || [],
        status: updated.status || "draft",
        showAuthor: true,
        entityName: updated.entity_name || undefined,
        entityType: updated.entity_type || undefined,
        wikidataId: updated.wikidata_id || undefined,
        quickFacts: updated.quick_facts || undefined,
        glossary: updated.glossary || undefined,
        shortExcerpt: updated.short_excerpt || undefined,
        longExcerpt: updated.long_excerpt || undefined,
        socialCaption: updated.social_caption || undefined,
        googleSchemaMarkup: updated.google_schema_markup || undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update article" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/articles/[slug]
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequestUser(request);
  if (!requireEditor(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Deleted: ${slug}` });
}
