"use client";


import Link from "next/link";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { LOCALE_NAMES } from "@/lib/locales";
import type { ArticleSummary } from "@/lib/article-service-supabase";
import { Calendar, User, Globe } from "lucide-react";

interface ArticleCardProps {
  article: ArticleSummary;
  locale: Locale;
  featured?: boolean;
}

// ★ Badge แสดงภาษาที่บทความนี้มี (จาก availableLocales ใน summary)
function LanguageBadges({ locales }: { locales?: string[] }) {
  if (!locales || locales.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/50">
      <Globe size={11} className="text-brand-primary/70" />
      {locales.map((l) => (
        <span
          key={l}
          className="uppercase font-semibold tracking-wide"
          title={LOCALE_NAMES[l as Locale]?.english || l}
        >
          {l}
        </span>
      ))}
    </span>
  );
}

export function ArticleCard({ article, locale, featured = false }: ArticleCardProps) {
  const date = new Date(article.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (featured) {
    return (
      <Link
        href={`/${locale}/articles/${article.slug}`}
        className="group block relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-bg-secondary to-brand-card border border-white/10 hover:border-brand-primary/30 transition-all duration-500"
      >
        {article.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-secondary to-transparent" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-medium">
              {article.category}
            </span>
            {article.featured && (
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg text-xs font-medium">
                {t("home.featured", locale)}
              </span>
            )}
          </div>
          <h3 className="text-xl md:text-2xl font-prompt font-bold text-white group-hover:text-brand-primary transition-colors mb-3">
            {article.title}
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3 font-thai">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4 text-white/40 text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <User size={12} />
              {article.author}
            </span>
            <LanguageBadges locales={article.availableLocales} />
          </div>
          <div className="mt-4 flex items-center gap-1 text-brand-primary text-sm font-medium group-hover:gap-2 transition-all">
            {t("articles.readMore", locale)}
            <span className="text-lg">&rarr;</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/articles/${article.slug}`}
      className="group block rounded-lg bg-brand-bg-secondary border border-white/5 hover:border-brand-primary/20 transition-all duration-300 overflow-hidden"
    >
      {article.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-secondary to-transparent" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary text-[10px] font-medium">
            {article.category}
          </span>
          {article.featured && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg text-[10px] font-medium">
              {t("home.featured", locale)}
            </span>
          )}
        </div>
        <h3 className="text-base font-prompt font-semibold text-white group-hover:text-brand-primary transition-colors mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-white/50 text-xs leading-relaxed mb-3 line-clamp-2 font-thai">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-white/30 text-[10px] flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {date}
          </span>
          <span className="flex items-center gap-1">
            <User size={10} />
            {article.author}
          </span>
          <LanguageBadges locales={article.availableLocales} />
        </div>
      </div>
    </Link>
  );
}
