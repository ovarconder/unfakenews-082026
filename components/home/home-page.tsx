import { getTranslatedSummaries, getFeaturedSummaries } from "@/lib/article-service-supabase";
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
  // Hero = highlight (featured) articles, 6 items
  const featuredArticles = await getFeaturedSummaries(locale);
  // ถ้า highlight < 3 → ใช้ latest มาเติมให้ครบ 6
  const heroArticles =
    featuredArticles.length >= 3
      ? featuredArticles.slice(0, 6)
      : allArticles.slice(0, 6);
  // Latest section = 3 บทความล่าสุด (ตัด hero ที่ซ้ำออกชั่วคราว)
  const latestArticles = allArticles.slice(0, 3);
  const settings = await getSettings();
  // tagline: ใช้ค่าจาก site settings (settings.tagline) ก่อน ถ้าไม่มีให้ใช้ข้อความ translation (hero.tagline)
  const tagline = settings?.tagline?.trim() || t("hero.tagline", locale);

  return (
    <>
      {/* Ad Unit — Homepage Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AdUnit
          adsenseId={settings.adsenseId}
          slot={settings.adsenseSlotHomepage || "0000000000"}
        />
      </div>

      {/* Highlight / Hero Section — featured articles */}
      {heroArticles.length > 0 && (
        <section className="py-16 md:py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-400/40" />
                <span className="text-amber-300/60 text-xs uppercase tracking-[0.2em] font-medium">
                  {t("home.featured", locale)}
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-400/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-prompt font-bold text-white">
                Highlight
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {heroArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                  featured
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles Section */}
      <section className="py-16 md:py-24 relative">
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
              {tagline}
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
