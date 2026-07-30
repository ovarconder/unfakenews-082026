// ============================================================
// Microsite Home Page
// ============================================================

import { getMicrositeBySlug, getMergedMicrositeSettings, getMicrositeArticles } from "@/lib/microsite-service";
import { getLocale, ALL_LOCALES, type Locale } from "@/lib/locales";
import { getDefaultSettings } from "@/lib/site-settings";
import { MicrositeHomeContent } from "@/components/microsite/microsite-home-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const locale = getLocale(lang);
  const microsite = await getMicrositeBySlug(slug);
  
  if (!microsite) {
    return { title: "Not Found" };
  }

  const defaults = getDefaultSettings();
  const title = microsite.meta_title || `${microsite.name} | ${defaults.name}`;
  const description = microsite.meta_description || microsite.description || defaults.metaDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: microsite.name,
    },
  };
}

export default async function MicrositeHomePage({ params }: PageProps) {
  const { slug, lang } = await params;
  const locale = getLocale(lang);
  
  const microsite = await getMicrositeBySlug(slug);
  if (!microsite || !microsite.is_active) {
    notFound();
  }

  const settings = await getMergedMicrositeSettings(microsite);
  const articles = await getMicrositeArticles(slug, locale, { publishedOnly: true });

  return (
    <MicrositeHomeContent
      microsite={microsite}
      settings={settings}
      locale={locale}
      articles={articles}
    />
  );
}