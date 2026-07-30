// ============================================================
// 15-Language System (dynamic tiers)
// ============================================================
//
// Tier 0: Disabled — ไม่แสดงให้ผู้ใช้เลือกเลย (hidden from header + routes)
// Tier 1: Shown in header locale switcher, fully translated on load
// Tier 2: Translated on demand, not shown in main header
//
// Tier configuration is stored in DB (site_settings.locale_tiers)
// and can be changed from /admin/settings → Language Tiers
//
// Default (ถ้า DB ยังไม่มีค่า): first 6 locales = Tier 1, rest = Tier 2

export const ALL_LOCALES = [
  "en", "th", "zh", "ja", "es", "pt",
  "fr", "ko", "de", "ru", "ar", "hi", "it", "vi", "ms"
] as const;
export type Locale = (typeof ALL_LOCALES)[number];

/**
 * Tier types:
 * "0" = Disabled (ไม่แสดง)
 * "1" = Tier 1 (แสดงใน Header + แปลทันที)
 * "2" = Tier 2 (JIT, แปลตามคำขอ)
 */
export type LocaleTier = "0" | "1" | "2";

// Default tiers when DB hasn't loaded yet
const DEFAULT_TIERS: Record<string, LocaleTier> = {
  "en": "1", "th": "1", "zh": "1", "ja": "1", "es": "1", "pt": "1",
  "fr": "2", "ko": "2", "de": "2", "ru": "2", "ar": "2", "hi": "2", "it": "2", "vi": "2", "ms": "2",
};

// Runtime tier cache — updated by getSettings() via setLocaleTiers()
let currentTiers: Record<string, LocaleTier> = { ...DEFAULT_TIERS };

/** Called by getSettings() or saveSettings() to sync tiers from DB */
export function setLocaleTiers(tiers: Record<string, LocaleTier>) {
  currentTiers = { ...DEFAULT_TIERS, ...tiers };
}

export function getLocaleTiers(): Record<string, LocaleTier> {
  return { ...currentTiers };
}

/** Tier 1 locales = shown in header, translated eagerly */
export function getTier1Locales(): Locale[] {
  return ALL_LOCALES.filter(l => currentTiers[l] === "1");
}

/** Tier 2 locales = translated on demand */
export function getTier2Locales(): Locale[] {
  return ALL_LOCALES.filter(l => currentTiers[l] === "2");
}

/** Active (visible) locales = Tier 1 + Tier 2 (แต่ Tier 2 ไม่แสดงใน Header) */
export function getActiveLocales(): Locale[] {
  return ALL_LOCALES.filter(l => currentTiers[l] && currentTiers[l] !== "0");
}

/** Locales ที่แสดงใน Header locale switcher = Tier 1 เท่านั้น */
export function getVisibleLocales(): Locale[] {
  return getTier1Locales();
}

// Keep these exported for backward compatibility until all code is migrated
/** @deprecated Use getTier1Locales() instead */
export const ACTIVE_LOCALES: Locale[] = [...getTier1Locales()];
/** @deprecated Use getTier1Locales() instead */
export const TIER1_LOCALES: Locale[] = [...getTier1Locales()];
/** @deprecated Use getTier2Locales() instead */
export const TIER2_LOCALES: Locale[] = [...getTier2Locales()];

export const LOCALE_NAMES: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  th: { native: "ไทย", english: "Thai" },
  zh: { native: "中文", english: "Chinese" },
  ja: { native: "日本語", english: "Japanese" },
  es: { native: "Español", english: "Spanish" },
  pt: { native: "Português", english: "Portuguese" },
  fr: { native: "Français", english: "French" },
  ko: { native: "한국어", english: "Korean" },
  de: { native: "Deutsch", english: "German" },
  ru: { native: "Русский", english: "Russian" },
  ar: { native: "العربية", english: "Arabic" },
  hi: { native: "हिन्दी", english: "Hindi" },
  it: { native: "Italiano", english: "Italian" },
  vi: { native: "Tiếng Việt", english: "Vietnamese" },
  ms: { native: "Bahasa Melayu", english: "Malay" },
};

export function getLocale(lang?: string): Locale {
  if (lang && ALL_LOCALES.includes(lang as Locale)) return lang as Locale;
  return "en";
}

export function isDisabled(locale: Locale): boolean {
  return currentTiers[locale] === "0";
}

export function isTier1(locale: Locale): boolean {
  return currentTiers[locale] === "1";
}

export function isTier2(locale: Locale): boolean {
  return currentTiers[locale] === "2";
}
