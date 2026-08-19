// ============================================================
// Siam Heritage - Supabase Database Types
// ============================================================
// Generated from Supabase schema
// ============================================================

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: ArticleRow;
        Insert: ArticleInsert;
        Update: ArticleUpdate;
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      translations: {
        Row: TranslationRow;
        Insert: TranslationInsert;
        Update: TranslationUpdate;
      };
      hero_slides: {
        Row: HeroSlideRow;
        Insert: HeroSlideInsert;
        Update: HeroSlideUpdate;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: "admin" | "editor" | "writer";
      translation_status: "complete" | "summary_only" | "pending";
    };
  };
}

// ============================================================
// Articles
// ============================================================

export interface ArticleRow {
  id: string;
  slug: string;
  original_title: string;
  original_excerpt: string;
  original_content: string;
  category_id: string;
  author_id: string;
  author_name: string;
  published_at: string;
  image_url: string | null;
  image_alt: string | null;
  /** ที่มาของรูปภาพ (Credit) — เช่น วัดพระศรีรัตนศาสดาราม, หอจดหมายเหตุแห่งชาติ */
  image_credit: string | null;
  /** ผู้ถ่าย / เจ้าของภาพ */
  image_photographer: string | null;
  /** Original Source URL — ลิงก์ไปแหล่งต้นฉบับของภาพ */
  image_source_url: string | null;
  /** ปีที่ถ่าย / ช่วงเวลา */
  image_year: string | null;
  /** Google Schema Markup (JSON-LD structured data) — stringified JSON */
  google_schema_markup: any | null;
  featured: boolean;
  tags: string[];
  status: string;
  entity_name: string | null;
  entity_type: string | null;
  wikidata_id: string | null;
  quick_facts: any | null;
  glossary: any | null;
  short_excerpt: string | null;
  long_excerpt: string | null;
  social_caption: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleInsert {
  slug: string;
  original_title: string;
  original_excerpt: string;
  original_content: string;
  category_id: string;
  author_id: string;
  author_name: string;
  published_at?: string;
  image_url?: string | null;
  image_alt?: string | null;
  image_credit?: string | null;
  image_photographer?: string | null;
  image_source_url?: string | null;
  image_year?: string | null;
  google_schema_markup?: any | null;
  featured?: boolean;
  tags?: string[];
  status?: string;
  entity_name?: string | null;
  entity_type?: string | null;
  wikidata_id?: string | null;
  quick_facts?: any | null;
  glossary?: any | null;
  short_excerpt?: string | null;
  long_excerpt?: string | null;
  social_caption?: string | null;
}

export interface ArticleUpdate {
  original_title?: string;
  original_excerpt?: string;
  original_content?: string;
  category_id?: string;
  author_name?: string;
  published_at?: string;
  image_url?: string | null;
  image_alt?: string | null;
  image_credit?: string | null;
  image_photographer?: string | null;
  image_source_url?: string | null;
  image_year?: string | null;
  google_schema_markup?: any | null;
  featured?: boolean;
  tags?: string[];
  status?: string;
  entity_name?: string | null;
  entity_type?: string | null;
  wikidata_id?: string | null;
  quick_facts?: any | null;
  glossary?: any | null;
  short_excerpt?: string | null;
  long_excerpt?: string | null;
  social_caption?: string | null;
}

// ============================================================
// Categories
// ============================================================

export interface CategoryRow {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface CategoryInsert {
  slug: string;
  name_th: string;
  name_en: string;
  description_th?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
}

export interface CategoryUpdate {
  slug?: string;
  name_th?: string;
  name_en?: string;
  description_th?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
}

// ============================================================
// Translations
// ============================================================

export interface TranslationRow {
  id: string;
  article_id: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  short_excerpt: string | null;
  long_excerpt: string | null;
  tags: string[] | null;
  image_alt_texts: Record<string, string> | null;
  /** Google Schema Markup (JSON-LD structured data) ที่แปลแล้ว */
  google_schema_markup: any | null;
  /** Entity Name ที่แปลแล้ว (เช่น "Khon Thai Masked Dance") */
  entity_name: string | null;
  /** Quick Facts ที่แปลแล้ว — JSON array ของ { label, value } */
  quick_facts: any | null;
  /** Glossary ที่แปลแล้ว — JSON array ของ { term, definition } */
  glossary: any | null;
  social_caption: string | null;
  translation_status: "complete" | "summary_only" | "pending";
  is_full_translated: boolean;
  translated_at: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationInsert {
  article_id: string;
  locale: string;
  title: string;
  excerpt: string;
  content?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  short_excerpt?: string | null;
  long_excerpt?: string | null;
  tags?: string[] | null;
  image_alt_texts?: Record<string, string> | null;
  google_schema_markup?: any | null;
  entity_name?: string | null;
  quick_facts?: any | null;
  glossary?: any | null;
  social_caption?: string | null;
  translation_status?: "complete" | "summary_only" | "pending";
  is_full_translated?: boolean;
}

export interface TranslationUpdate {
  title?: string;
  excerpt?: string;
  content?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  short_excerpt?: string | null;
  long_excerpt?: string | null;
  tags?: string[] | null;
  image_alt_texts?: Record<string, string> | null;
  google_schema_markup?: any | null;
  entity_name?: string | null;
  quick_facts?: any | null;
  glossary?: any | null;
  social_caption?: string | null;
  translation_status?: "complete" | "summary_only" | "pending";
  is_full_translated?: boolean;
}

// ============================================================
// Hero Slides (Banner Carousel)
// ============================================================

export interface HeroSlideRow {
  id: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
  image_url: string;
  cta_text_th: string | null;
  cta_text_en: string | null;
  cta_link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSlideInsert {
  title_th: string;
  title_en: string;
  subtitle_th?: string | null;
  subtitle_en?: string | null;
  image_url: string;
  cta_text_th?: string | null;
  cta_text_en?: string | null;
  cta_link?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface HeroSlideUpdate {
  title_th?: string;
  title_en?: string;
  subtitle_th?: string | null;
  subtitle_en?: string | null;
  image_url?: string;
  cta_text_th?: string | null;
  cta_text_en?: string | null;
  cta_link?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================
// Profiles (extends Supabase auth.users)
// ============================================================

export interface ProfileRow {
  id: string; // matches auth.users.id
  name: string;
  role: "admin" | "editor" | "writer";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  name: string;
  role?: "admin" | "editor" | "writer";
  avatar_url?: string | null;
}

export interface ProfileUpdate {
  name?: string;
  role?: "admin" | "editor" | "writer";
  avatar_url?: string | null;
}
