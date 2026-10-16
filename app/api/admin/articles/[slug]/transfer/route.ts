// ============================================================
// GET  /api/admin/articles/[slug]/transfer  — Export article + translations as JSON
// POST /api/admin/articles/[slug]/transfer  — Import article + translations from JSON
// ============================================================
// ใช้สำหรับย้ายบทความระหว่างเว็บลูกที่ใช้ schema เดียวกัน
// Format ที่ export ออกมาตรงกับ structure ของ DB ทุกประการ
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase-server";

// ─── Auth helper ──────────────────────────────────────────────

async function getRequestUser(request: NextRequest) {
  const cookieSession = await getCurrentSession();
  if (cookieSession.user) return cookieSession.user;

  const sessionHeader = request.headers.get("x-session-data");
  if (sessionHeader) {
    try {
      const decoded = decodeURIComponent(atob(sessionHeader));
      const userData = JSON.parse(decoded);
      if (userData?.id) return userData;
    } catch {}
  }
  return null;
}

function requireEditor(user: { role: string } | null): boolean {
  if (!user) return false;
  return ["admin", "editor"].includes(user.role);
}

// ─── Export shape ──────────────────────────────────────────────

export interface ArticleTransferPayload {
  /** Schema version — bump เมื่อเปลี่ยน structure */
  __version: 1;
  __exported_at: string;
  __source_slug: string;

  article: {
    slug: string;
    original_title: string;
    original_excerpt: string | null;
    original_content: string | null;
    category_slug: string | null; // ส่ง slug เพื่อ match กับ DB ปลายทาง
    author_name: string | null;
    published_at: string | null;
    image_url: string | null;
    image_alt: string | null;
    image_credit: string | null;
    image_photographer: string | null;
    image_source_url: string | null;
    image_year: string | null;
    featured: boolean;
    tags: string[];
    status: string;
    entity_name: string | null;
    entity_type: string | null;
    wikidata_id: string | null;
    quick_facts: unknown;
    glossary: unknown;
    short_excerpt: string | null;
    long_excerpt: string | null;
    social_caption: string | null;
    google_schema_markup: unknown;
  };

  translations: Array<{
    locale: string;
    title: string | null;
    excerpt: string | null;
    content: string | null;
    short_excerpt: string | null;
    long_excerpt: string | null;
    seo_title: string | null;
    seo_description: string | null;
    tags: string[] | null;
    entity_name: string | null;
    quick_facts: unknown;
    glossary: unknown;
    google_schema_markup: unknown;
    social_caption: string | null;
    translation_status: string | null;
    translated_at: string | null;
  }>;
}

// ============================================================
// GET — Export
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

  // ── 1. Fetch article row ──
  const { data: row, error: artErr } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (artErr || !row) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // ── 2. Resolve category slug (เพื่อ match ที่ปลายทาง) ──
  let categorySlug: string | null = null;
  if (row.category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", row.category_id)
      .maybeSingle();
    categorySlug = cat?.slug ?? null;
  }

  // ── 3. Fetch translations ──
  const { data: translations } = await supabase
    .from("translations")
    .select("*")
    .eq("article_id", row.id);

  // ── 4. Build payload ──
  const payload: ArticleTransferPayload = {
    __version: 1,
    __exported_at: new Date().toISOString(),
    __source_slug: slug,

    article: {
      slug: row.slug,
      original_title: row.original_title ?? "",
      original_excerpt: row.original_excerpt ?? null,
      original_content: row.original_content ?? null,
      category_slug: categorySlug,
      author_name: row.author_name ?? null,
      published_at: row.published_at ?? null,
      image_url: row.image_url ?? null,
      image_alt: row.image_alt ?? null,
      image_credit: row.image_credit ?? null,
      image_photographer: row.image_photographer ?? null,
      image_source_url: row.image_source_url ?? null,
      image_year: row.image_year ?? null,
      featured: row.featured ?? false,
      tags: row.tags ?? [],
      status: row.status ?? "draft",
      entity_name: row.entity_name ?? null,
      entity_type: row.entity_type ?? null,
      wikidata_id: row.wikidata_id ?? null,
      quick_facts: row.quick_facts ?? null,
      glossary: row.glossary ?? null,
      short_excerpt: row.short_excerpt ?? null,
      long_excerpt: row.long_excerpt ?? null,
      social_caption: row.social_caption ?? null,
      google_schema_markup: row.google_schema_markup ?? null,
    },

    translations: (translations ?? []).map((t: Record<string, unknown>) => ({
      locale: t.locale,
      title: t.title ?? null,
      excerpt: t.excerpt ?? null,
      content: t.content ?? null,
      short_excerpt: t.short_excerpt ?? null,
      long_excerpt: t.long_excerpt ?? null,
      seo_title: t.seo_title ?? null,
      seo_description: t.seo_description ?? null,
      tags: t.tags ?? null,
      entity_name: t.entity_name ?? null,
      quick_facts: t.quick_facts ?? null,
      glossary: t.glossary ?? null,
      google_schema_markup: t.google_schema_markup ?? null,
      social_caption: t.social_caption ?? null,
      translation_status: t.translation_status ?? null,
      translated_at: t.translated_at ?? null,
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      // บังคับให้ browser download เป็นไฟล์
      "Content-Disposition": `attachment; filename="article-${slug}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// ============================================================
// POST — Import
// ============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequestUser(request);
  if (!requireEditor(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let payload: ArticleTransferPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Basic validation ──
  if (payload.__version !== 1 || !payload.article || !payload.article.slug) {
    return NextResponse.json(
      { error: "Invalid transfer payload — missing __version or article.slug" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // ── 1. Resolve category_id from slug ──
  let categoryId: string | null = null;
  if (payload.article.category_slug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", payload.article.category_slug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  // ── 2. Upsert article (match by slug ของ URL param) ──
  //   ถ้า slug ใน payload ต่างจาก slug ใน URL → ใช้ slug ใน URL เป็นหลัก
  //   (ป้องกันกรณี import ไฟล์ผิด แต่ต้องการ override slug เป้าหมาย)
  const targetSlug = slug;

  const articleUpsert: Record<string, unknown> = {
    slug: targetSlug,
    original_title: payload.article.original_title,
    original_excerpt: payload.article.original_excerpt,
    original_content: payload.article.original_content,
    author_name: payload.article.author_name,
    published_at: payload.article.published_at,
    image_url: payload.article.image_url,
    image_alt: payload.article.image_alt,
    image_credit: payload.article.image_credit,
    image_photographer: payload.article.image_photographer,
    image_source_url: payload.article.image_source_url,
    image_year: payload.article.image_year,
    featured: payload.article.featured ?? false,
    tags: payload.article.tags ?? [],
    // import ด้วย status "draft" เสมอ — ป้องกันการ publish โดยไม่ตั้งใจ
    status: "draft",
    entity_name: payload.article.entity_name,
    entity_type: payload.article.entity_type,
    wikidata_id: payload.article.wikidata_id,
    quick_facts: payload.article.quick_facts,
    glossary: payload.article.glossary,
    short_excerpt: payload.article.short_excerpt,
    long_excerpt: payload.article.long_excerpt,
    social_caption: payload.article.social_caption,
    google_schema_markup: payload.article.google_schema_markup,
    content_updated_at: new Date().toISOString(),
  };
  if (categoryId) articleUpsert.category_id = categoryId;

  const { data: upserted, error: upsertErr } = await supabase
    .from("articles")
    .upsert(articleUpsert, { onConflict: "slug" })
    .select("id, slug")
    .single();

  if (upsertErr || !upserted) {
    console.error("[Transfer Import] Article upsert error:", upsertErr);
    return NextResponse.json(
      { error: `Failed to upsert article: ${upsertErr?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const articleId = upserted.id;

  // ── 3. Upsert translations ──
  const translationResults: { locale: string; ok: boolean; error?: string }[] = [];

  for (const t of payload.translations ?? []) {
    if (!t.locale) continue;

    const tUpsert: Record<string, unknown> = {
      article_id: articleId,
      locale: t.locale,
      translated_at: t.translated_at ?? new Date().toISOString(),
      translation_status: t.translation_status ?? "complete",
    };

    if (t.title) tUpsert.title = t.title;
    if (t.excerpt) tUpsert.excerpt = t.excerpt;
    if (t.content) tUpsert.content = t.content;
    if (t.short_excerpt) tUpsert.short_excerpt = t.short_excerpt;
    if (t.long_excerpt) tUpsert.long_excerpt = t.long_excerpt;
    if (t.seo_title) tUpsert.seo_title = t.seo_title;
    if (t.seo_description) tUpsert.seo_description = t.seo_description;
    if (t.tags?.length) tUpsert.tags = t.tags;
    if (t.entity_name) tUpsert.entity_name = t.entity_name;
    if (t.quick_facts) tUpsert.quick_facts = t.quick_facts;
    if (t.glossary) tUpsert.glossary = t.glossary;
    if (t.google_schema_markup) tUpsert.google_schema_markup = t.google_schema_markup;
    if (t.social_caption) tUpsert.social_caption = t.social_caption;

    const { error: tErr } = await supabase
      .from("translations")
      .upsert(tUpsert, { onConflict: "article_id,locale" });

    translationResults.push({
      locale: t.locale,
      ok: !tErr,
      error: tErr?.message,
    });
  }

  return NextResponse.json({
    success: true,
    article_id: articleId,
    slug: upserted.slug,
    translations_imported: translationResults.filter((r) => r.ok).length,
    translations_failed: translationResults.filter((r) => !r.ok),
    note: "Article imported as draft — please review and publish manually",
  });
}
