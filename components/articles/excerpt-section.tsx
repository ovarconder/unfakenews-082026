// ============================================================
// ExcerptSection — Lead Paragraph + Social Caption
// ============================================================
// แสดง long_excerpt เป็นบทเกริ่นนำ (Lead Paragraph Style)
// พร้อมปุ่ม "Copy for Social Caption" สำหรับทีมงาน
// ============================================================

"use client";

import { useState } from "react";
import { Copy, Check, Quote } from "lucide-react";
import type { ExcerptStrategy } from "@/lib/wiki-types";
import type { Locale } from "@/lib/locales";

interface ExcerptSectionProps {
  excerpts: ExcerptStrategy;
  locale: Locale;
  fallbackShort?: string;
  fallbackLong?: string;
}

export default function ExcerptSection({
  excerpts,
  locale,
  fallbackShort,
  fallbackLong,
}: ExcerptSectionProps) {
  const [copied, setCopied] = useState(false);

  const shortExcerpt = excerpts.shortExcerpt || fallbackShort || "";
  const longExcerpt = excerpts.longExcerpt || fallbackLong || shortExcerpt;
  const socialCaption = excerpts.socialCaption || longExcerpt;
  const seoTitle = excerpts.seoTitle;
  const seoDescription = excerpts.seoDescription || shortExcerpt;

  const handleCopySocial = async () => {
    try {
      const textToCopy = `${seoTitle || ""}\n\n${socialCaption}\n\n🏛️ สยามเฮอริเทจ`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = socialCaption;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      className="relative"
      data-wiki="excerpt"
      itemScope
      itemType="https://schema.org/Article"
    >
      {/* Lead Paragraph — long excerpt */}
      {longExcerpt && (
        <div className="relative pl-4 sm:pl-6 border-l-2 border-amber-400/30">
          <Quote
            size={16}
            className="absolute -left-2 -top-1 text-amber-400/20"
            aria-hidden="true"
          />
          <p
            className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed font-thai italic"
            data-wiki="long-excerpt"
            itemProp="description"
          >
            {longExcerpt}
          </p>
        </div>
      )}

      {/* Metadata row: SEO + Social Caption */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/30">
          {/* SEO Title */}
          {seoTitle && (
            <span
              className="hidden"
              data-wiki="seo-title"
              itemProp="headline"
            >
              {seoTitle}
            </span>
          )}
          {/* Short excerpt */}
          <span className="text-white/20 text-[10px]">
            <span className="text-white/30">Short:</span>{" "}
            {shortExcerpt.substring(0, 60)}...
          </span>
        </div>

        {/* Copy for Social Caption Button */}
        <button
          onClick={handleCopySocial}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-400/10 text-white/40 hover:text-amber-300 text-[10px] transition-colors border border-white/5 hover:border-amber-400/20 group relative"
          title="Copy text for social post"
        >
          {copied ? (
            <>
              <Check size={10} className="text-green-400" />
              <span className="text-green-400">
                "Copied!"
              </span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>
                "Copy for Social"
              </span>
            </>
          )}
        </button>
      </div>

      {/* Hidden SEO metadata */}
      <div className="hidden" data-wiki="seo-description" itemProp="abstract">
        {seoDescription}
      </div>
    </section>
  );
}
