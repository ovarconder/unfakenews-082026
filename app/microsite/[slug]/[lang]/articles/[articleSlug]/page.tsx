// ============================================================
// Microsite Article Detail Page
// ============================================================

import { getMicrositeBySlug, getMergedMicrositeSettings } from "@/lib/microsite-service";
import { getLocale, type Locale } from "@/lib/locales";
import { getDefaultSettings } from "@/lib/site-settings";
import { MicrositeArticleDetail } from "@/components/microsite/microsite-article-detail";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string; lang: string; articleSlug: string }>;
}

export default async function MicrositeArticlePage({ params }: PageProps) {
  const { slug, lang, articleSlug } = await params;
  const locale = getLocale(lang);
  
  const microsite = await getMicrositeBySlug(slug);
  if (!microsite || !microsite.is_active) {
    notFound();
  }

  const settings = await getMergedMicrositeSettings(microsite);

  return (
    <MicrositeArticleDetail
      micrositeSlug={slug}
      articleSlug={articleSlug}
      locale={locale}
      microsite={microsite}
      settings={settings}
    />
  );
}