// ============================================================
// Vibe Microsite Service
// ============================================================
// จัดการ microsites ทั้ง CRUD, cache, และ settings
// รองรับ inherit from main site + locale tier override
// ============================================================

import { createClient as createServerClient } from "./supabase-server";
import { createAdminClient } from "./supabase-server";
import type { Microsite, MicrositeSettings, CustomNavLink } from "./microsite-types";
import type { MicrositeRow, MicrositeInsert, MicrositeUpdate } from "./microsite-types";
import { getDefaultSettings, getSettings } from "./site-settings";
import type { Locale } from "./locales";

// ============================================================
// In-memory cache for microsites (serverless-friendly)
// ============================================================

let micrositeCache: Map<string, Microsite> | null = null;
let micrositeListCache: Microsite[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

function isCacheValid(): boolean {
  return cacheTimestamp > 0 && Date.now() - cacheTimestamp < CACHE_TTL;
}

function setCache(microsites: Microsite[]): void {
  micrositeListCache = microsites;
  micrositeCache = new Map(microsites.map((m) => [m.slug, m]));
  cacheTimestamp = Date.now();
}

function invalidateCache(): void {
  micrositeCache = null;
  micrositeListCache = null;
  cacheTimestamp = 0;
}

// ============================================================
// Get all microsites
// ============================================================

export async function getAllMicrosites(options?: {
  activeOnly?: boolean;
  bypassCache?: boolean;
}): Promise<Microsite[]> {
  if (micrositeListCache && isCacheValid() && !options?.bypassCache) {
    return options?.activeOnly
      ? micrositeListCache.filter((m) => m.is_active)
      : micrositeListCache;
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("microsites")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    const microsites = (data || []) as Microsite[];
    setCache(microsites);

    if (options?.activeOnly) {
      return microsites.filter((m) => m.is_active);
    }

    return microsites;
  } catch (err) {
    console.error("[Microsite Service] Failed to fetch microsites:", err);
    return micrositeListCache || [];
  }
}

// ============================================================
// Get microsite by slug
// ============================================================

export async function getMicrositeBySlug(slug: string): Promise<Microsite | null> {
  if (micrositeCache && isCacheValid()) {
    const cached = micrositeCache.get(slug);
    if (cached) return cached;
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("microsites")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    if (!data) return null;

    const microsite = data as Microsite;
    if (micrositeCache) {
      micrositeCache.set(slug, microsite);
    }

    return microsite;
  } catch (err) {
    console.error(`[Microsite Service] Failed to fetch microsite "${slug}":`, err);
    return micrositeCache?.get(slug) || null;
  }
}

// ============================================================
// Convert Microsite DB row -> MicrositeSettings (for components)
// ============================================================

export function micrositeToSettings(microsite: Microsite | null): MicrositeSettings | null {
  if (!microsite) return null;

  const defaults = getDefaultSettings();
  const customNavLinks: CustomNavLink[] = microsite.custom_nav_links
    ? (typeof microsite.custom_nav_links === 'string'
        ? JSON.parse(microsite.custom_nav_links as string)
        : microsite.custom_nav_links as CustomNavLink[])
    : [];

  // Determine locale tiers:
  // - If inherit_from_main == true, use main site's localeTiers (will be resolved via getSettings)
  // - If false and microsite has custom locale_tiers, use those
  // - If false and no custom locale_tiers, empty = all locales shown (Tier 1)
  const localeTiers: Record<string, "0" | "1" | "2"> = microsite.locale_tiers
    ? microsite.locale_tiers
    : microsite.inherit_from_main
      ? defaults.localeTiers  // fallback — will be replaced by getMergedMicrositeSettings
      : {};  // empty = all locales shown (Tier 1)

  return {
    id: microsite.id,
    slug: microsite.slug,
    name: microsite.name,
    tagline: microsite.description || defaults.tagline,
    description: microsite.description || defaults.description,

    // Branding
    logo: microsite.logo_url || defaults.logo,
    favicon: microsite.favicon_url || defaults.favicon,
    primaryColor: microsite.primary_color || defaults.primaryColor,
    backgroundColor: microsite.background_color || defaults.backgroundColor,
    backgroundColorSecondary: microsite.background_secondary || defaults.backgroundColorSecondary,
    cardColor: microsite.card_color || defaults.cardColor,
    headerColor: microsite.background_color || defaults.headerColor,

    // Inheritance
    inheritFromMain: microsite.inherit_from_main ?? true,
    localeTiers,

    // Microsite-specific
    showMainSiteLink: microsite.show_main_site_link ?? true,
    customNavLinks,
    aboutContent: {
      th: microsite.about_content_th || "",
      en: microsite.about_content_en || "",
    },
    contactEmail: microsite.contact_email || null,

    // SEO
    metaTitle: microsite.meta_title || defaults.metaTitle,
    metaDescription: microsite.meta_description || defaults.metaDescription,

    // Fallback to defaults for rest
    url: defaults.url,
    copyright: defaults.copyright,
    locale: defaults.locale,
    timezone: defaults.timezone,
    ogTitle: defaults.ogTitle,
    ogDescription: defaults.ogDescription,
    ogImage: defaults.ogImage,
    googleAnalyticsId: defaults.googleAnalyticsId,

    // Features
    showAuthor: microsite.show_author ?? defaults.showAuthor,
    enableComments: defaults.enableComments,
    enableSocialShare: defaults.enableSocialShare,

    // Colors (fallback)
    accentColor: defaults.accentColor,
    cardBorderColor: defaults.cardBorderColor,
    textColor: defaults.textColor,
    textColorMuted: defaults.textColorMuted,
    sidebarColor: defaults.sidebarColor,
    successColor: defaults.successColor,
    errorColor: defaults.errorColor,

    // Social/Contact
    facebookUrl: defaults.facebookUrl,
    twitterUrl: defaults.twitterUrl,
    instagramUrl: defaults.instagramUrl,
    youtubeUrl: defaults.youtubeUrl,
    tiktokUrl: defaults.tiktokUrl,
    email: microsite.contact_email || defaults.email,
    phone: defaults.phone,
    address: defaults.address,

    // Maintenance
    maintenanceMode: defaults.maintenanceMode,

    // Meta
    updatedAt: microsite.updated_at || defaults.updatedAt,
  };
}

// ============================================================
// Merge microsite settings with main site settings
// (resolve inheritFromMain at runtime using live getSettings())
// ============================================================

export async function getMergedMicrositeSettings(
  microsite: Microsite | null
): Promise<MicrositeSettings | null> {
  const msSettings = micrositeToSettings(microsite);
  if (!msSettings) return null;

  if (msSettings.inheritFromMain) {
    // Fetch live main site settings for inheritance
    const mainSettings = await getSettings();

    // Merge: microsite values override main settings
    const merged = { ...mainSettings, ...msSettings };

    // If inheriting, use main site's localeTiers unless microsite has custom ones
    merged.localeTiers = msSettings.localeTiers && Object.keys(msSettings.localeTiers).length > 0
      ? msSettings.localeTiers
      : mainSettings.localeTiers;

    return merged as MicrositeSettings;
  }

  return msSettings;
}

// ============================================================
// CRUD: Create Microsite
// ============================================================

export async function createMicrosite(data: MicrositeInsert): Promise<Microsite | null> {
  try {
    const adminClient = createAdminClient();
    const { data: created, error } = await adminClient
      .from("microsites")
      .insert([{
        ...data,
        primary_color: data.primary_color || "#fbbf24",
        background_color: data.background_color || "#060e1a",
        background_secondary: data.background_secondary || "#0a1628",
        card_color: data.card_color || "#0f1f3a",
        is_active: data.is_active ?? true,
        inherit_from_main: data.inherit_from_main ?? true,
        locale_tiers: data.locale_tiers || null,
        show_in_main_nav: data.show_in_main_nav ?? false,
        main_site_visible: data.main_site_visible ?? false,
        show_main_site_link: data.show_main_site_link ?? true,
        show_author: data.show_author ?? true,
      }])
      .select()
      .single();

    if (error) throw error;
    invalidateCache();
    return created as Microsite;
  } catch (err) {
    console.error("[Microsite Service] Failed to create microsite:", err);
    return null;
  }
}

// ============================================================
// CRUD: Update Microsite
// ============================================================

export async function updateMicrosite(slug: string, data: MicrositeUpdate): Promise<Microsite | null> {
  try {
    const adminClient = createAdminClient();
    const { data: updated, error } = await adminClient
      .from("microsites")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select()
      .single();

    if (error) throw error;
    invalidateCache();
    return updated as Microsite;
  } catch (err) {
    console.error(`[Microsite Service] Failed to update microsite "${slug}":`, err);
    return null;
  }
}

// ============================================================
// CRUD: Delete Microsite
// ============================================================

export async function deleteMicrosite(slug: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("microsites")
      .delete()
      .eq("slug", slug);

    if (error) throw error;
    invalidateCache();
    return true;
  } catch (err) {
    console.error(`[Microsite Service] Failed to delete microsite "${slug}":`, err);
    return false;
  }
}

// ============================================================
// Check if a slug conflicts with any locale
// ============================================================

import { ALL_LOCALES } from "./locales";

export function isReservedSlug(slug: string): boolean {
  const reserved = [
    ...ALL_LOCALES,
    "admin",
    "api",
    "auth",
    "microsite",
    "_next",
    "images",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
  ];
  return reserved.includes(slug.toLowerCase());
}

// ============================================================
// Get articles for a specific microsite
// ============================================================

export async function getMicrositeArticles(
  micrositeSlug: string,
  locale: Locale,
  options?: { publishedOnly?: boolean; limit?: number }
): Promise<any[]> {
  const microsite = await getMicrositeBySlug(micrositeSlug);
  if (!microsite) return [];

  try {
    const supabase = await createServerClient();

    let query = supabase
      .from("articles")
      .select(`
        id, slug, original_title, original_excerpt, tags,
        categories!inner(name_th, name_en),
        author_name, published_at, image_url, image_alt, featured
      `)
      .eq("microsite_id", microsite.id)
      .order("published_at", { ascending: false });

    if (options?.publishedOnly !== false) {
      query = query.eq("is_published", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: articles } = await query;
    if (!articles) return [];

    return await Promise.all(
      (articles as any[]).map(async (article: any) => {
        const { data: rawTrans } = await supabase
          .from("translations")
          .select("title, excerpt, translation_status")
          .eq("article_id", article.id)
          .eq("locale", locale)
          .maybeSingle();

        const trans = rawTrans as { title?: string; excerpt?: string; translation_status?: string } | null;

        return {
          id: article.id,
          slug: article.slug,
          title: trans?.title || article.original_title,
          excerpt: trans?.excerpt || article.original_excerpt,
          category: locale === "th"
            ? article.categories?.name_th || ""
            : article.categories?.name_en || "",
          author: article.author_name,
          publishedAt: article.published_at,
          imageUrl: article.image_url,
          imageAlt: article.image_alt,
          featured: article.featured,
          tags: article.tags || [],
          translationStatus: trans?.translation_status || "pending",
        };
      })
    );
  } catch (err) {
    console.error(`[Microsite Service] Failed to get articles for "${micrositeSlug}":`, err);
    return [];
  }
}
