// ============================================================
// Microsite Home Page Content (Client Component)
// ============================================================

"use client";

import Link from "next/link";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import type { Microsite, MicrositeSettings } from "@/lib/microsite-types";
import { ArrowRight, Calendar } from "lucide-react";

interface MicrositeHomeContentProps {
  microsite: Microsite;
  settings: MicrositeSettings | null;
  locale: Locale;
  articles: any[];
}

export function MicrositeHomeContent({ microsite, settings, locale, articles }: MicrositeHomeContentProps) {
  const primaryColor = settings?.primaryColor || "#fbbf24";
  const micrositePrefix = `/${microsite.slug}/${locale}`;
  const latestArticles = articles.slice(0, 6);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}
      >
        <div className="absolute inset-0"
          style={{ 
            background: `radial-gradient(ellipse at center, ${primaryColor}08 0%, transparent 70%)` 
          }}
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, ${primaryColor}80)` }}
            />
            <div className="w-2 h-2 rotate-45"
              style={{ backgroundColor: `${primaryColor}99` }}
            />
            <div className="h-px w-12 bg-gradient-to-l from-transparent"
              style={{ backgroundImage: `linear-gradient(to left, transparent, ${primaryColor}80)` }}
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight">
            <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: `linear-gradient(to right, ${primaryColor}CC, ${primaryColor}, ${primaryColor}CC)` 
              }}
            >
              {microsite.name}
            </span>
          </h1>
          {microsite.description && (
            <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              {microsite.description}
            </p>
          )}
          {articles.length > 0 && (
            <Link
              href={`${micrositePrefix}/articles`}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-base font-semibold transition-all duration-300 shadow-lg"
              style={{
                backgroundColor: primaryColor,
                color: '#060e1a',
                boxShadow: `${primaryColor}33 0px 4px 24px`
              }}
            >
              {locale === "th" ? "อ่านบทความล่าสุด" : "Read Latest Articles"}
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent z-10"
          style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}
        />
      </section>

      {/* Latest Articles Section */}
      {latestArticles.length > 0 && (
        <section className="py-20 md:py-28 relative"
          style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-gradient-to-r from-transparent"
                  style={{ backgroundImage: `linear-gradient(to right, transparent, ${primaryColor}66)` }}
                />
                <span className="text-xs uppercase tracking-[0.2em] font-medium"
                  style={{ color: `${primaryColor}99` }}
                >
                  Latest
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent"
                  style={{ backgroundImage: `linear-gradient(to left, transparent, ${primaryColor}66)` }}
                />
              </div>
              <h2 className="text-3xl md:text-4xl font-prompt font-bold text-white">
                {locale === "th" ? "บทความล่าสุด" : "Latest Articles"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestArticles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`${micrositePrefix}/articles/${article.slug}`}
                  className="group block rounded-lg border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden"
                  style={{ backgroundColor: settings?.cardColor || '#0f1f3a' }}
                >
                  {article.imageUrl && (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.imageAlt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t"
                        style={{ background: `linear-gradient(to top, ${settings?.cardColor || '#0f1f3a'}, transparent)` }}
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${primaryColor}26`,
                          color: primaryColor,
                        }}
                      >
                        {article.category}
                      </span>
                    </div>
                    <h3 className="text-base font-prompt font-semibold text-white group-hover:text-amber-200 transition-colors mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-white/50 text-xs leading-relaxed mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-white/30 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(article.publishedAt).toLocaleDateString(
                          locale === "th" ? "th-TH" : "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={`${micrositePrefix}/articles`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm"
              >
                {locale === "th" ? "ดูบทความทั้งหมด" : "View All Articles"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer note / link back to main site */}
      {microsite.show_main_site_link && (
        <section className="py-12 text-center"
          style={{ backgroundColor: settings?.backgroundColorSecondary || '#0a1628' }}
        >
          <p className="text-white/40 text-sm">
            {locale === "th" ? "เป็นส่วนหนึ่งของ" : "Part of"}{" "}
            <Link
              href={`/${locale}`}
              className="hover:text-amber-200 transition-colors font-medium"
              style={{ color: primaryColor }}
            >
              {locale === "th" ? "สยามเฮอริเทจ" : "Siam Heritage"}
            </Link>
          </p>
        </section>
      )}
    </>
  );
}