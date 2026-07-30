// ============================================================
// Siam Heritage - Wiki-Style Types
// ============================================================
// Type extensions สำหรับการแสดงผลแบบสารานุกรม (Wiki-Style)
// รองรับ Quick Facts, Glossary, Abstract, Structured Data,
// Entity Knowledge, Excerpt Strategy
// ============================================================

// ============================================================
// Quick Facts — กล่องข้อมูลสำคัญด้านขวาแบบ Wikipedia
// แต่ละรายการเป็น Key-Value Pair ที่ AI Extractor จะดึงไปใช้ได้
// ============================================================
export interface QuickFact {
  label: string;       // ชื่อฟิลด์ เช่น "ยุคสมัย", "ที่ตั้ง", "สกุลเงิน"
  value: string;       // ค่า เช่น "กรุงรัตนโกสินทร์", "กรุงเทพฯ", "บาท"
  localeKey?: string;  // ถ้าต้องการให้ label เป็นสากลในหลายภาษา
  labelEn?: string;    // English label สำหรับ JSON-LD / AI
}

// ============================================================
// Entity Quick Fact — ข้อมูลเอนทิตีที่มีโครงสร้างเฉพาะ
// เช่น โขนไทย, วัดพระแก้ว, ประเพณีสงกรานต์
// ============================================================
export interface EntityQuickFacts {
  /** ชื่อเอนทิตีหลัก (Entity Name / Title) */
  entityName: string;
  /** 
   * @deprecated ไม่ต้องใช้แล้ว — Gemini แปล entityName เป็น EN โดยอัตโนมัติ 
   * ผ่าน system prompt ใน translate-new และ translate-all
   */
  entityNameEn?: string;

  /** Quick facts list เฉพาะของเอนทิตีนี้ */
  facts: QuickFact[];

  /** 
   * Entity type:
   * - "person" (บุคคลสำคัญ)
   * - "place" (สถานที่)
   * - "tradition" (ประเพณี/วัฒนธรรม)
   * - "object" (วัตถุ/ศิลปวัตถุ)
   * - "event" (เหตุการณ์)
   * - "concept" (แนวคิด/ความเชื่อ)
   * - "other"
   */
  entityType: "person" | "place" | "tradition" | "object" | "event" | "concept" | "other";

  /** Image URL สำหรับเอนทิตี (optional) */
  imageUrl?: string;
  imageAlt?: string;

  /** Wikidata Q-ID (optional — สำหรับ Knowledge Graph) */
  wikidataId?: string;
}

// ============================================================
// Excerpt Strategy — รูปแบบการสรุปเนื้อหาบทความ
// ============================================================
export interface ExcerptStrategy {
  /** 
   * short_excerpt:
   * - ความยาว: ไม่เกิน 120-150 ตัวอักษร
   * - ใช้ใน: Card List Thumbnail, og:description, Meta Tags
   */
  shortExcerpt: string;

  /**
   * long_excerpt:
   * - ความยาว: 250-400 ตัวอักษร (ประมาณ 1 ย่อหน้าสั้น)
   * - ใช้ใน: Lead Paragraph ด้านบนบทความ, Social Caption
   */
  longExcerpt: string;

  /**
   * SEO Title (optional — ถ้าไม่ระบุจะใช้ article title)
   */
  seoTitle?: string;

  /**
   * SEO Description (optional — ถ้าไม่ระบุจะใช้ shortExcerpt)
   */
  seoDescription?: string;

  /**
   * Social media caption (optional — สำหรับ Copy to clipboard)
   * ถ้าไม่ระบุ จะ auto-generate จาก longExcerpt
   */
  socialCaption?: string;
}

// ============================================================
// Glossary Entry — คำศัพท์เฉพาะทางประจำบทความ
// ต่างจาก tags ตรงที่เป็นคำศัพท์ที่ต้องการคำอธิบายเฉพาะ
// ============================================================
export interface GlossaryEntry {
  term: string;           // คำศัพท์ เช่น "ลายกนก"
  termEn?: string;        // คำศัพท์ภาษาอังกฤษ
  definition: string;     // คำอธิบายสั้นๆ
  definitionEn?: string;  // คำอธิบายภาษาอังกฤษ
  slug?: string;          // ลิงก์ไปหน้าเฉพาะ (optional)
  seeAlso?: string[];     // คำศัพท์ที่เกี่ยวข้อง
}

// ============================================================
// Wiki Section — ส่วนประกอบของเนื้อหาแบบ Wiki
// ============================================================
export interface WikiSection {
  id: string;           // anchor id
  title: string;        // ชื่อหัวข้อ
  titleEn?: string;     // English title
  level: 1 | 2 | 3;    // ระดับหัวข้อ
  content: string;      // เนื้อหาส่วนนี้ (raw markdown/text)
}

// ============================================================
// Article Abstract — บทสรุปย่อ (สำหรับ AI Overview / Featured Snippet)
// ห่อด้วย semantic tag <article> หรือ <section> พร้อม data attributes
// ============================================================
export interface ArticleAbstract {
  /** ข้อความสรุปสั้น (1-2 ประโยค) — สำหรับ AI Overview snippet */
  short: string;
  /** ข้อความสรุปแบบเต็ม (3-5 ประโยค) — สำหรับ knowledge panel */
  full: string;
  /** ภาษาของ abstract */
  locale?: string;
}

// ============================================================
// Wiki Metadata — ข้อมูล Structured Metadata สำหรับบทความ
// ใช้สำหรับ generate JSON-LD Schema + AI extraction
// ============================================================
export interface WikiMetadata {
  /** บทสรุปย่อของบทความ */
  abstract: ArticleAbstract;
  
  /** กล่องข้อมูลสำคัญ (Quick Facts) */
  quickFacts: QuickFact[];
  
  /** ข้อมูลเอนทิตีแบบมีโครงสร้าง (Entity Quick Facts) */
  entityFacts?: EntityQuickFacts;

  /** รูปแบบการสรุปเนื้อหา (Excerpt Strategy) */
  excerpts?: ExcerptStrategy;

  /** คำศัพท์เฉพาะทางประจำบทความ */
  glossary: GlossaryEntry[];
  
  /** โครงสร้างหัวข้อ (Table of Contents) */
  sections: WikiSection[];
  
  /** หมวดหมู่ย่อย (subcategories) */
  subcategories?: string[];
  
  /** Wikidata/Q-ID หรือ identifier ภายนอก (optional) */
  externalIds?: {
    wikidata?: string;
    wikipedia?: string;
    geonames?: string;
  };
  
  /** ข้อมูลพิกัด (สำหรับสถานที่) */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================
// Wiki Article — Article ที่มี metadata แบบ Wiki ครบถ้วน
// ============================================================
export interface WikiArticle {
  slug: string;
  title: string;
  abstract: ArticleAbstract;
  quickFacts: QuickFact[];
  entityFacts?: EntityQuickFacts;
  excerpts?: ExcerptStrategy;
  glossary: GlossaryEntry[];
  sections: WikiSection[];
  metadata: WikiMetadata;
}

// ============================================================
// Image Alt Text อย่างเข้มงวด
// ============================================================
export interface StrictImageAlt {
  /** คำอธิบายหลัก (required — ห้ามว่าง) */
  alt: string;
  /** คำอธิบายเชิงเทคนิค (optional — สำหรับ accessibility deep dive) */
  detailed?: string;
  /** Caption ใต้รูป */
  caption?: string;
  /** รูปนี้ decorative ไหม? (ถ้า true จะใช้ alt="" และ aria-hidden) */
  decorative?: boolean;
  /** Credit / Attribution */
  credit?: string;
}
