// ============================================================
// Microsite Article Detail (Client Component)
// ============================================================
// - ดึง article จาก Supabase (filter โดย microsite_id)
// - JIT translation สำหรับ Tier 2 languages
// - Social share buttons
// ============================================================

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import type { Locale } from "@/lib/locales";
import type { Microsite, MicrositeSettings } from "@/lib/microsite-types";
import { Calendar, User, ArrowLeft, Clock, ChevronRight, Share2, Facebook, Twitter, Link as LinkIcon, BookOpen } from "lucide-react";
import { AdUnit } from "@/components/analytics/adsense";

// ============================================================
// Wiki-Style Components (Quick Facts, Glossary, Abstract)
// ============================================================
import WikiHeroSection from "@/components/articles/wiki-hero-section";
import QuickFactsBox from "@/components/articles/quick-facts-box";
import GlossarySection from "@/components/articles/glossary-section";
import ExcerptSection from "@/components/articles/excerpt-section";
import { SchemaArticle } from "@/components/schema-article";
import { getWikiArticle } from "@/lib/wiki-data";
import type { WikiArticle } from "@/lib/wiki-types";
import type { ArticleMaster } from "@/lib/types";

interface MicrositeArticleDetailProps {
  micrositeSlug: string;
  articleSlug: string;
  locale: Locale;
  microsite: Microsite;
  settings: MicrositeSettings | null;
}

interface ArticleData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  imageAlt?: string;
  featured?: boolean;
  tags?: string[];
  translationStatus: string;
}

// ============================================================
// Social Share Component
// ============================================================

function SocialShareButtons({ url, title, description }: { url: string; title: string; description: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      icon: Facebook,
      color: "hover:text-blue-500",
    },
    {
      name: "Twitter/X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: Twitter,
      color: "hover:text-sky-400",
    },
    {
      name: "Copy Link",
      href: "#",
      icon: LinkIcon,
      color: "hover:text-amber-300",
      onClick: async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback
          const textArea = document.createElement("textarea");
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      },
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <Share2 size={14} className="text-white/40" />
      {shareLinks.map((link) => {
        const Icon = link.icon;
        if (link.onClick) {
          return (
            <button
              key={link.name}
              onClick={link.onClick}
              className={`p-1.5 rounded-lg bg-white/5 ${link.color} transition-colors relative`}
              title={copied ? (window.navigator.language?.startsWith("th") ? "คัดลอกแล้ว" : "Copied!") : link.name}
            >
              <Icon size={14} />
              {copied && link.name === "Copy Link" && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap backdrop-blur-sm">
                  {window.navigator.language?.startsWith("th") ? "คัดลอกแล้ว" : "Copied!"}
                </span>
              )}
            </button>
          );
        }
        return (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-1.5 rounded-lg bg-white/5 ${link.color} transition-colors`}
            title={`Share on ${link.name}`}
          >
            <Icon size={14} />
          </a>
        );
      })}
    </div>
  );
}

// ============================================================
// Render Content (รองรับ translatedAltTexts)
// ============================================================

/**
 * แทนที่ alt text ใน markdown ด้วยเวอร์ชันที่แปลแล้ว
 */
function applyTranslatedAltTexts(content: string, translatedAlts?: Record<string, string>): string {
  if (!translatedAlts || Object.keys(translatedAlts).length === 0) return content;
  return content.replace(/!\[(.*?)\]\((.*?)\)/g, (_match, _alt: string, url: string) => {
    const newAlt = translatedAlts[url] || translatedAlts["hero"] || _alt;
    return `![${newAlt}](${url})`;
  });
}

function renderContent(content: string, translatedAlts?: Record<string, string>) {
  const processedContent = applyTranslatedAltTexts(content, translatedAlts);

  return processedContent.split("\n").map((line, idx) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-2xl font-prompt font-bold text-amber-200 mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-xl font-prompt font-semibold text-white mt-8 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={idx} className="text-white/80 ml-4 mb-1">
          {line.replace("- ", "")}
        </li>
      );
    }
    if (line.startsWith("**")) {
      return (
        <p key={idx} className="text-white font-semibold mt-4 mb-2">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (line.trim() === "") {
      return <div key={idx} className="h-3" />;
    }
    return (
      <p key={idx} className="text-white/80 leading-relaxed mb-4">
        {line}
      </p>
    );
  });
}

// ============================================================
// Main Component
// ============================================================

export function MicrositeArticleDetail({ micrositeSlug, articleSlug, locale, microsite, settings }: MicrositeArticleDetailProps) {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  const micrositePrefix = `/${micrositeSlug}/${locale}`;
  const primaryColor = settings?.primaryColor || "#fbbf24";

  useEffect(() => {
    async function loadArticle() {
      try {
        const supabase = createClient();
        
        // Get article with microsite filter
        const { data: rawArticle } = await supabase
          .from("articles")
          .select(`
            id, slug, original_title, original_excerpt, original_content, tags,
            categories!inner(name_th, name_en),
            author_name, published_at, image_url, image_alt, featured
          `)
          .eq("slug", articleSlug)
          .eq("microsite_id", microsite.id)
          .eq("is_published", true)
          .single();

        if (!rawArticle) {
          setLoading(false);
          return;
        }

        const art = rawArticle as any;
        const categoryName = locale === "th" 
          ? art.categories?.name_th || ""
          : art.categories?.name_en || "";

        // Get translation
        const { data: rawTrans } = await supabase
          .from("translations")
          .select("title, excerpt, content, translation_status, is_full_translated")
          .eq("article_id", art.id)
          .eq("locale", locale)
          .maybeSingle();

        const trans = rawTrans as { title?: string; excerpt?: string; content?: string; translation_status?: string; is_full_translated?: boolean } | null;

        // ★ ใช้ content ที่แปลแล้ว (ทุกภาษาแปลเต็มด้วยมือ ไม่มี JIT แล้ว)
        const initialArticle: ArticleData = {
          id: art.id,
          slug: art.slug,
          title: trans?.title || art.original_title,
          excerpt: trans?.excerpt || art.original_excerpt,
          content: trans?.content || art.original_content,
          category: categoryName,
          author: art.author_name,
          publishedAt: art.published_at,
          imageUrl: art.image_url,
          imageAlt: art.image_alt,
          featured: art.featured,
          tags: art.tags || [],
          translationStatus: trans?.translation_status || "pending",
        };

        setArticle(initialArticle);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load article:", err);
        setLoading(false);
      }
    }

    loadArticle();
  }, [articleSlug, locale, microsite.id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center"
        style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}
      >
        <div className="animate-spin w-8 h-8 border-2 rounded-full border-t-transparent"
          style={{ borderColor: `${primaryColor}33`, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center"
        style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}
      >
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4" style={{ color: `${primaryColor}99` }}>404</h1>
          <p className="text-white/60">Article not found</p>
          <Link 
            href={micrositePrefix} 
            className="inline-block mt-4 hover:text-amber-200 transition-colors"
            style={{ color: primaryColor }}
          >
            &larr; {locale === "th" ? "กลับไปหน้าแรก" : "Back to home"}
          </Link>
        </div>
      </div>
    );
  }

  const articleUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://siamheritage.org/${micrositeSlug}/${locale}/articles/${articleSlug}`;

  // Build a minimal master object for Wiki + SchemaArticle
  const master: ArticleMaster = {
    id: article.id,
    slug: article.slug,
    originalTitle: article.title,
    originalExcerpt: article.excerpt,
    originalContent: article.content,
    category: article.category,
    author: article.author,
    publishedAt: article.publishedAt,
    imageUrl: article.imageUrl || undefined,
    imageAlt: article.imageAlt || undefined,
    featured: article.featured || false,
    tags: article.tags || [],
    status: "published",
    showAuthor: microsite.show_author !== false,
  };
  const wikiData: WikiArticle = getWikiArticle(master);

  return (
    <section style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}>
      {/* Schema Article JSON-LD (Wiki-Style enhanced) */}
      <SchemaArticle
        article={master}
        imageUrl={article.imageUrl}
        wikiMetadata={wikiData.metadata}
      />

      {/* WikiHeroSection — รวม hero image + abstract (semantic + AI Overview) */}
      <WikiHeroSection
        article={article as any}
        locale={locale}
        abstract={wikiData.abstract}
        master={master}
      />

      {/* ExcerptSection — Lead Paragraph + Social Caption */}
      {wikiData.excerpts && (
        <div className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ExcerptSection
              excerpts={wikiData.excerpts}
              locale={locale}
              fallbackShort={article.excerpt}
              fallbackLong={wikiData.abstract.full}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="prose prose-invert max-w-none">
                {renderContent(article.content)}
              </div>

              {/* Tags + Share */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-white/40 text-xs">
                      {locale === "th" ? "เผยแพร่" : "Published"}: {new Date(article.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                    {/* Social Share Buttons */}
                    <SocialShareButtons 
                      url={articleUrl}
                      title={article.title}
                      description={article.excerpt}
                    />
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-white/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* QuickFactsBox — Wiki-Style: ข้อมูลสำคัญแบบ Key-Value */}
                <QuickFactsBox
                  facts={wikiData.quickFacts}
                  locale={locale}
                  collapsedRows={6}
                />

                {/* GlossarySection — Wiki-Style: แสดงเฉพาะเมื่อมีคำศัพท์ที่มีคำอธิบายจริงๆ */}
                {wikiData.glossary.some(e => e.definition && e.definition.length > 0) && (
                  <GlossarySection
                    entries={wikiData.glossary}
                    locale={locale}
                    collapsedCount={4}
                  />
                )}

                {/* About Microsite */}
                <div className="rounded-xl border border-white/10 p-5"
                  style={{ backgroundColor: settings?.cardColor || '#0f1f3a' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {microsite.logo_url && (
                      <img
                        src={microsite.logo_url}
                        alt={microsite.name}
                        className="w-10 h-10 rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-sm">{microsite.name}</h3>
                      <p className="text-white/40 text-[10px]">
                        {locale === "th" ? "ไมโครไซต์" : "Microsite"}
                      </p>
                    </div>
                  </div>
                  {microsite.description && (
                    <p className="text-white/50 text-xs leading-relaxed">
                      {microsite.description}
                    </p>
                  )}
                  <Link
                    href={micrositePrefix}
                    className="block mt-3 text-xs font-medium hover:text-amber-200 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    {locale === "th" ? "ไปหน้าแรกของ" : "Go to"} {microsite.name} &rarr;
                  </Link>
                </div>

                {/* AdSense Ad Unit — Sidebar */}
                <AdUnit
                  adsenseId={settings?.adsenseId || undefined}
                  slot={settings?.adsenseSlotSidebar || ""}
                  format="rectangle"
                />

                {/* Link to Main Site */}
                {microsite.show_main_site_link && (
                  <div className="rounded-xl border border-white/10 p-5"
                    style={{ backgroundColor: settings?.cardColor || '#0f1f3a' }}
                  >
                    <h3 className="text-white/40 text-xs font-medium mb-3">
                      {locale === "th" ? "ไซต์หลัก" : "Main Site"}
                    </h3>
                    <Link
                      href={`/${locale}`}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-amber-200 transition-colors"
                    >
                      <span className="text-2xl">🏛️</span>
                      {locale === "th" ? "อันเฟคนิวส์" : "UnFake News"}
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}