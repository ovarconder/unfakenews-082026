// ============================================================
// Siam Heritage - Microsite Types
// ============================================================
// รองรับหลาย microsites ภายใต้ domain เดียวกัน
// แต่ละ microsite มี branding, categories, articles ของตัวเอง
// แต่ใช้ session เดียวกับ main site
// ============================================================

import type { SiteSettings } from "./site-settings";

// ============================================================
// Microsite — ข้อมูล microsite ที่เก็บใน DB
// ============================================================

export interface Microsite {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  
  // Branding
  primary_color: string;
  background_color: string;
  background_secondary: string;
  card_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  
  // Inherit from main site
  inherit_from_main: boolean;
  
  // Override locale tiers (only when inherit_from_main = false)
  locale_tiers: Record<string, "0" | "1" | "2"> | null;
  
  // Navigation
  show_in_main_nav: boolean;      // แสดงลิงก์ใน nav ของ main site ไหม
  main_site_visible: boolean;     // content ของ microsite โผล่ใน main site ไหม
  show_main_site_link: boolean;   // มีลิงก์ไป main site ใน nav ของ microsite ไหม
  
  // Custom navigation links (JSON array)
  custom_nav_links: CustomNavLink[] | null;
  
  // SEO
  meta_title: string | null;
  meta_description: string | null;
  
  // About
  about_content_th: string | null;
  about_content_en: string | null;
  contact_email: string | null;
  
  // Show per-microsite author
  show_author: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface CustomNavLink {
  label: string;
  href: string;
  locale_specific?: Record<string, { label: string }>;
}

// ============================================================
// Microsite Settings — extend SiteSettings สำหรับ microsite
// ค่าที่ไม่ override จะ fallback ไปใช้ main site settings
// ============================================================

export interface MicrositeSettings extends Partial<SiteSettings> {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  
  // Branding ที่ override ได้
  logo: string;
  favicon: string;
  primaryColor: string;
  backgroundColor: string;
  backgroundColorSecondary: string;
  cardColor: string;
  headerColor: string;
  
  // Inherit from main
  inheritFromMain: boolean;
  
  // Locale tiers (override for microsite)
  localeTiers: Record<string, "0" | "1" | "2">;
  
  // Microsite-specific
  showMainSiteLink: boolean;
  customNavLinks: CustomNavLink[];
  aboutContent: {
    th: string;
    en: string;
  };
  contactEmail: string | null;
  
  // จาก Microsite DB
  metaTitle: string;
  metaDescription: string;
}

// ============================================================
// Microsite Article — ข้อมูล article ที่มี microsite_id
// ============================================================

export interface MicrositeArticleMaster {
  id: string;
  slug: string;
  microsite_id: string;
  original_title: string;
  original_excerpt: string;
  original_content: string;
  category_id: string;
  category_name: string;
  author_name: string;
  published_at: string;
  image_url: string | null;
  image_alt: string | null;
  featured: boolean;
  tags: string[];
  status: "draft" | "published" | "hidden";
}

// ============================================================
// Supabase Row Types สำหรับ microsites table
// ============================================================

export interface MicrositeRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  
  primary_color: string;
  background_color: string;
  background_secondary: string;
  card_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  
  inherit_from_main: boolean;
  locale_tiers: any;
  
  show_in_main_nav: boolean;
  main_site_visible: boolean;
  show_main_site_link: boolean;
  custom_nav_links: any;
  
  meta_title: string | null;
  meta_description: string | null;
  
  about_content_th: string | null;
  about_content_en: string | null;
  contact_email: string | null;
  show_author: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface MicrositeInsert {
  slug: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  primary_color?: string;
  background_color?: string;
  background_secondary?: string;
  card_color?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  inherit_from_main?: boolean;
  locale_tiers?: Record<string, "0" | "1" | "2"> | null;
  show_in_main_nav?: boolean;
  main_site_visible?: boolean;
  show_main_site_link?: boolean;
  custom_nav_links?: any;
  meta_title?: string | null;
  meta_description?: string | null;
  about_content_th?: string | null;
  about_content_en?: string | null;
  contact_email?: string | null;
  show_author?: boolean;
}

export interface MicrositeUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  primary_color?: string;
  background_color?: string;
  background_secondary?: string;
  card_color?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  inherit_from_main?: boolean;
  locale_tiers?: Record<string, "0" | "1" | "2"> | null;
  show_in_main_nav?: boolean;
  main_site_visible?: boolean;
  show_main_site_link?: boolean;
  custom_nav_links?: any;
  meta_title?: string | null;
  meta_description?: string | null;
  about_content_th?: string | null;
  about_content_en?: string | null;
  contact_email?: string | null;
  show_author?: boolean;
}

// ============================================================
// Profile-Microsite Junction
// ============================================================

export interface ProfileMicrositeRow {
  profile_id: string;
  microsite_id: string;
  role: "microsite_admin" | "microsite_editor" | "microsite_writer";
  created_at: string;
}

export type MicrositeUserRole = "microsite_admin" | "microsite_editor" | "microsite_writer";

export const MICROSITE_ROLE_LABELS: Record<MicrositeUserRole, string> = {
  microsite_admin: "ผู้ดูแล Microsite",
  microsite_editor: "บรรณาธิการ Microsite",
  microsite_writer: "นักเขียน Microsite",
};

export const MICROSITE_ROLE_LABELS_EN: Record<MicrositeUserRole, string> = {
  microsite_admin: "Microsite Admin",
  microsite_editor: "Microsite Editor",
  microsite_writer: "Microsite Writer",
};
