import { getTranslatedSummaries } from "@/lib/article-service";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { ArticleCard } from "@/components/articles/article-card";

interface ArticlesPageProps {
  locale: Locale;
}

export function ArticlesPage({ locale }: ArticlesPageProps) {
  const articles = getTranslatedSummaries(locale);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-400/40" />
            <span className="text-amber-300/60 text-xs uppercase tracking-[0.2em] font-medium">
              Articles
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-400/40" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-prompt font-bold text-white mb-6">
            {t("articles.title", locale)}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            "Collection of articles and stories about Thai culture, heritage, and wisdom."
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">{t("articles.noArticles", locale)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
