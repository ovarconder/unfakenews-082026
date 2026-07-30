// ============================================================
// QuickFactsBox — กล่องข้อมูลสำคัญแบบ Wikipedia Sidebar
// ============================================================
// - แสดง Key-Value Pair เช่น ยุคสมัย, แหล่งกำเนิด
// - Responsive: desktop = sidebar, mobile = card บนเนื้อหา
// - AI Extractor สามารถดึงข้อมูลแบบ structured ได้ง่าย
//   (ใช้ data attributes + schema.org markup)
// ============================================================

"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Bookmark } from "lucide-react";
import type { QuickFact } from "@/lib/wiki-types";
import type { Locale } from "@/lib/locales";

interface QuickFactsBoxProps {
  facts: QuickFact[];
  locale: Locale;
  title?: string;
  /** จำนวนแถวที่แสดงก่อนตัด (ถ้าเกิน จะมี toggle) */
  collapsedRows?: number;
}

export default function QuickFactsBox({
  facts,
  locale,
  title,
  collapsedRows = 8,
}: QuickFactsBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const hasManyFacts = facts.length > collapsedRows;
  const displayFacts = hasManyFacts && !expanded ? facts.slice(0, collapsedRows) : facts;

  if (!facts || facts.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{
        backgroundColor: "rgba(15, 31, 58, 0.6)",
        backdropFilter: "blur(8px)",
      }}
      aria-label="Quick facts"
      itemScope
      itemType="https://schema.org/Table"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
        <Info size={14} className="text-amber-400" />
        <h3 className="text-white font-semibold text-sm">
          {title || ("Quick Facts")}
        </h3>
      </div>

      {/* Facts List — แบบ Key-Value ที่ AI อ่านง่าย */}
      <dl
        className="divide-y divide-white/5"
        data-wiki="quick-facts"
        role="list"
      >
        {displayFacts.map((fact, index) => (
          <div
            key={index}
            className="px-4 py-2.5 flex items-start gap-3 transition-colors hover:bg-white/[0.02]"
            data-wiki-fact-label={fact.label}
            data-wiki-fact-value={fact.value}
            itemProp="about"
            itemScope
            itemType="https://schema.org/PropertyValue"
          >
            <dt
              className="text-white/40 text-xs font-medium flex-shrink-0 min-w-[90px]"
              itemProp="name"
            >
              {fact.label}
            </dt>
            <dd
              className="text-white/80 text-sm flex-1"
              itemProp="value"
            >
              {fact.value}
              {/* English label for AI */}
              {fact.labelEn && (
                <span className="sr-only">({fact.labelEn})</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* Toggle button for many facts */}
      {hasManyFacts && (
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
              {`Show all ${facts.length} items`}
            </>
          )}
        </button>
      )}

      {/* Structured data hint for AI */}
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5">
        <p className="text-white/20 text-[9px] flex items-center gap-1">
          <Bookmark size={8} />
          "Structured data — suitable for AI / Knowledge Graph"
        </p>
      </div>
    </section>
  );
}
