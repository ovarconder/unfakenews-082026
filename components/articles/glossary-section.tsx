// ============================================================
// GlossarySection — คำศัพท์เฉพาะทางประจำบทความ
// ============================================================
// - ต่างจาก tags ตรงที่เป็นคำศัพท์ที่ต้องการคำอธิบายเฉพาะ
// - แต่ละคำสามารถคลิกไปเปิดหน้า glossary เฉพาะได้
// - AI Extractor สามารถดึงข้อมูล term-definition pairs ได้
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import type { GlossaryEntry } from "@/lib/wiki-types";
import type { Locale } from "@/lib/locales";

interface GlossarySectionProps {
  entries: GlossaryEntry[];
  locale: Locale;
  title?: string;
  /** จำนวนคำที่แสดงก่อนตัด */
  collapsedCount?: number;
}

export default function GlossarySection({
  entries,
  locale,
  title,
  collapsedCount = 5,
}: GlossarySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out entries without definitions (auto-detected tags)
  const validEntries = entries.filter(e => e.definition && e.definition.length > 0);
  // Add auto-detected terms that have no definitions as "quick terms"
  const quickTerms = entries.filter(e => !e.definition || e.definition.length === 0);

  const filteredEntries = validEntries.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.term.toLowerCase().includes(q) ||
      (e.termEn && e.termEn.toLowerCase().includes(q)) ||
      e.definition.toLowerCase().includes(q)
    );
  });

  const hasGlossary = validEntries.length > 0;
  const hasQuickTerms = quickTerms.length > 0;

  // แสดงเฉพาะเมื่อมีคำศัพท์ที่มีคำอธิบายจริงๆ (ไม่รวม auto-detected tags)
  if (!hasGlossary) return null;

  const displayEntries = expanded
    ? filteredEntries
    : filteredEntries.slice(0, collapsedCount);

  return (
    <section
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{
        backgroundColor: "rgba(15, 31, 58, 0.4)",
      }}
      aria-label="Glossary"
      data-wiki="glossary"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
        <BookOpen size={14} className="text-amber-400" />
        <h3 className="text-white font-semibold text-sm">
          {title || ("Glossary")}
        </h3>
        {validEntries.length > 0 && (
          <span className="ml-auto text-white/30 text-[10px]">
            {validEntries.length} "terms"
          </span>
        )}
      </div>

      {/* Search (only if enough entries) */}
      {validEntries.length > 3 && (
        <div className="px-4 py-2 border-b border-white/5">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms..."
              className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Glossary list */}
      {hasGlossary && (
        <dl
          className="divide-y divide-white/5"
          data-wiki="glossary-list"
          itemScope
          itemType="https://schema.org/ItemList"
        >
          {displayEntries.map((entry, index) => (
            <div
              key={index}
              className="px-4 py-3 transition-colors hover:bg-white/[0.02]"
              data-wiki-glossary-term={entry.term}
              data-wiki-glossary-definition={entry.definition}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/DefinedTerm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Term */}
                  <dt
                    className="text-white font-medium text-sm mb-0.5"
                    itemProp="name"
                  >
                    {entry.term}
                    {entry.termEn && (
                      <span className="text-white/30 text-xs font-normal ml-1.5">
                        ({entry.termEn})
                      </span>
                    )}
                  </dt>

                  {/* Definition */}
                  <dd
                    className="text-white/50 text-xs leading-relaxed"
                    itemProp="description"
                  >
                    {entry.definition}
                  </dd>

                  {/* See also */}
                  {entry.seeAlso && entry.seeAlso.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-white/20 text-[9px]">
                        "See also:"
                      </span>
                      {entry.seeAlso.map((ref, ri) => (
                        <span
                          key={ri}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/5 text-amber-400/60"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Link to specific glossary page (if available) */}
                {entry.slug && (
                  <Link
                    href={entry.slug}
                    className="flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors text-white/20 hover:text-amber-300"
                    title={`Learn more about "${entry.term}"`}
                  >
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </dl>
      )}

      {/* Toggle (show more/less) */}
      {filteredEntries.length > collapsedCount && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-amber-400/70 hover:text-amber-300 hover:bg-white/5 transition-colors border-t border-white/5"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} />
              "Show less"
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              {`Show all ${filteredEntries.length} terms`}
            </>
          )}
        </button>
      )}

      {/* Quick terms (auto-detected tags without definitions) */}
      {hasQuickTerms && !searchQuery && (
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-white/30 text-[10px] mb-2">
            "Related terms:"
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickTerms.map((term, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-amber-300 transition-colors cursor-default"
              >
                {term.term}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
