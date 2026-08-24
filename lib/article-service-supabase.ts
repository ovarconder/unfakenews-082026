// ============================================================
// Siam Heritage - Supabase Article Service
// ============================================================
// แทนที่ article-service.ts เดิมที่ใช้ local filesystem
// ใช้ Supabase Database แทน
// ============================================================

import { createClient as createServerClient } from "./supabase-server";
import { createAdminClient } from "./supabase-server";
import type { Locale } from "./locales";
import type { TranslationStatus } from "./types";

// ============================================================
// Article Interfaces (Public)
// ============================================================

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  imageAlt?: string;
  featured?: boolean;
  tags?: string[];
  translationStatus: TranslationStatus;
  /** ภาษาที่บทความนี้ "เผยแพร่จริง" (ต้นฉบับ TH + translation_status=complete) */
  availableLocales?: string[];
}

export interface ArticleFull extends ArticleSummary {
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  imageCredit?: string;
  imagePhotographer?: string;
  imageSourceUrl?: string;
  imageYear?: string;
  /** Google Schema Markup — JSON-LD structured data จาก DB columns */
  googleSchemaMarkup?: Record<string, unknown> | null;
}

// ============================================================
// Server-side: Get all articles as summaries (Main Site Only)
// ============================================================
// Filter: microsite_id IS NULL — ไม่เอา articles ของ microsites

export async function getTranslatedSummaries(locale: Locale): Promise<ArticleSummary[]> {
  const supabase = await createServerClient();
  
  const { data: articles } = await supabase
    .from("articles")
    .select(`
      id, slug, original_title, original_excerpt, short_excerpt, long_excerpt, original_content, tags,
      categories(name_th, name_en),
      author_name, published_at, image_url, image_alt, featured
    `)
    .eq("status", "published")
    .is("microsite_id", null) // ★ เฉพาะของ main site
    .order("published_at", { ascending: false });

  if (!articles) return [];

  const summaries: ArticleSummary[] = await Promise.all(
    articles.map(async (article: any) => {
      const categoryName = locale === "th"
        ? article.categories?.name_th || ""
        : article.categories?.name_en || "";

      // ดึง translation ทุกฟิลด์ที่ใช้แสดงในการ์ด (title + excerpt หลากหลายแบบ)
      const { data: trans } = await supabase
        .from("translations")
        .select("title, excerpt, short_excerpt, long_excerpt, content, translation_status")
        .eq("article_id", article.id)
        .eq("locale", locale)
        .maybeSingle();

      const status: TranslationStatus =
        (trans as any)?.translation_status || "pending";

      const title =
        locale === "th"
          ? article.original_title
          : (trans as any)?.title || article.original_title;

      // เลือก excerpt ตามลำดับ: ธรรมดา (excerpt) > สั้น > ยาว > content (ตาม locale)
      const excerpt = resolveSummaryExcerpt(locale, article, trans as any);

      // ★ availableLocales — ภาษาทั้งหมดที่บทความนี้ "เผยแพร่จริง"
      //    (เปลี่ยนค่าเฉพาะที่เป็น translation_status = 'complete')
      //    โดยปกติ языкไทย (ต้นฉบับ) มีเสมอ เพราะบทความนี้ status = published แล้ว
      const { data: allTrans } = await supabase
        .from("translations")
        .select("locale, translation_status")
        .eq("article_id", article.id);

      const availableLocales = ["th"];
      if (Array.isArray(allTrans)) {
        for (const tr of allTrans as any[]) {
          if (
            tr?.locale &&
            tr.locale !== "th" &&
            tr.translation_status === "complete" &&
            !availableLocales.includes(tr.locale)
          ) {
            availableLocales.push(tr.locale);
          }
        }
      }

      return {
        id: article.id,
        slug: article.slug,
        title,
        excerpt: cleanExcerpt(excerpt),
        category: categoryName,
        author: article.author_name,
        publishedAt: article.published_at,
        imageUrl: article.image_url || undefined,
        imageAlt: article.image_alt || undefined,
        featured: article.featured,
        tags: (article as any).tags || [],
        translationStatus: status,
        availableLocales,
      };
    })
  );

  return summaries;
}

/**
 * เลือก excerpt ตามลำดับความสำคัญ: ธรรมดา (excerpt) > สั้น (short_excerpt) > ยาว (long_excerpt)
 * ถ้าไม่มีเลยจริงๆ ค่อย fallback ไปใช้เนื้อหา (content)
 * - ภาษาไทย → ใช้ field ต้นฉบับจาก articles
 * - ภาษาอื่น → ใช้ field ที่แปลแล้วจาก translations ก่อน แล้วค่อย fallback ไปต้นฉบับ
 */
function resolveSummaryExcerpt(
  locale: Locale,
  article: any,
  trans: any
): string {
  if (locale === "th") {
    return (
      article.original_excerpt ||
      article.short_excerpt ||
      article.long_excerpt ||
      article.original_content ||
      ""
    );
  }

  // มีการแปลแล้ว → ใช้ฟิลด์ที่แปลตามลำดับ แล้วค่อย fallback ไปต้นฉบับ
  if (trans) {
    return (
      trans.excerpt ||
      trans.short_excerpt ||
      trans.long_excerpt ||
      trans.content ||
      article.original_excerpt ||
      article.short_excerpt ||
      article.long_excerpt ||
      article.original_content ||
      ""
    );
  }

  // ยังไม่มีการแปล → fallback เป็นฟิลด์ต้นฉบับ
  return (
    article.original_excerpt ||
    article.short_excerpt ||
    article.long_excerpt ||
    article.original_content ||
    ""
  );
}

/**
 * ทำความสะอาด excerpt ให้เป็นข้อความสั้นพอดีสำหรับแสดงบนการ์ด/รายการบทความ
 * - ตัด markdown/HTML tags ออก
 * - ย่อความยาวไม่เกิน MAX chars (ตัดที่คำ/ประโยคสมบูรณ์)
 */
const EXCERPT_MAX_CHARS = 180;

function cleanExcerpt(raw: string | null | undefined): string {
  if (!raw) return "";

  let text = raw
    // strip markdown heading/bold/links/images
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1") // links
    .replace(/[#>*_`~]/g, "") // markdown symbols
    .replace(/<[^>]+>/g, "") // HTML tags
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= EXCERPT_MAX_CHARS) return text;

  // ตัดให้ไม่เกิน max แล้วปิดท้ายที่ขอบคำ
  const cut = text.slice(0, EXCERPT_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  const truncated = lastSpace > EXCERPT_MAX_CHARS * 0.6 ? cut.slice(0, lastSpace) : cut;
  return truncated.trimEnd() + "…";
}

// ============================================================
// Server-side: Get featured articles
// ============================================================

export async function getFeaturedSummaries(locale: Locale): Promise<ArticleSummary[]> {
  const all = await getTranslatedSummaries(locale);
  return all.filter((a) => a.featured);
}

// ============================================================
// Server-side: Get latest articles
// ============================================================

export async function getLatestSummaries(locale: Locale, count?: number): Promise<ArticleSummary[]> {
  const all = await getTranslatedSummaries(locale);
  return count ? all.slice(0, count) : all;
}

// ============================================================
// ★ IMPORTANT: getFullArticle (ด้านล่าง)
//    ต้องรวม column `status` ในการ select เสมอ
//    เพราะ function เช็ค status ที่ JS (ถ้า select ไม่ได้ → status=undefined
//    → ตีความเป็น "not published" → คืน null → หน้า detail 404 ทุกบทความ published)
// ============================================================

// ============================================================
// Server-side: ตรวจสอบสิทธิ์ preview บทความ (draft)
// ============================================================
// ใช้ session ของ Supabase Auth + permission
// มีสิทธิ์ preview เมื่อ user เป็น writer/editor/admin
//   (ใครมีสิทธิ์ article:create ขึ้นไป)

export async function canPreviewArticle(): Promise<boolean> {
  try {
    const { getCurrentSession } = await import("./auth-service");
    const { hasPermission } = await import("./auth-types");
    const { user } = await getCurrentSession();
    if (!user) return false;
    return hasPermission(user.role, "article:create");
  } catch (err: any) {
    console.error("[canPreviewArticle] error:", err?.message || err);
    return false;
  }
}

// ============================================================
// Server-side: Get full article with content
// ============================================================

export async function getFullArticle(
  slug: string,
  locale: Locale,
  opts?: { preview?: boolean }
): Promise<ArticleFull | null> {
  const isPreview = opts?.preview === true;
  const supabase = await createServerClient();
  const adminClient = createAdminClient();

  // Preview → ใช้ admin client (bypass RLS) และไม่กรอง status เพื่อให้เห็น draft
  const client = isPreview ? adminClient : supabase;

  // Get article
  let { data: article } = await client
    .from("articles")
    .select(`
      id, slug, status, original_title, original_excerpt, original_content, tags,
      categories(name_th, name_en),
      author_name, published_at, created_at, image_url, image_alt, featured,
      image_credit, image_photographer, image_source_url, image_year,
      google_schema_markup
    `)
    .eq("slug", slug)
    .is("microsite_id", null) // ★ เฉพาะของ main site
    .maybeSingle();

  if (!article) {
    console.error(`[getFullArticle] No article found for slug="${slug}" locale="${locale}"`);
    return null;
  }

  // ไม่ใช่ preview → ต้องเป็น published เท่านั้น (กัน draft หลุดถึงสาธารณะ)
  if (!isPreview && (article as any).status !== "published") {
    console.error(`[getFullArticle] Article "${slug}" is not published (status=${(article as any).status})`);
    return null;
  }

  const art = article as any;
  const categoryName = locale === "th"
    ? art.categories?.name_th || ""
    : art.categories?.name_en || "";

  // Google Schema Markup (custom JSON-LD from DB)
  const googleSchemaMarkup = art.google_schema_markup
    ? (typeof art.google_schema_markup === "string"
        ? JSON.parse(art.google_schema_markup)
        : art.google_schema_markup)
    : null;

  // Helper: extract image metadata fields from article row
  const getImageFields = (a: any) => ({
    imageCredit: a.image_credit || undefined,
    imagePhotographer: a.image_photographer || undefined,
    imageSourceUrl: a.image_source_url || undefined,
    imageYear: a.image_year || undefined,
  });

  // Get translation for this locale
  const { data: rawTrans } = await supabase
    .from("translations")
    .select("*")
    .eq("article_id", art.id)
    .eq("locale", locale)
    .maybeSingle();

  const trans = rawTrans as any;

  // ★ availableLocales — ภาษาทั้งหมดที่บทความนี้ "เผยแพร่จริง"
  //    (ไทยต้นฉบับเสมอ + translation_status = 'complete')
  const { data: allTrans } = await supabase
    .from("translations")
    .select("locale, translation_status")
    .eq("article_id", art.id);
  const availableLocales: string[] = ["th"];
  if (Array.isArray(allTrans)) {
    for (const tr of allTrans as any[]) {
      if (
        tr?.locale &&
        tr.locale !== "th" &&
        tr.translation_status === "complete" &&
        !availableLocales.includes(tr.locale)
      ) {
        availableLocales.push(tr.locale);
      }
    }
  }

  const baseArticle = {
    id: art.id,
    slug: art.slug,
    category: categoryName,
    author: art.author_name,
    // Fallback ไป created_at เผื่อ draft ยังไม่มี published_at
    publishedAt: art.published_at || art.created_at,
    imageUrl: art.image_url || undefined,
    imageAlt: art.image_alt || undefined,
    featured: art.featured,
    availableLocales,
    ...getImageFields(art),
  };

  // Google Schema Markup สำหรับบทความแปล:
  //   - ยังไม่มีการแปล (locale == th) → ใช้จาก articles table (ต้นฉบับ)
  //   - มีคำแปล → ใช้จาก translations table (ที่แปลแล้ว) ถ้ามี ไม่ใช่ fallback ไปต้นฉบับ
  //   - ถ้า translations.google_schema_markup เป็น null → fallback ไป articles table
  let googleSchema: Record<string, unknown> | undefined = undefined;

  if (locale !== "th" && trans && trans.google_schema_markup) {
    googleSchema = typeof trans.google_schema_markup === "string"
      ? JSON.parse(trans.google_schema_markup)
      : trans.google_schema_markup;
  } else {
    googleSchema = googleSchemaMarkup || undefined;
  }

  // If Thai, return original
  if (locale === "th") {
    return {
      ...baseArticle,
      title: art.original_title,
      excerpt: art.original_excerpt,
      content: art.original_content,
      translationStatus: "complete",
      googleSchemaMarkup: googleSchema,
    };
  }

  // If translation exists and full, return it
  if (trans && trans.is_full_translated) {
    return {
      ...baseArticle,
      title: trans.title,
      excerpt: trans.excerpt,
      content: trans.content || art.original_content,
      translationStatus: trans.translation_status as TranslationStatus,
      seoTitle: trans.seo_title || undefined,
      seoDescription: trans.seo_description || undefined,
      googleSchemaMarkup: googleSchema,
    };
  }

  // If summary only
  if (trans) {
    return {
      ...baseArticle,
      title: trans.title,
      excerpt: trans.excerpt,
      content: trans.content || art.original_content,
      translationStatus: trans.translation_status as TranslationStatus,
      seoTitle: trans.seo_title || undefined,
      seoDescription: trans.seo_description || undefined,
      googleSchemaMarkup: googleSchema,
    };
  }

  // No translation - return original as pending
  return {
    ...baseArticle,
    title: art.original_title,
    excerpt: art.original_excerpt,
    content: art.original_content,
    translationStatus: "pending",
    googleSchemaMarkup: googleSchema,
  };
}

// ============================================================
// Server-side: Get SEO metadata
// ============================================================

export async function getArticleSEO(slug: string, locale: Locale): Promise<{
  title: string;
  description: string;
} | null> {
  const supabase = await createServerClient();

  const { data: rawArticle } = await supabase
    .from("articles")
    .select("id, original_title, original_excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .is("microsite_id", null) // ★ เฉพาะของ main site
    .maybeSingle();

  if (!rawArticle) return null;
  const article = rawArticle as any;

  if (locale === "th") {
    return {
      title: article.original_title,
      description: article.original_excerpt,
    };
  }

  const { data: trans } = await supabase
    .from("translations")
    .select("seo_title, seo_description, title, excerpt")
    .eq("article_id", article.id)
    .eq("locale", locale)
    .maybeSingle();

  return {
    title: (trans as any)?.seo_title || (trans as any)?.title || article.original_title,
    description: (trans as any)?.seo_description || (trans as any)?.excerpt || article.original_excerpt,
  };
}
