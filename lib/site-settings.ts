// ============================================================
// Site Settings Store (Branding) — Persisted to Supabase
// ============================================================
// Falls back to in-memory cache + DEFAULT_SETTINGS.
// All brand values come from settings DB or env vars.
// ============================================================

import { createAdminClient } from "@/lib/supabase-server";
import type { Locale } from "@/lib/locales";
import { ALL_LOCALES, setLocaleTiers } from "@/lib/locales";

export interface SiteSettings {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  logo: string;
  logoFull?: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundColorSecondary: string;
  cardColor: string;
  cardBorderColor: string;
  textColor: string;
  textColorMuted: string;
  sidebarColor: string;
  headerColor: string;
  successColor: string;
  errorColor: string;
  copyright: string;
  locale: "th" | "en" | "both";
  timezone: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterHandle?: string;
  googleAnalyticsId?: string;
  adsenseId?: string;
  adsenseSlotHomepage?: string;
  adsenseSlotSidebar?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  showAuthor: boolean;
  enableComments: boolean;
  enableSocialShare: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  /** 
   * Language tier configuration.
   * "1" = Tier 1 (shown in header locale switcher, fully translated on load)
   * "2" = Tier 2 (translated on demand, not shown in main header)
   * Default: 6 active locales are Tier 1, rest are Tier 2
   */
  localeTiers: Record<string, "0" | "1" | "2">;
  // OAuth Keys for login with Google / Facebook
  // เก็บใน DB และตรวจสอบคู่กับ Environment Variables
  googleOAuthClientId?: string;
  googleOAuthClientSecret?: string;
  facebookOAuthClientId?: string;
  facebookOAuthClientSecret?: string;
  /** Translation API provider: "gemini" | "claude" | "openai" */
  translationApiProvider: string;
  /** API keys for translation providers */
  claudeApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  name: process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || "Unfake News: Real facts, true stories, and no fake news.",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Unfake News: Uncovering the truth and setting the record straight. Your trusted source for verified facts, unbiased articles, and debunking Cambodian propaganda.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://unfakenews.asia",
  logo: process.env.NEXT_PUBLIC_SITE_LOGO || "/images/logo/unfakenews-logo-light.png",
  logoFull: process.env.NEXT_PUBLIC_SITE_LOGO_FULL || "/images/logo/unfakenews-logo.png",
  favicon: process.env.NEXT_PUBLIC_SITE_FAVICON || "/images/logo/favicon.png",
  primaryColor: process.env.NEXT_PUBLIC_COLOR_PRIMARY || "#fbbf24",
  secondaryColor: process.env.NEXT_PUBLIC_COLOR_SECONDARY || "#f59e0b",
  accentColor: process.env.NEXT_PUBLIC_COLOR_ACCENT || "#d97706",
  backgroundColor: process.env.NEXT_PUBLIC_COLOR_BG || "#060e1a",
  backgroundColorSecondary: process.env.NEXT_PUBLIC_COLOR_BG_SECONDARY || "#0a1628",
  cardColor: process.env.NEXT_PUBLIC_COLOR_CARD || "#0f1f3a",
  cardBorderColor: process.env.NEXT_PUBLIC_COLOR_CARD_BORDER || "rgba(255,255,255,0.1)",
  textColor: process.env.NEXT_PUBLIC_COLOR_TEXT || "#ffffff",
  textColorMuted: process.env.NEXT_PUBLIC_COLOR_TEXT_MUTED || "rgba(255,255,255,0.5)",
  sidebarColor: process.env.NEXT_PUBLIC_COLOR_SIDEBAR || "#0a1628",
  headerColor: process.env.NEXT_PUBLIC_COLOR_HEADER || "#060e1a",
  successColor: process.env.NEXT_PUBLIC_COLOR_SUCCESS || "#10b981",
  errorColor: process.env.NEXT_PUBLIC_COLOR_ERROR || "#ef4444",
  copyright: process.env.NEXT_PUBLIC_COPYRIGHT || `© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_SITE_NAME || "UnFakeNews"}. All rights reserved.`,
  locale: "both",
  timezone: "Asia/Bangkok",
  metaTitle: process.env.NEXT_PUBLIC_SITE_NAME ? `${process.env.NEXT_PUBLIC_SITE_NAME} — ${process.env.NEXT_PUBLIC_SITE_TAGLINE || "Real facts, true stories, and no fake news."}` : "UnFakeNews — Real facts, true stories, and no fake news.",
  metaDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Unfake News: Uncovering the truth and setting the record straight. Your trusted source for verified facts, unbiased articles, and debunking Cambodian propaganda.",
  ogTitle: process.env.NEXT_PUBLIC_SITE_NAME ? `${process.env.NEXT_PUBLIC_SITE_NAME} — ${process.env.NEXT_PUBLIC_SITE_URL || "unfakenews.asia"}` : "UnFakeNews — unfakenews.asia",
  ogDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Uncovering the truth and setting the record straight. Your trusted source for verified facts, unbiased articles, and debunking Cambodian propaganda.",
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || "https://unfakenews.asia/images/og-default.jpg",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@unfakenews",
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || "",
  adsenseId: "",
  adsenseSlotHomepage: "",
  adsenseSlotSidebar: "",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@unfakenews.asia",
  phone: "",
  address: "",
  showAuthor: true,
  enableComments: false,
  enableSocialShare: true,
  maintenanceMode: false,
  maintenanceMessage: "",
  localeTiers: {
    "en": "1", "th": "1", "zh": "1", "ja": "1", "es": "1", "pt": "1",
    "fr": "2", "ko": "2", "de": "2", "ru": "2", "ar": "2", "hi": "2", "it": "2", "vi": "2", "ms": "2",
  },
  // OAuth Keys — fallback to env vars if set
  googleOAuthClientId: process.env.AUTH_GOOGLE_CLIENT_ID || "",
  googleOAuthClientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET || "",
  facebookOAuthClientId: process.env.AUTH_FACEBOOK_CLIENT_ID || "",
  facebookOAuthClientSecret: process.env.AUTH_FACEBOOK_CLIENT_SECRET || "",
  // Translation API Settings
  translationApiProvider: process.env.DEFAULT_TRANSLATION_PROVIDER || "gemini",
  claudeApiKey: process.env.AUTH_CLAUDE_API_KEY || "",
  openaiApiKey: process.env.AUTH_OPENAI_API_KEY || "",
  geminiApiKey: process.env.AUTH_GEMINI_API_KEY || "",
  updatedAt: new Date().toISOString(),
};

// Helper: map snake_case DB row → camelCase SiteSettings
function dbRowToSettings(row: any): SiteSettings {
  return {
    id: row.id || "default",
    name: row.name || DEFAULT_SETTINGS.name,
    tagline: row.tagline || DEFAULT_SETTINGS.tagline,
    description: row.description || DEFAULT_SETTINGS.description,
    url: row.url || DEFAULT_SETTINGS.url,
    logo: row.logo || DEFAULT_SETTINGS.logo,
    logoFull: row.logo_full || DEFAULT_SETTINGS.logoFull,
    favicon: row.favicon || DEFAULT_SETTINGS.favicon,
    primaryColor: row.primary_color || DEFAULT_SETTINGS.primaryColor,
    secondaryColor: row.secondary_color || DEFAULT_SETTINGS.secondaryColor,
    accentColor: row.accent_color || DEFAULT_SETTINGS.accentColor,
    backgroundColor: row.background_color || DEFAULT_SETTINGS.backgroundColor,
    backgroundColorSecondary: row.background_color_secondary || DEFAULT_SETTINGS.backgroundColorSecondary,
    cardColor: row.card_color || DEFAULT_SETTINGS.cardColor,
    cardBorderColor: row.card_border_color || DEFAULT_SETTINGS.cardBorderColor,
    textColor: row.text_color || DEFAULT_SETTINGS.textColor,
    textColorMuted: row.text_color_muted || DEFAULT_SETTINGS.textColorMuted,
    sidebarColor: row.sidebar_color || DEFAULT_SETTINGS.sidebarColor,
    headerColor: row.header_color || DEFAULT_SETTINGS.headerColor,
    successColor: row.success_color || DEFAULT_SETTINGS.successColor,
    errorColor: row.error_color || DEFAULT_SETTINGS.errorColor,
    copyright: row.copyright || DEFAULT_SETTINGS.copyright,
    locale: row.locale || DEFAULT_SETTINGS.locale,
    timezone: row.timezone || DEFAULT_SETTINGS.timezone,
    metaTitle: row.meta_title || DEFAULT_SETTINGS.metaTitle,
    metaDescription: row.meta_description || DEFAULT_SETTINGS.metaDescription,
    ogTitle: row.og_title || DEFAULT_SETTINGS.ogTitle,
    ogDescription: row.og_description || DEFAULT_SETTINGS.ogDescription,
    ogImage: row.og_image || DEFAULT_SETTINGS.ogImage,
    twitterHandle: row.twitter_handle || DEFAULT_SETTINGS.twitterHandle,
    googleAnalyticsId: row.google_analytics_id || process.env.NEXT_PUBLIC_GA_ID || "",
    adsenseId: row.adsense_id || "",
    adsenseSlotHomepage: row.adsense_slot_homepage || "",
    adsenseSlotSidebar: row.adsense_slot_sidebar || "",
    facebookUrl: row.facebook_url || DEFAULT_SETTINGS.facebookUrl,
    twitterUrl: row.twitter_url || DEFAULT_SETTINGS.twitterUrl,
    instagramUrl: row.instagram_url || DEFAULT_SETTINGS.instagramUrl,
    youtubeUrl: row.youtube_url || DEFAULT_SETTINGS.youtubeUrl,
    tiktokUrl: row.tiktok_url || DEFAULT_SETTINGS.tiktokUrl,
    email: row.email || DEFAULT_SETTINGS.email,
    phone: row.phone || DEFAULT_SETTINGS.phone,
    address: row.address || DEFAULT_SETTINGS.address,
    showAuthor: row.show_author !== undefined ? row.show_author : DEFAULT_SETTINGS.showAuthor,
    enableComments: row.enable_comments !== undefined ? row.enable_comments : DEFAULT_SETTINGS.enableComments,
    enableSocialShare: row.enable_social_share !== undefined ? row.enable_social_share : DEFAULT_SETTINGS.enableSocialShare,
    maintenanceMode: row.maintenance_mode !== undefined ? row.maintenance_mode : DEFAULT_SETTINGS.maintenanceMode,
    maintenanceMessage: row.maintenance_message || DEFAULT_SETTINGS.maintenanceMessage,
    localeTiers: row.locale_tiers ? row.locale_tiers : DEFAULT_SETTINGS.localeTiers,
    // OAuth Keys — ใช้ค่าจาก DB ก่อน ถ้าไม่มี fallback จาก env var
    googleOAuthClientId: row.google_oauth_client_id || process.env.AUTH_GOOGLE_CLIENT_ID || "",
    googleOAuthClientSecret: row.google_oauth_client_secret || process.env.AUTH_GOOGLE_CLIENT_SECRET || "",
    facebookOAuthClientId: row.facebook_oauth_client_id || process.env.AUTH_FACEBOOK_CLIENT_ID || "",
    facebookOAuthClientSecret: row.facebook_oauth_client_secret || process.env.AUTH_FACEBOOK_CLIENT_SECRET || "",
    translationApiProvider: row.translation_api_provider || DEFAULT_SETTINGS.translationApiProvider,
    claudeApiKey: row.claude_api_key || DEFAULT_SETTINGS.claudeApiKey,
    openaiApiKey: row.openai_api_key || DEFAULT_SETTINGS.openaiApiKey,
    geminiApiKey: row.gemini_api_key || DEFAULT_SETTINGS.geminiApiKey,
    updatedAt: row.updated_at || new Date().toISOString(),
    updatedBy: row.updated_by || DEFAULT_SETTINGS.updatedBy,
  };
}

// Helper: camelCase → snake_case for DB upsert
function settingsToDbRow(settings: SiteSettings): any {
  return {
    id: settings.id,
    name: settings.name,
    tagline: settings.tagline,
    description: settings.description,
    url: settings.url,
    logo: settings.logo,
    logo_full: settings.logoFull || null,
    favicon: settings.favicon,
    primary_color: settings.primaryColor,
    secondary_color: settings.secondaryColor,
    accent_color: settings.accentColor,
    background_color: settings.backgroundColor,
    background_color_secondary: settings.backgroundColorSecondary,
    card_color: settings.cardColor,
    card_border_color: settings.cardBorderColor,
    text_color: settings.textColor,
    text_color_muted: settings.textColorMuted,
    sidebar_color: settings.sidebarColor,
    header_color: settings.headerColor,
    success_color: settings.successColor,
    error_color: settings.errorColor,
    copyright: settings.copyright,
    locale: settings.locale,
    timezone: settings.timezone,
    meta_title: settings.metaTitle,
    meta_description: settings.metaDescription,
    og_title: settings.ogTitle,
    og_description: settings.ogDescription,
    og_image: settings.ogImage,
    twitter_handle: settings.twitterHandle || null,
    google_analytics_id: settings.googleAnalyticsId || null,
    adsense_id: settings.adsenseId || null,
    adsense_slot_homepage: settings.adsenseSlotHomepage || null,
    adsense_slot_sidebar: settings.adsenseSlotSidebar || null,
    facebook_url: settings.facebookUrl || null,
    twitter_url: settings.twitterUrl || null,
    instagram_url: settings.instagramUrl || null,
    youtube_url: settings.youtubeUrl || null,
    tiktok_url: settings.tiktokUrl || null,
    email: settings.email || null,
    phone: settings.phone || null,
    address: settings.address || null,
    show_author: settings.showAuthor,
    enable_comments: settings.enableComments,
    enable_social_share: settings.enableSocialShare,
    maintenance_mode: settings.maintenanceMode,
    maintenance_message: settings.maintenanceMessage || null,
    locale_tiers: settings.localeTiers,
    // OAuth Keys
    google_oauth_client_id: settings.googleOAuthClientId || null,
    google_oauth_client_secret: settings.googleOAuthClientSecret || null,
    facebook_oauth_client_id: settings.facebookOAuthClientId || null,
    facebook_oauth_client_secret: settings.facebookOAuthClientSecret || null,
    // Translation API Settings
    translation_api_provider: settings.translationApiProvider || "gemini",
    claude_api_key: settings.claudeApiKey || null,
    openai_api_key: settings.openaiApiKey || null,
    gemini_api_key: settings.geminiApiKey || null,
    updated_at: new Date().toISOString(),
    updated_by: settings.updatedBy || null,
  };
}

// In-memory cache for hot reload / SSR performance
let cachedSettings: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
  // Always read from DB — bypass cache to ensure fresh data
  // Cache causes issues when settings are updated via API in serverless env
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error || !data) {
      console.warn("[Settings] DB read failed, using defaults:", error?.message);
      cachedSettings = { ...DEFAULT_SETTINGS };
      // Sync defaults into locales.ts runtime cache
      setLocaleTiers(DEFAULT_SETTINGS.localeTiers);
      return cachedSettings;
    }

    cachedSettings = dbRowToSettings(data);
    // Sync locale tiers from DB into locales.ts runtime cache
    setLocaleTiers(cachedSettings.localeTiers);
    return cachedSettings;
  } catch (err: any) {
    console.warn("[Settings] DB unavailable, using defaults:", err?.message);
    cachedSettings = { ...DEFAULT_SETTINGS };
    // Sync defaults into locales.ts runtime cache
    setLocaleTiers(DEFAULT_SETTINGS.localeTiers);
    return cachedSettings;
  }
}

export async function saveSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  // Always read current from DB first to get the full object
  const current = await getSettings();
  const updated: SiteSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Sync locale tiers from DB into locales.ts runtime cache
  if (updates.localeTiers) {
    setLocaleTiers(updated.localeTiers);
  }

  // Update cache immediately (optimistic)
  cachedSettings = updated;

  try {
    const supabase = createAdminClient();
    const dbRow = settingsToDbRow(updated);
    const { error } = await supabase
      .from("site_settings")
      .upsert(dbRow, { onConflict: "id" });

    if (error) {
      console.error("[Settings] DB upsert failed:", error.message);
    }
  } catch (err: any) {
    console.error("[Settings] DB write failed:", err?.message);
    // Cache is still updated, so app works until next server restart
  }

  return updated;
}

export function getDefaultSettings(): SiteSettings {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Clear the in-memory cached settings.
 * Call this after saveSettings to force next getSettings to read from DB.
 */
export function clearSettingsCache() {
  cachedSettings = null;
}
