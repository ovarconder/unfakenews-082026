"use client";

import Link from "next/link";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import type { ArticleSummary } from "@/lib/article-service-supabase";
import { Calendar, User } from "lucide-react";

interface ArticleCardProps {
  article: ArticleSummary;
  locale: Locale;
  featured?: boolean;
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
        className="group block relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a1628] to-[#0f1f3a] border border-white/10 hover:border-amber-300/30 transition-all duration-500"
      >
        {article.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] to-transparent" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-300/15 text-amber-300 text-xs font-medium">
              {article.category}
            </span>
            {article.featured && (
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-medium">
                {t("home.featured", locale)}
              </span>
            )}
          </div>
          <h3 className="text-xl md:text-2xl font-prompt font-bold text-white group-hover:text-amber-200 transition-colors mb-3">
            {article.title}
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3 font-thai">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4 text-white/40 text-xs">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <User size={12} />
              {article.author}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-amber-300 text-sm font-medium group-hover:gap-2 transition-all">
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
      className="group block rounded-lg bg-[#0a1628]/80 border border-white/5 hover:border-amber-300/20 transition-all duration-300 overflow-hidden"
    >
      {article.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] to-transparent" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-300/15 text-amber-300 text-[10px] font-medium">
            {article.category}
          </span>
          {article.featured && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-medium">
              {t("home.featured", locale)}
            </span>
          )}
        </div>
        <h3 className="text-base font-prompt font-semibold text-white group-hover:text-amber-200 transition-colors mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-white/50 text-xs leading-relaxed mb-3 line-clamp-2 font-thai">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-white/30 text-[10px]">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {date}
          </span>
          <span className="flex items-center gap-1">
            <User size={10} />
            {article.author}
          </span>
        </div>
      </div>
    </Link>
  );
}

