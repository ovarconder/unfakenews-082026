// ============================================================
// Microsite Articles List Page
// ============================================================

import { getMicrositeBySlug, getMergedMicrositeSettings, getMicrositeArticles } from "@/lib/microsite-service";
import { getLocale, type Locale } from "@/lib/locales";
import { notFound } from "next/navigation";
import { t } from "@/lib/translations";
import { ArticleCard } from "@/components/articles/article-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function MicrositeArticlesPage({ params }: PageProps) {
  const { slug, lang } = await params;
  const locale = getLocale(lang);
  
  const microsite = await getMicrositeBySlug(slug);
  if (!microsite || !microsite.is_active) {
    notFound();
  }

  const settings = await getMergedMicrositeSettings(microsite);
  const articles = await getMicrositeArticles(slug, locale, { publishedOnly: true });

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href={`/${slug}/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm mb-4"
            style={{ color: 'var(--ms-primary, #fbbf24)' }}
          >
            <ArrowLeft size={16} />
            {locale === "th" ? "กลับไปหน้าแรก" : "Back to home"}
          </Link>
          <h1 className="text-3xl md:text-4xl font-prompt font-bold text-white">
            {locale === "th" ? "บทความทั้งหมด" : "All Articles"}
          </h1>
          <p className="text-white/50 mt-2">
            {microsite.name}
          </p>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">
              {locale === "th" ? "ยังไม่มีบทความ" : "No articles yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article: any) => (
              <Link
                key={article.id}
                href={`/${slug}/${locale}/articles/${article.slug}`}
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
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ 
                        backgroundColor: 'var(--ms-primary, #fbbf24)',
                        color: '#060e1a',
                        opacity: 0.9
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
                    <span>
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
        )}
      </div>
    </section>
  );
}