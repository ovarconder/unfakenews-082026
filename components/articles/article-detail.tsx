"use client";

import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { getAllArticleMasters } from "@/lib/articles-data";
import { createClient } from "@/lib/supabase-client";
import type { Locale } from "@/lib/locales";
import type { ArticleFull } from "@/lib/article-service-supabase";
import { ChevronRight, Share2, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
import { SchemaArticle } from "@/components/schema-article";
import ExternalLink, { getDomainLabel } from "@/components/external-link";
import { AdUnit } from "@/components/analytics/adsense";
import { useSettings } from "@/components/admin/settings-context";

// ============================================================
// Wiki-Style Components (Quick Facts, Glossary, Abstract)
// ============================================================
import WikiHeroSection from "@/components/articles/wiki-hero-section";
import GlossarySection from "@/components/articles/glossary-section";
import ExcerptSection from "@/components/articles/excerpt-section";
import { getWikiArticle } from "@/lib/wiki-data";
import type { WikiArticle } from "@/lib/wiki-types";
import { ImageGallery, type GalleryImage } from "@/components/articles/image-gallery";
import { YouTubeThumb } from "@/components/articles/youtube-thumb";
import { parseYouTubeShortcode, parseYouTubeIframe } from "@/lib/youtube";
import { renderImageBlock } from "@/components/articles/image-block";
import { isImageBlockOpen, parseImageBlockOpen } from "@/lib/image-block";

interface ArticleDetailProps {
  article: ArticleFull;
  locale: Locale;
  /** URL เต็มของ variant ภาษานี้ (สำหรับ schema/canonical) — optional */
  localeUrl?: string;
}

// ============================================================
// Render markdown-style content (รองรับ imageAltTexts ที่แปลแล้ว)
// ============================================================

/**
 * แทนที่ alt text ใน markdown ด้วยเวอร์ชันที่แปลแล้วจากแปล
 */
function applyTranslatedAltTexts(content: string, translatedAlts?: Record<string, string>): string {
  if (!translatedAlts || Object.keys(translatedAlts).length === 0) return content;
  return content.replace(/!\[(.*?)\]\((.*?)\)/g, (_match, _alt: string, url: string) => {
    const newAlt = translatedAlts[url] || translatedAlts["hero"] || _alt;
    return `![${newAlt}](${url})`;
  });
}

interface ImageAltCache {
  [key: string]: string;
}

/** แยก attributes จากแท็ก <img ...> เช่น src, alt (ครอบคลุม single/double quotes) */
function parseImgAttrs(tag: string): { src: string; alt: string } {
  const attr = (name: string): string => {
    const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
    return m ? m[2] : "";
  };
  return { src: attr("src"), alt: attr("alt") };
}

function renderContent(content: string, translatedAlts?: Record<string, string>) {
  // Apply translated alt texts before rendering
  const processedContent = applyTranslatedAltTexts(content, translatedAlts);
  const lines = processedContent.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ============================================================
    // ★ YouTube embed — {% youtube VIDEO_ID %} หรือ <iframe ...>
    //    แสดง thumbnail ที่คลิกแล้วเปิด YouTube ในหน้าต่างใหม่
    // ============================================================
    const ytShortcode = parseYouTubeShortcode(line);
    const ytIframe =
      line.trim().toLowerCase().startsWith("<iframe")
        ? parseYouTubeIframe(line)
        : null;
    if (ytShortcode || ytIframe) {
      const videoId = (ytShortcode || ytIframe)!.videoId;
      result.push(
        <YouTubeThumb key={`yt-${i}`} videoId={videoId} title="วิดีโอ YouTube" />
      );
      i++;
      continue;
    }

    // ============================================================
    // ★ Gallery block — {% gallery %} ... {% endgallery %}
    //    ถ้ามีรูปมากกว่า 1 รูป ให้แสดงเป็นแกลเลอรีพร้อม lightbox
    // ============================================================
    if (line.trim() === "{% gallery %}") {
      const galleryImages: GalleryImage[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "{% endgallery %}") {
        const match = lines[i].match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          galleryImages.push({ src: match[2], alt: match[1] });
        }
        i++;
      }
      i++; // ข้าม {% endgallery %}

      if (galleryImages.length > 0) {
        // แสดงเป็นแกลเลอรี + lightbox (เฉพาะมากกว่า 1 รูป)
        result.push(
          <ImageGallery key={`gallery-${i}`} images={galleryImages} />
        );
      }
      continue;
    }

    // --- image block wrapper: <div class="image-center|left|right image-w-..."> ---
    //    รองรับภาพเดี่ยวที่ปรับขนาดได้ + caption กลาง (ใช้ Component เดียวกับ editor)
    if (isImageBlockOpen(line)) {
      const { align, width } = parseImageBlockOpen(line);
      // ไล่หาบรรทัดรูปภาพ `![alt](url)`
      let src = "";
      let alt = "";
      let cursor = i + 1;
      while (cursor < lines.length && lines[cursor].trim() !== "</div>" && lines[cursor].trim() !== "") {
        const mm = lines[cursor].match(/!\[(.*?)\]\((.*?)\)/);
        if (mm) {
          src = mm[2];
          alt = mm[1] || "";
          break;
        }
        cursor++;
      }
      // caption อาจอยู่ใน div (ถัดจาก img) หรืออยู่หลัง </div> (รองรับ format เก่า)
      let caption = "";
      let scan = cursor + 1;
      while (scan < lines.length) {
        const t = lines[scan].trim();
        if (t === "</div>") {
          scan++;
          continue;
        }
        if (/^\*[^*]+\*$/.test(t) && !t.startsWith("**")) {
          caption = t.slice(1, -1).trim();
        }
        break;
      }
      if (src) {
        result.push(
          <div key={`imgblock-${i}`}>
            {renderImageBlock({ src, alt, caption, align, width })}
          </div>
        );
      }
      // ข้ามไปจนเจอ </div>
      while (i < lines.length && lines[i].trim() !== "</div>") {
        i++;
      }
      i++; // ข้าม </div>
      // ข้าม caption ที่อยู่นอก div (ถ้ามี) เพื่อไม่ให้ render ซ้ำเป็นข้อความ
      if (i < lines.length) {
        const t = lines[i].trim();
        if (/^\*[^*]+\*$/.test(t) && !t.startsWith("**")) {
          i++;
        }
      }
      continue;
    }

    // --- image: ![alt](url) เป็นบรรทัดเดี่ยว ๆ ---
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      result.push(
        <img
          key={i}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          loading="lazy"
          className="block rounded-xl my-6 max-w-full h-auto mx-auto"
        />
      );
      i++;
      continue;
    }

    // --- image: <img ...> เป็นบรรทัดเดี่ยว ๆ ---
    if (/^<img\s[^>]*\/?\s*>$/.test(line.trim())) {
      const attrs = parseImgAttrs(line);
      result.push(
        <img
          key={i}
          src={attrs.src || ""}
          alt={attrs.alt || ""}
          loading="lazy"
          className="block rounded-xl my-6 max-w-full h-auto mx-auto"
        />
      );
      i++;
      continue;
    }

    // --- blockquote (บรรทัดที่ขึ้นต้นด้วย > หรือ <blockquote>) ---
    if (line.trimStart().startsWith(">") || line.trimStart().startsWith("<blockquote>")) {
      const quoteText = line
        .trimStart()
        .replace(/^>\s*/, "")
        .replace(/^<\/?blockquote>\s*/, "")
        .replace(/<\/?blockquote>/g, "");
      result.push(
        <blockquote
          key={i}
          className="border-l-4 border-amber-400/40 pl-4 py-2 my-4 text-white/70 italic bg-white/[0.02] rounded-r-lg"
        >
          {renderInlineMarkdown(quoteText)}
        </blockquote>
      );
      i++;
      continue;
    }

    // --- heading: ### **bold heading** (markdown-like) ---
    if (line.startsWith("### **")) {
      result.push(
        <h3 key={i} className="text-xl font-semibold text-white mt-8 mb-3">
          {line.replace(/^### \*\*/, "").replace(/\*\*$/, "")}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      result.push(
        <h2 key={i} className="text-2xl font-bold text-amber-200 mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      result.push(
        <h3 key={i} className="text-xl font-semibold text-white mt-8 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
      i++;
      continue;
    }
    // --- bold text on its own line (**text**) ---
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      result.push(
        <p key={i} className="text-white font-semibold mt-4 mb-2">
          {line.replace(/\*\*/g, "")}
        </p>
      );
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      result.push(
        <li key={i} className="text-white/80 ml-4 mb-1">
          {renderInlineMarkdown(line.replace("- ", ""))}
        </li>
      );
      i++;
      continue;
    }
    if (line.trim() === "") {
      result.push(<div key={i} className="h-3" />);
      i++;
      continue;
    }
    result.push(
      <p key={i} className="text-white/80 leading-relaxed mb-4">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return result;
}

/** Helper to render inline markdown formatting within a line */
function renderInlineMarkdown(text: string): React.ReactNode {
  // 1) เรียงลำดับให้ parse รูปภาพแบบ inline ก่อน (ทั้ง ![alt](url) และ <img ...>) —
  //    กันไม่ให้ URL ภายใน<img> ตีกับ link regex ด้านล่าง
  const imgRegex = /(!\[[^\]]*\]\([^)]+\)|<img\s[^>]*\/?\s*>)/g;
  const imgParts = text.split(imgRegex);

  if (imgParts.length > 1) {
    return imgParts.map((part, i) => {
      // Markdown image
      const mdImg = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (mdImg) {
        return (
          <img
            key={i}
            src={mdImg[2]}
            alt={mdImg[1]}
            loading="lazy"
            className="block rounded-xl my-2 max-w-full h-auto mx-auto"
          />
        );
      }
      // HTML <img>
      if (/^<img\s/.test(part)) {
        const attrs = parseImgAttrs(part);
        return (
          <img
            key={i}
            src={attrs.src || ""}
            alt={attrs.alt || ""}
            loading="lazy"
            className="block rounded-xl my-2 max-w-full h-auto mx-auto"
          />
        );
      }
      return renderLinksAndText(part);
    });
  }

  return renderLinksAndText(text);
}

/** แยก inline image ออก แล้ว render link + bold/italic ในส่วนที่เหลือ */
function renderLinksAndText(text: string): React.ReactNode {
  // 1) Handle Markdown link syntax: [text](url)
  //    (image syntax ![alt](url) ถูกกรองไปก่อนหน้าแล้วใน renderInlineMarkdown)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = mdLinkRegex.exec(text)) !== null) {
    // ข้อความก่อน [text](url) — autolink URL ตรง ๆ + bold/italic
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(
        <Fragment key={key++}>{renderAutoLinksAndBold(before)}</Fragment>
      );
    }

    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <ExternalLink key={key++} href={linkUrl}>
        {linkText}
      </ExternalLink>
    );
    lastIndex = match.index + match[0].length;
  }

  // ข้อความที่เหลือหลัง markdown link สุดท้าย
  const rest = text.slice(lastIndex);
  if (rest) {
    parts.push(<Fragment key={key++}>{renderAutoLinksAndBold(rest)}</Fragment>);
  }

  if (parts.length === 0) return text;
  return <>{parts}</>;
}

/**
 * autolink URL ที่พิมพ์ตรง ๆ (https://...) ให้เป็นลิงก์แสดงโดเมน
 * แล้ว render bold/italic ในข้อความที่เหลือ
 */
function renderAutoLinksAndBold(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s<"')]+)/g;
  const linkParts = text.split(urlRegex);
  
  if (linkParts.length > 1) {
    return (
      <>
        {linkParts.map((part, i) => {
          if (part.match(urlRegex)) {
            const domain = getDomainLabel(part);
            return (
              <ExternalLink key={i} href={part}>
                {domain}
              </ExternalLink>
            );
          }
          return renderBoldItalic(part);
        })}
      </>
    );
  }

  return renderBoldItalic(text);
}

/** Render bold (**text**), italic (*text*), and <br> line breaks inline */
function renderBoldItalic(text: string): React.ReactNode {
  // Match both **bold** and *italic* — bold first to prevent conflict
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="text-white/90 italic">{part.slice(1, -1)}</em>;
    }
    // <br> / <br/> / <br /> → line break
    if (/^(<br\s*\/?>)+$/i.test(part.trim())) {
      return <br key={`br-${i}`} />;
    }
    // <br> ที่แทรกอยู่กลางข้อความ → split เป็นบรรทัดย่อย
    if (part.includes("<br") && part.includes(">")) {
      const lineParts = part.split(/(<br\s*\/?>)/i);
      return lineParts.map((chunk, ci) => {
        if (/^<br\s*\/?>$/i.test(chunk.trim())) return <br key={`ln-${i}-${ci}`} />;
        return chunk;
      });
    }
    return part;
  });
}

// ============================================================
// Social Share Component
// ============================================================

function SocialShareButtons({ url, title, description }: { url: string; title: string; description: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

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
              title={copied ? "Copied!" : link.name}
            >
              <Icon size={14} />
              {copied && link.name === "Copy Link" && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap backdrop-blur-sm">
                  Copied!
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
// Article Detail
// ============================================================

export function ArticleDetail({ article, locale, localeUrl }: ArticleDetailProps) {
  const { adsenseId, adsenseSlotSidebar } = useSettings() || {};

  // ★ ระบบ JIT (Just-in-Time) content ถูกยกเลิกแล้ว
  //   - ทุกภาษา (tier 1 + tier 2) แปล content เต็มด้วยมือ (ปุ่ม "แปลอัตโนมัติ")
  //   - render content ตรงจาก `article.content` ที่ server ส่งให้ (แปลเสร็จแล้ว)
  //   - ไม่มีการเรียก /api/translate-content ตอนเปิดอ่านอีกแล้ว

  // Get related articles from Supabase (instead of local JSON)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedArticles() {
      try {
        const supabase = createClient();
        
        // Fetch published articles from Supabase, excluding current article
        const { data: articles } = await supabase
          .from("articles")
          .select(`
            id, slug, original_title, original_excerpt, tags,
            categories!inner(name_th, name_en),
            author_name, published_at, image_url, image_alt, featured
          `)
          .eq("status", "published")
          .is("microsite_id", null)
          .neq("slug", article.slug) // exclude current article
          .order("published_at", { ascending: false })
          .limit(10);

        if (!articles || articles.length === 0) {
          setRelatedArticles([]);
          setRelatedLoading(false);
          return;
        }

        // ★ Fallback 2 ชั้น สำหรับ locale ≠ th:
        //   ดึง translation ทุกภาษาที่เป็นไปได้ (ภาษาปัจจุบัน + en + th) พร้อมกัน
        //   แล้วเลือกตามลำดับความสำคัญ: ภาษาปัจจุบัน > en > th (ต้นฉบับ)
        //   เพื่อให้ related articles แสดงภาษาเดียวกับหน้าที่อ่านเสมอ
        const articleIds = (articles as any[]).map((a) => a.id);

        // ชุดภาษาที่จะดึง (dedupe ถ้า locale เป็น th/en ซ้ำกับที่รวมไว้)
        const localesToFetch = Array.from(new Set([locale, "en", "th"]));
        let translationsByArticle: Record<string, any> = {};

        if (locale !== "th") {
          const { data: translations } = await supabase
            .from("translations")
            .select("article_id, locale, title, excerpt, translation_status")
            .in("article_id", articleIds)
            .in("locale", localesToFetch);
          if (translations) {
            // จัดกลุ่ม per article_id + per locale
            const grouped: Record<string, Record<string, any>> = {};
            (translations as any[]).forEach((t) => {
              if (!grouped[t.article_id]) grouped[t.article_id] = {};
              grouped[t.article_id][t.locale] = t;
            });
            // เลือกตามลำดับความสำคัญ: ภาษาปัจจุบัน > en > th
            for (const [aid, byLocale] of Object.entries(grouped)) {
              const order = localesToFetch; // [current, en, th] (เรียงลำดับสำคัญ)
              for (const loc of order) {
                const t = byLocale[loc];
                // ใช้เมื่อมี title จริง (ถือว่ามี 'การแปล')
                if (t?.title) {
                  translationsByArticle[aid] = t;
                  break;
                }
              }
            }
          }
        }

        // Map to a simple structure for display
        const mapped = articles.slice(0, 4).map((a: any) => {
          const categoryName = locale === "th"
            ? a.categories?.name_th || ""
            : a.categories?.name_en || "";

          const trans = translationsByArticle[a.id];
          const title = locale === "th"
            ? a.original_title
            : (trans?.title || a.original_title);
          const excerpt = locale === "th"
            ? a.original_excerpt
            : (trans?.excerpt || a.original_excerpt);

          return {
            slug: a.slug,
            originalTitle: a.original_title,
            originalExcerpt: a.original_excerpt,
            title,      // ★ title ตาม locale (จาก fallback: current > en > th)
            excerpt,    // ★ excerpt ตาม locale
            category: categoryName,
            imageUrl: a.image_url || undefined,
            tags: a.tags || [],
          };
        });

        setRelatedArticles(mapped);
      } catch (err) {
        console.error("Failed to fetch related articles:", err);
        // Fallback: try to use local data if supabase fails
        try {
          const allMasters = getAllArticleMasters().filter(
            (m) => m.slug !== article.slug && (m.status === undefined || m.status === "published")
          );
          setRelatedArticles(allMasters.slice(0, 4));
        } catch {}
      }
      setRelatedLoading(false);
    }

    fetchRelatedArticles();
  }, [article.slug, locale]);

  if (!article) {
    if (typeof window !== "undefined") {
      return (
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-amber-300/60 mb-4">404</h1>
            <p className="text-white/60">Article not found</p>
            <Link href={`/${locale}/articles`} className="text-amber-300 hover:text-amber-200 mt-4 inline-block">
              &larr; {locale === "th" ? "กลับไปหน้าบทความ" : "Back to articles"}
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  // Build Wiki Metadata for this article
  const masterLike = {
    id: article.id,
    slug: article.slug,
    originalTitle: article.title,
    originalExcerpt: article.excerpt,
    originalContent: article.content,
    category: article.category,
    author: article.author,
    publishedAt: article.publishedAt,
    imageUrl: article.imageUrl,
    imageAlt: article.imageAlt,
    tags: article.tags,
  };
  const wikiData: WikiArticle = getWikiArticle(masterLike as any);

  // ================================================================
  // Custom Google Schema Markup (JSON-LD) — จาก DB article field
  // ================================================================
  const customSchemaLD = article.googleSchemaMarkup;

  return (
    <>
      <SchemaArticle
        article={masterLike}
        imageUrl={article.imageUrl}
        wikiMetadata={wikiData.metadata}
        localeUrl={localeUrl}
      />

      {/* Custom Schema Markup (จาก DB) — merge/override เพิ่มเติม */}
      {customSchemaLD && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              customSchemaLD["@context"]
                ? customSchemaLD  // ถ้ามี @context อยู่แล้ว ใช้ตรงๆ
                : { "@context": "https://schema.org", ...customSchemaLD },
              null,
              2
            ),
          }}
        />
      )}

      {/* WikiHeroSection — รวม hero image + abstract (semantic + AI Overview) */}
      <WikiHeroSection
        article={article}
        locale={locale}
        abstract={wikiData.abstract}
        master={masterLike}
      />

      {/* Social Share Bar — ใต้ title */}
      <div className="border-b border-white/10 bg-[#0a1628]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <span className="text-white/50 text-sm">
            {locale === "th" ? "แชร์บทความนี้" : "Share this article"}
          </span>
          <SocialShareButtons
            url={localeUrl || (typeof window !== 'undefined' ? window.location.href : `/${locale}/articles/${article.slug}`)}
            title={article.title}
            description={article.excerpt}
          />
        </div>
      </div>

      {/* ExcerptSection — Lead Paragraph + Social Caption */}
      {wikiData.excerpts && (
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ExcerptSection
              excerpts={wikiData.excerpts}
              locale={locale}
              fallbackShort={article.excerpt}
              fallbackLong={article.excerpt}
            />
          </div>
        </section>
      )}

      {/* Content + Sidebar Layout */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* ★ render content ตรง ๆ (แปลเสร็จแล้ว ไม่มี JIT/overlay) */}
              <div className="max-w-none">
                {renderContent(article.content)}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-white/40 text-xs">
                      {locale === "th" ? "เผยแพร่" : "Published"}: {new Date(article.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                    {/* Social Share Buttons */}
                    <SocialShareButtons
                      url={localeUrl || (typeof window !== 'undefined' ? window.location.href : `/${locale}/articles/${article.slug}`)}
                      title={article.title}
                      description={article.excerpt}
                    />
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {article.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/${locale}/tags/${encodeURIComponent(tag.toLowerCase())}`}
                          className="text-xs text-white/40 hover:text-amber-300 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* QuickFactsBox — REMOVED per request */}

                {/* Category */}
                <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <ChevronRight size={14} className="text-amber-300" />
                    {locale === "th" ? "หมวดหมู่" : "Category"}
                  </h3>
                  <Link
                    href={`/${locale}/categories/${encodeURIComponent(article.category)}`}
                    className="block text-sm text-amber-300/80 hover:text-amber-200 transition-colors"
                  >
                    {article.category}
                  </Link>
                </div>

                {/* Related Articles in Sidebar */}
                <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5">
                  <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <ChevronRight size={14} className="text-amber-300" />
                    {locale === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}
                  </h3>
                  <div className="space-y-3">
                    {relatedArticles.slice(0, 3).map((rel: any) => (
                      <Link
                        key={rel.slug}
                        href={`/${locale}/articles/${rel.slug}`}
                        className="group flex gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {rel.imageUrl && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={rel.imageUrl}
                              alt={rel.title || rel.originalTitle}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs font-medium leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                            {rel.title || rel.originalTitle}
                          </p>
                          <p className="text-white/30 text-[10px] mt-1">{rel.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {relatedArticles.length > 3 && (
                    <Link
                      href={`/${locale}/articles?category=${encodeURIComponent(article.category)}`}
                      className="block text-center text-xs text-amber-400/70 hover:text-amber-300 mt-3 pt-3 border-t border-white/5 transition-colors"
                    >
                      {locale === "th" ? "ดูทั้งหมด" : "View all"}
                    </Link>
                  )}
                </div>

                {/* Ad Unit —  sidebar */}
                <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5">
                  <h3 className="text-white/40 text-xs font-medium mb-3">
                    {locale === "th" ? "โฆษณา" : "Advertisement"}
                  </h3>
                  <AdUnit adsenseId={adsenseId} slot={adsenseSlotSidebar || "0000000000"} format="rectangle" />
                  <p className="text-white/15 text-[10px] text-center mt-3">
                    {locale === "th" ? "โฆษณา — ช่วยสนับสนุนเว็บไซต์ของเรา" : "Ad — Support our website"}
                  </p>
                </div>

                {/* GlossarySection — moved after Advertisement */}
                {wikiData.glossary.some(e => e.definition && e.definition.length > 0) && (
                  <GlossarySection
                    entries={wikiData.glossary}
                    locale={locale}
                    collapsedCount={4}
                  />
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Articles Section (bottom) */}
      {relatedArticles.length > 0 && (
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-white/10 pt-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {locale === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}
                </h2>
                <Link
                  href={`/${locale}/articles`}
                  className="text-sm text-amber-400/70 hover:text-amber-300 transition-colors"
                >
                  {locale === "th" ? "ดูทั้งหมด" : "View all"} &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedArticles.map((rel: any) => (
                  <Link
                    key={rel.slug}
                    href={`/${locale}/articles/${rel.slug}`}
                    className="group rounded-xl overflow-hidden bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 hover:border-amber-300/30 transition-all"
                  >
                    {rel.imageUrl && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={rel.imageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">{rel.category}</p>
                      <h3 className="text-white font-medium text-sm leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                        {rel.title || rel.originalTitle}
                      </h3>
                      <p className="text-white/40 text-xs mt-2 line-clamp-2">
                        {rel.excerpt || rel.originalExcerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
