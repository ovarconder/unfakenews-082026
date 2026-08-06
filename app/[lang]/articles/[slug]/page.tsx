import { ArticleDetail } from "@/components/articles/article-detail";
import { getFullArticle } from "@/lib/article-service-supabase";
import { getSettings } from "@/lib/site-settings";
import type { Locale } from "@/lib/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedVariants, getBaseUrl } from "@/lib/seo-utils";
import { SchemaClaimReview } from "@/components/schema-claimreview";

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;

  // ดึงข้อมูลบทความ + settings
  const [article, settings] = await Promise.all([
    getFullArticle(slug, locale),
    getSettings(),
  ]);

  if (!article) return {};

  const baseUrl = settings?.url || process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl();

  // ============================================================
  // ★ hreflang — สร้างจาก variant ภาษาที่ "เผยแพร่จริง" เท่านั้น
  //    (ไม่ใช่ทุก active locale — กันลิงก์ 404 ไป ภาษาที่ยังแปลไม่เสร็จ)
  // ============================================================
  let publishedVariants: ReturnType<typeof getPublishedVariants> = [];
  try {
    const { createAdminClient } = await import("@/lib/supabase-server");
    const supabase = createAdminClient();
    const { data: articleRow } = await supabase
      .from("articles")
      .select(`
        id, slug, status, published_at, original_title, updated_at,
        translations(article_id, locale, title, translated_at, translation_status),
        original_excerpt
      `)
      .eq("slug", slug)
      .maybeSingle();
    if (articleRow) {
      publishedVariants = getPublishedVariants(articleRow);
    }
  } catch (err) {
    console.warn("[Article Metadata] Could not load published variants:", err);
  }

  const alternates: Record<string, string> = {};
  for (const v of publishedVariants) {
    alternates[v.locale] = v.url;
  }
  // x-default → ชี้ EN ถ้าเผยแพร่, ถ้าไม่มี ให้ชี้ไปภาษาแรกที่เผยแพร่จริง
  if (publishedVariants.some((v) => v.locale === "en")) {
    alternates["x-default"] = `${baseUrl}/en/articles/${slug}`;
  } else if (publishedVariants.length > 0) {
    alternates["x-default"] = publishedVariants[0].url;
  }

  // หา published variant ของภาษาปัจจุบัน (สำหรับ datePublished/dateModified)
  const currentVariant = publishedVariants.find((v) => v.locale === locale);

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: {
      canonical: `${baseUrl}/${locale}/articles/${slug}`,
      languages: alternates,
    },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      url: `${baseUrl}/${locale}/articles/${slug}`,
      siteName: settings.name,
      locale: locale === "en" ? "en_US" : locale,
      type: "article",
      publishedTime: currentVariant?.datePublished || article.publishedAt,
      modifiedTime: currentVariant?.dateModified,
      authors: [article.author],
      ...(article.imageUrl
        ? {
            images: [
              {
                url: article.imageUrl,
                alt: article.imageAlt || article.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
    },
    // ไม่มี noindex — ให้ Google index ทุกบทความที่เผยแพร่
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LangArticlePage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;

  // Fetch article from Supabase
  const [article, publishedVariants] = await Promise.all([
    getFullArticle(slug, locale),
    (async () => {
      try {
        const { createAdminClient } = await import("@/lib/supabase-server");
        const supabase = createAdminClient();
        const { data: articleRow } = await supabase
          .from("articles")
          .select(`
            id, slug, status, published_at, original_title, updated_at,
            translations(article_id, locale, title, translated_at, translation_status),
            original_excerpt
          `)
          .eq("slug", slug)
          .maybeSingle();
        return articleRow ? getPublishedVariants(articleRow) : [];
      } catch (err) {
        console.warn("[Article Page] Could not load published variants:", err);
        return [];
      }
    })(),
  ]);

  if (!article) {
    notFound();
  }

  // ClaimReview schema เฉพาะ variant ที่เพิ่งเผยแพร่จริง (suppress บทความ draft)
  const currentVariant = publishedVariants.find((v) => v.locale === locale);

  // Build the locale URL for canonical / schema
  const settings = await getSettings();
  const baseUrl = settings?.url || process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl();
  const localeUrl = `${baseUrl}/${locale}/articles/${slug}`;

  return (
    <>
      {/* ClaimReview JSON-LD — เฉพาะเมื่อบทความ variant นี้เผยแพร่จริง */}
      {currentVariant && (
        <SchemaClaimReview
          url={currentVariant.url || localeUrl}
          locale={locale}
          headline={currentVariant.title || article.title}
          description={article.excerpt}
          datePublished={
            currentVariant?.datePublished || article.publishedAt
          }
          dateModified={currentVariant?.dateModified}
        />
      )}

      <ArticleDetail article={article} locale={locale} localeUrl={localeUrl} />
    </>
  );
}

// Reexport the type for consumers if needed
export type { Props as LangArticlePageProps };
