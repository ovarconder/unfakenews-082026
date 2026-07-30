import type { Locale } from "./locales";

// ============================================================
// Core Types for Siam Heritage
// ============================================================
// สถานะการแปลของบทความในแต่ละภาษา
export type TranslationStatus = "complete" | "summary_only" | "pending";

// ============================================================
// Article Master — ต้นฉบับ (ภาษาไทย)
// ============================================================
export interface QuickFactEntry {
  label: string;
  labelEn?: string;
  value: string;
}

export interface GlossaryEntry {
  term: string;
  termEn?: string;
  definition: string;
  definitionEn?: string;
}

export interface ArticleMaster {
  id: string;
  slug: string;
  // ต้นฉบับภาษาไทย
  originalTitle: string;
  originalExcerpt: string;
  originalContent: string;
  category: string;
  author: string;
  authorId?: string;
  publishedAt: string;
  imageUrl?: string;
  imageAlt?: string;
  /** 
   * ที่มาของรูปภาพ (Credit) 
   * เช่น "วัดพระศรีรัตนศาสดาราม", "หอจดหมายเหตุแห่งชาติ", "สมบัติส่วนตัว"
   */
  imageCredit?: string;
  /**
   * ผู้ถ่าย/เจ้าของภาพ (ถ้ามี)
   * เช่น "ช่างภาพรอยพระพุทธบาท", "Department of Fine Arts"
   */
  imagePhotographer?: string;
  /**
   * Original Source URL — ลิงก์ไปแหล่งต้นฉบับของภาพ
   * ใช้เพื่อ SEO และป้องกันการ claim ว่าเป็นของคนอื่น
   */
  imageSourceUrl?: string;
  /**
   * ปีที่ถ่าย/สร้างภาพ หรือช่วงเวลา
   */
  imageYear?: string;
  featured?: boolean;
  tags?: string[];
  showAuthor?: boolean;
  status?: "draft" | "pending_review" | "published" | "hidden" | "deleted";

  // ============================================================
  // Wiki-Style Metadata (for Entity / Encyclopedia content)
  // ============================================================

  /** Entity name (for EntityQuickFacts) — e.g. "โขนไทย" */
  entityName?: string;
  entityNameEn?: string;

  /** Entity type */
  entityType?: "person" | "place" | "tradition" | "object" | "event" | "concept" | "other";

  /** Wikidata Q-ID */
  wikidataId?: string;

  /** Quick Facts — key-value pairs for sidebar */
  quickFacts?: QuickFactEntry[];

  /** Glossary — terms with definitions */
  glossary?: GlossaryEntry[];

  /** shortExcerpt: ≤150 chars — for card / meta */
  shortExcerpt?: string;

  /** longExcerpt: 250-400 chars — lead paragraph */
  longExcerpt?: string;

  /** Social caption for copy-to-clipboard */
  socialCaption?: string;

  /** Google Schema Markup — JSON-LD structured data สำหรับ SEO
   *  เก็บเป็น stringified JSON object หรือ JSON object
   *  จะถูกพ่นลงใน <script type="application/ld+json"> ในหน้า article
   */
  googleSchemaMarkup?: Record<string, unknown> | null;
}

// ============================================================
// เนื้อหาที่แปลแล้ว (เวอร์ชันใหม่ — รองรับทุก字段)
// ============================================================
export interface TranslatedArticle {
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  // metadata
  translatedAt: string; // ISO date
  translationStatus: TranslationStatus;
  /**
   * isFullTranslated:
   * - true for Tier 1 languages (full content translated on publish)
   * - false for Tier 2 languages after initial summary translation
   * - true for Tier 2 languages after JIT full content translation
   */
  isFullTranslated?: boolean;

  // ============================================================
  // NEW: Translation Strategy v2 Fields
  // ============================================================

  /** shortExcerpt: ≤150 chars, used in card thumbnails + og:description */
  shortExcerpt?: string;

  /** longExcerpt: 250-400 chars, lead paragraph + social caption */
  longExcerpt?: string;

  /** Quick Facts (localized) — Array of key-value pairs */
  quickFacts?: TranslatedQuickFact[];

  /** Image alt texts (localized) — key = image URL or identifier */
  imageAltTexts?: Record<string, string>;

  /** Keywords/tags (localized) */
  localizedKeywords?: string[];

  /** Entity Name (localized — only for articles with EntityQuickFacts) */
  entityName?: string;

  /** Social caption override for this locale */
  socialCaption?: string;

  /** AI model used for this translation */
  translationModel?: "gemini-flash" | "gemini-pro";

  /** Number of API calls consumed for this translation */
  apiCallCount?: number;
}

// ============================================================
// Localized Quick Fact
// ============================================================
export interface TranslatedQuickFact {
  label: string;    // localized label (e.g., "UNESCO Registration Year")
  value: string;    // localized value (e.g., "2018 CE" — with cultural localization)
}

// ============================================================
// Translation Strategy Config
// ============================================================
export interface TranslationStrategyConfig {
  /** Target locale */
  locale: Locale;

  /** Tier level */
  tier: 0 | 1 | 2;

  /** What to translate in this batch */
  scope: "full" | "summary" | "content_only";

  /** Whether to force full re-translate */
  forceFull?: boolean;

  /** Whether content is being translated JIT (user waiting) */
  isJIT?: boolean;

  /** Include quick facts in this batch */
  includeQuickFacts?: boolean;

  /** Include image alt texts in this batch */
  includeImageAlts?: boolean;

  /** Include entity name translation */
  includeEntityName?: boolean;
}

// ============================================================
// Translation Task — ใช้ใน Queue / Admin UI
// ============================================================
export interface TranslationTask {
  id: string;
  articleSlug: string;
  articleTitle: string;
  targetLocale: Locale;
  tier: 0 | 1 | 2;
  scope: "full" | "summary" | "content_only";
  status: "queued" | "in_progress" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
  apiCallsUsed?: number;
  estimatedCost?: number;
}
