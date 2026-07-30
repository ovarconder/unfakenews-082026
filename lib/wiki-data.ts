// ============================================================
// Siam Heritage - Wiki-Style Data Helpers
// ============================================================
// ฟังก์ชันสำหรับสร้างและจัดการ Wiki Metadata
// ใช้เพื่อเพิ่ม Quick Facts, Glossary, Abstract, Entity Facts,
// Excerpt Strategy ให้กับบทความ
// ============================================================

import type { ArticleMaster } from "./types";
import type {
  QuickFact,
  EntityQuickFacts,
  ExcerptStrategy,
  GlossaryEntry,
  WikiSection,
  ArticleAbstract,
  WikiMetadata,
  WikiArticle,
} from "./wiki-types";

// ============================================================
// Entity Facts Registry — ฐานข้อมูลกลางของ Entity Quick Facts
// เก็บ entity facts ตาม slug ของบทความ
// สามารถเพิ่มข้อมูลจากหน้าจัดการ Entity Name ได้
// ============================================================
export const entityFactsRegistry = new Map<string, EntityQuickFacts>();

export function registerEntityFacts(slug: string, facts: EntityQuickFacts): void {
  entityFactsRegistry.set(slug, facts);
}

export function getRegisteredEntityFacts(slug: string): EntityQuickFacts | undefined {
  return entityFactsRegistry.get(slug);
}

export function removeRegisteredEntityFacts(slug: string): boolean {
  return entityFactsRegistry.delete(slug);
}

// ============================================================
// Excerpt Strategy Registry — ฐานข้อมูลของ Excerpt Strategy
// ============================================================
export const excerptRegistry = new Map<string, ExcerptStrategy>();

export function registerExcerpt(slug: string, excerpt: ExcerptStrategy): void {
  excerptRegistry.set(slug, excerpt);
}

export function getRegisteredExcerpt(slug: string): ExcerptStrategy | undefined {
  return excerptRegistry.get(slug);
}

// ============================================================
// Wiki Metadata Builder
// ============================================================

/**
 * สร้าง WikiMetadata สำหรับ ArticleMaster
 * 1. ใช้ข้อมูลจาก ArticleMaster โดยตรง (entityName, quickFacts, glossary ฯลฯ)
 * 2. Fallback ไป registry (EntityFactsManager/ExcerptRegistry)
 * 3. Fallback ไป auto-detect จาก content
 */
export function buildWikiMetadata(master: ArticleMaster): WikiMetadata {
  const sections = extractSections(master.originalContent);

  // === Entity Facts: ใช้จาก master ก่อน (ที่ admin บันทึกไว้), fallback registry ===
  const registryEntityFacts = getRegisteredEntityFacts(master.slug);
  const entityFacts: EntityQuickFacts | undefined = master.entityName
    ? {
        entityName: master.entityName,
        entityNameEn: master.entityNameEn,
        entityType: master.entityType || "other",
        wikidataId: master.wikidataId,
        imageUrl: master.imageUrl,
        imageAlt: master.imageAlt,
        facts: (master.quickFacts || []).map(qf => ({
          label: qf.label,
          value: qf.value,
          labelEn: qf.labelEn,
        })),
      }
    : registryEntityFacts;

  // Extract image alt texts from content for translation
  const contentImageAlts = extractImageAltsFromContentFn(master.originalContent);

  // === Excerpt Strategy: ใช้จาก master ก่อน, fallback registry ===
  const registryExcerpts = getRegisteredExcerpt(master.slug);
  const excerpts: ExcerptStrategy | undefined = master.shortExcerpt || master.longExcerpt
    ? {
        shortExcerpt: master.shortExcerpt || master.originalExcerpt,
        longExcerpt: master.longExcerpt || buildFullAbstract(master),
        seoTitle: master.shortExcerpt ? undefined : undefined,
        seoDescription: master.shortExcerpt || undefined,
        socialCaption: master.socialCaption || undefined,
      }
    : registryExcerpts;

  // === Glossary: ใช้จาก master ก่อน, fallback auto-detect ===
  const glossary: GlossaryEntry[] = master.glossary && master.glossary.length > 0
    ? master.glossary.map(g => ({
        term: g.term,
        termEn: g.termEn,
        definition: g.definition,
        definitionEn: g.definitionEn,
      }))
    : extractGlossary(master.originalContent, master.tags);

  return {
    abstract: {
      short: excerpts?.shortExcerpt || master.originalExcerpt,
      full: excerpts?.longExcerpt || buildFullAbstract(master),
    },
    quickFacts: buildQuickFacts(master, entityFacts),
    entityFacts,
    excerpts,
    glossary,
    sections,
    subcategories: master.tags ? [master.category, ...master.tags] : [master.category],
  };
}

/**
 * สร้าง Quick Facts จากข้อมูล ArticleMaster + Entity Facts (ถ้ามี)
 * Entity Facts จะถูกแทรกไว้ด้านบนของ Quick Facts ปกติ
 */
function buildQuickFacts(master: ArticleMaster, entityFacts?: EntityQuickFacts): QuickFact[] {
  const facts: QuickFact[] = [];

  // ถ้ามี Entity Facts — ใช้ entity facts เป็นหลัก
  if (entityFacts && entityFacts.facts.length > 0) {
    facts.push(...entityFacts.facts);
  }

  // ถ้ายังไม่มี entity facts — ใช้ข้อมูลพื้นฐานจาก ArticleMaster
  if (facts.length === 0) {
    facts.push({
      label: "หมวดหมู่",
      value: master.category,
      labelEn: "Category",
    });
    facts.push({
      label: "ผู้เขียน",
      value: master.author,
      labelEn: "Author",
    });
    facts.push({
      label: "เผยแพร่",
      value: formatThaiDate(master.publishedAt),
      labelEn: "Published",
    });
  }

  return facts;
}

/**
 * สร้าง full abstract (3-5 ประโยค) จาก content
 * ถ้ามี longExcerpt จะใช้ก่อน แล้วค่อย fallback
 */
function buildFullAbstract(master: ArticleMaster, longExcerpt?: string): string {
  if (longExcerpt) return longExcerpt;

  const content = master.originalContent;
  
  // Extract first 3 non-empty paragraphs
  const paragraphs = content
    .split("\n")
    .map(p => p.trim())
    .filter(p => p.length > 40 && !p.startsWith("##") && !p.startsWith("###") && !p.startsWith("-") && !p.startsWith("**"))
    .slice(0, 3);

  if (paragraphs.length >= 2) {
    return paragraphs.slice(0, 2).join(" ");
  }

  // Fallback to excerpt if content is too short
  return master.originalExcerpt;
}

/**
 * Extract sections from markdown content
 */
function extractSections(content: string): WikiSection[] {
  const sections: WikiSection[] = [];
  const lines = content.split("\n");
  let currentSection: WikiSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith("## ")) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: slugify(line.replace("## ", "")),
        title: line.replace("## ", ""),
        level: 2,
        content: "",
      };
    } else if (line.startsWith("### ")) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: slugify(line.replace("### ", "")),
        title: line.replace("### ", ""),
        level: 3,
        content: "",
      };
    } else if (currentSection) {
      currentSection.content += line + "\n";
    }
  }

  if (currentSection) sections.push(currentSection);
  return sections;
}

/**
 * Extract glossary terms from content + tags
 * Extends tags with auto-detected specialized terms
 */
function extractGlossary(content: string, tags?: string[]): GlossaryEntry[] {
  const glossary: GlossaryEntry[] = [];

  // Auto-detect glossary patterns from content
  // เช่น "..." หรือ "หรือที่เรียกว่า"
  const lines = content.split("\n");
  for (const line of lines) {
    // Pattern: "XXX (หรือ YYY)" 
    const parentheticalMatch = line.match(/["""]?([^""""]+?)["""]\s*\(หรือ\s*([^)]+)\)/);
    if (parentheticalMatch) {
      glossary.push({
        term: parentheticalMatch[1].trim(),
        definition: `หรือ "${parentheticalMatch[2].trim()}"`,
      });
    }

    // Pattern: "XXX คือ..."
    const definitionMatch = line.match(/^([^""""]+?)\s*(?:คือ|หมายถึง|หมายถึง)\s+(.+)/);
    if (definitionMatch) {
      glossary.push({
        term: definitionMatch[1].trim(),
        definition: definitionMatch[2].trim().substring(0, 100),
      });
    }
  }

  // Add tags as glossary entries (deduplicated)
  if (tags) {
    for (const tag of tags) {
      // In real scenarios, tag definitions would come from a database
      // For now, we use the tag slug as the term
      if (!glossary.some(g => g.term === tag)) {
        glossary.push({
          term: tag.replace(/-/g, " "),
          definition: "",
          slug: `/th/tags/${tag}`,
        });
      }
    }
  }

  return glossary;
}

/**
 * Extract all image alt texts from markdown content
 */
function extractImageAltsFromContentFn(content: string): Record<string, string> {
  const alts: Record<string, string> = {};
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(content)) !== null) {
    const alt = match[1].trim();
    const url = match[2].trim();
    if (alt && url) {
      alts[url] = alt;
    }
  }
  return alts;
}

/**
 * Format date in Thai style
 */
function formatThaiDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Simple slugify for anchor IDs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Get wiki article data (synchronous helper for components)
 */
export function getWikiArticle(master: ArticleMaster): WikiArticle {
  const metadata = buildWikiMetadata(master);
  
  return {
    slug: master.slug,
    title: master.originalTitle,
    abstract: metadata.abstract,
    quickFacts: metadata.quickFacts,
    entityFacts: metadata.entityFacts,
    excerpts: metadata.excerpts,
    glossary: metadata.glossary,
    sections: metadata.sections,
    metadata,
  };
}
