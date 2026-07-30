import { getTranslatedSummaries } from "@/lib/article-service-supabase";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { ArticleCard } from "@/components/articles/article-card";
import { AdUnit } from "@/components/analytics/adsense";
import { getSettings } from "@/lib/site-settings";

interface HomePageProps {
  locale: Locale;
}

export async function HomePage({ locale }: HomePageProps) {
  const allArticles = await getTranslatedSummaries(locale);
  const latestArticles = allArticles.slice(0, 3);
  const settings = await getSettings();

  return (
    <>
      {/* Ad Unit — Homepage Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AdUnit
          adsenseId={settings.adsenseId}
          slot={settings.adsenseSlotHomepage || "0000000000"}
        />
      </div>

      {/* Latest Articles Section */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-400/40" />
              <span className="text-amber-300/60 text-xs uppercase tracking-[0.2em] font-medium">
                Latest
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-400/40" />
            </div>
            <h2 className="text-3xl md:text-4xl font-prompt font-bold text-white">
              {t("home.latestArticles", locale)}
            </h2>
            <p className="text-white/50 text-sm mt-2 max-w-xl mx-auto">
              "Latest stories and articles about Thai heritage, culture, and wisdom"
            </p>
          </div>

          {latestArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg">
                "No articles yet"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                />
              ))}
            </div>
      )}

          {latestArticles.length > 0 && (
            <div className="mt-10 text-center">
              <a
                href={`/${locale}/articles`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 hover:text-amber-200 transition-all text-sm"
              >
                {t("articles.readMore", locale)}
                <span>&rarr;</span>
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

