// ============================================================
// Admin: Edit Article
// ============================================================

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";
import EditArticleClient from "./edit-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createAdminClient();

  // Fetch article from Supabase
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
      notFound();
    }
    return <EditArticleClient article={fallback} translations={[]} articleId="" />;
  }

  // Map Supabase row → ArticleMaster
  // ★ ทุก string ต้อง default เป็น "" เพราะ ArticleEditor มี .trim() เสมอ
  const article = {
    id: row.id,
    slug: row.slug,
    originalTitle: row.original_title || "",
    originalExcerpt: row.original_excerpt || "",
    originalContent: row.original_content || "",
    category: row.category_id,
    author: row.author_name || "",
    authorId: row.author_id || "",
    publishedAt: row.published_at || row.created_at,
    imageUrl: row.image_url || "",
    imageAlt: row.image_alt || "",
    imageCredit: row.image_credit || "",
    imagePhotographer: row.image_photographer || "",
    imageSourceUrl: row.image_source_url || "",
    imageYear: row.image_year || "",
    featured: row.featured || false,
    tags: row.tags || [],
    status: row.status || "draft",
    showAuthor: true,
    entityName: row.entity_name || "",
    entityType: row.entity_type || "",
    wikidataId: row.wikidata_id || "",
    quickFacts: row.quick_facts || undefined,
    glossary: row.glossary || undefined,
    shortExcerpt: row.short_excerpt || "",
    longExcerpt: row.long_excerpt || "",
    socialCaption: row.social_caption || "",
    googleSchemaMarkup: row.google_schema_markup || "",
  };

  // Fetch existing translations for this article
  const { data: translations } = await supabase
    .from("translations")
    .select("*")
    .eq("article_id", row.id);

  return (
    <EditArticleClient
      article={article}
      articleId={row.id}
      translations={translations || []}
    />
  );
}
