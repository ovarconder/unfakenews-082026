import { ArticleDetail } from "@/components/articles/article-detail";
import { getFullArticle } from "@/lib/article-service-supabase";
import { getSettings } from "@/lib/site-settings";
import { ALL_LOCALES, getActiveLocales, type Locale } from "@/lib/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ArticleFull } from "@/lib/article-service-supabase";

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

  const baseUrl = settings?.url || process.env.NEXT_PUBLIC_SITE_URL || "https://siamheritage.org";
  const activeLocales = getActiveLocales();

  // Build hreflang links — ทุกภาษาที่ active
  const alternates: Record<string, string> = {};
  for (const l of activeLocales) {
    alternates[l] = `${baseUrl}/${l}/articles/${slug}`;
  }
  alternates["x-default"] = `${baseUrl}/en/articles/${slug}`;

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
      publishedTime: article.publishedAt,
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
    // ไม่มี noindex — ให้ Google index ทุกบทความ
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
  const article = await getFullArticle(slug, locale);

  if (!article) {
    notFound();
  }

  return <ArticleDetail article={article} locale={locale} />;
}
