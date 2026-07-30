// ============================================================
// GET, POST /api/admin/articles
// ============================================================
// Admin: จัดการบทความ

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-service";
import { getAllArticleMasters } from "@/lib/articles-data";
import { createAdminClient } from "@/lib/supabase-server";
import type { ArticleMaster } from "@/lib/types";

// ============================================================
// GET /api/admin/articles — ดึงจาก Supabase articles table
// ============================================================

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] Error fetching articles from Supabase:", error);
      // Fallback: ใช้ hardcoded data ถ้า Supabase ยังไม่มี
      const fallback = getAllArticleMasters();
      return NextResponse.json({
        articles: fallback.map((m) => ({ ...m, translations: {} })),
        total: fallback.length,
        source: "fallback",
      });
    }

    // Map Supabase rows → ArticleMaster[]
    const articles: ArticleMaster[] = (rows || []).map((row: any) => ({
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
      status: row.status || "published",
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
      translations: {},
    }));

    return NextResponse.json({
      articles,
      total: articles.length,
      source: "supabase",
    });
  } catch (err: any) {
    console.error("[API] Error in GET /api/admin/articles:", err);
    // Fallback: hardcoded data
    const fallback = getAllArticleMasters();
    return NextResponse.json({
      articles: fallback.map((m) => ({ ...m, translations: {} })),
      total: fallback.length,
      source: "fallback",
    });
  }
}

// ============================================================
// POST /api/admin/articles — สร้างบทความใหม่ใน Supabase
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { allowed, user } = await requirePermission("article:create");
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug, originalTitle, originalExcerpt, originalContent,
      category, author, publishedAt, imageUrl, imageAlt,
      imageCredit, imagePhotographer, imageSourceUrl, imageYear,
      featured, tags, status,
      entityName, entityType, wikidataId,
      quickFacts, glossary, shortExcerpt, longExcerpt, socialCaption,
      googleSchemaMarkup,
    } = body;

    // Validate
    if (!slug || !originalTitle || !originalContent) {
      return NextResponse.json(
        { error: "slug, originalTitle, and originalContent are required" },
        { status: 400 }
      );
    }

    // Check duplicate slug in Supabase
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Article with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Map category name (TH) → category_id (UUID)
    let categoryId = category;
    if (category && typeof category === "string" && category !== "General") {
      const { data: catRow } = await supabase
        .from("categories")
        .select("id")
        .eq("name_th", category)
        .maybeSingle();
      if (catRow) {
        categoryId = catRow.id;
      } else {
        // Fallback: try to find/create "ทั่วไป" category
        const { data: generalCat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", "general")
          .maybeSingle();
        categoryId = generalCat?.id || category;
      }
    }

    // Create new article in Supabase
    const { data: inserted, error } = await supabase
      .from("articles")
      .insert({
        slug,
        original_title: originalTitle,
        original_excerpt: originalExcerpt || originalContent.slice(0, 200).replace(/[#*\n]/g, ""),
        original_content: originalContent,
        category_id: categoryId,
        author_id: user?.id || "",
        author_name: author || user?.name || "Admin",
        published_at: publishedAt || new Date().toISOString().split("T")[0],
        image_url: imageUrl || null,
        image_alt: imageAlt || null,
        image_credit: imageCredit || null,
        image_photographer: imagePhotographer || null,
        image_source_url: imageSourceUrl || null,
        image_year: imageYear || null,
        featured: featured || false,
        tags: tags || [],
        status: status || "draft",
        entity_name: entityName || null,
        entity_type: entityType || null,
        wikidata_id: wikidataId || null,
        quick_facts: quickFacts || null,
        glossary: glossary || null,
        short_excerpt: shortExcerpt || null,
        long_excerpt: longExcerpt || null,
        social_caption: socialCaption || null,
        google_schema_markup: googleSchemaMarkup || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Error inserting article to Supabase:", error);
      return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
    }

    // Map back to ArticleMaster for response
    const newArticle: ArticleMaster = {
      id: inserted.id,
      slug: inserted.slug,
      originalTitle: inserted.original_title,
      originalExcerpt: inserted.original_excerpt,
      originalContent: inserted.original_content,
      category: inserted.category_id,
      author: inserted.author_name,
      authorId: inserted.author_id || "",
      publishedAt: inserted.published_at || inserted.created_at,
      imageUrl: inserted.image_url || "",
      imageAlt: inserted.image_alt || undefined,
      imageCredit: inserted.image_credit || undefined,
      imagePhotographer: inserted.image_photographer || undefined,
      imageSourceUrl: inserted.image_source_url || undefined,
      imageYear: inserted.image_year || undefined,
      featured: inserted.featured || false,
      tags: inserted.tags || [],
      status: inserted.status || "draft",
      showAuthor: true,
      entityName: inserted.entity_name || undefined,
      entityType: inserted.entity_type || undefined,
      wikidataId: inserted.wikidata_id || undefined,
      quickFacts: inserted.quick_facts || undefined,
      glossary: inserted.glossary || undefined,
      shortExcerpt: inserted.short_excerpt || undefined,
      longExcerpt: inserted.long_excerpt || undefined,
      socialCaption: inserted.social_caption || undefined,
      googleSchemaMarkup: inserted.google_schema_markup || undefined,
    };

    return NextResponse.json({
      success: true,
      article: newArticle,
    });
  } catch (err: any) {
    console.error("[API] Error in POST /api/admin/articles:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create article" },
      { status: 500 }
    );
  }
}
