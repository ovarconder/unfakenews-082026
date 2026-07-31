// ============================================================
// Google Analytics Component
// ============================================================
// ใช้ค่า GA ID จาก:
// 1. prop `gaId` (ส่งจาก layout ที่มี settings จาก DB)
// 2. Environment Variable: NEXT_PUBLIC_GA_ID
// ถ้าไม่ได้ set จะไม่ render อะไร
//
// Features:
// - Track page views with language detection
// - Track translation events (Tier 1, Tier 2 JIT)
// - Track language switching
// - Track article reads with translation status
//
// Cookie Consent:
// - จะทำงานต่อเมื่อผู้ใช้กด "Accept" ใน Cookie Consent Banner
// - ใช้ localStorage key "siamheritage_cookie_consent"
// ============================================================

"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSettings } from "@/components/admin/settings-context";

const FALLBACK_GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const COOKIE_CONSENT_KEY = "unfakenews_cookie_consent";

// Type-safe gtag function
declare global {
  interface Window {
    gtag?: (command: string, target: string, config?: Record<string, any>) => void;
    dataLayer?: any[];
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);
  const settings = useSettings();

  // Resolve GA ID: prop > Settings DB > env var
  const gaId = settings?.googleAnalyticsId || FALLBACK_GA_ID;

  useEffect(() => {
    // Check if user has accepted cookie consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === "accepted") {
      setConsented(true);
    }
  }, []);

  useEffect(() => {
    if (!gaId || typeof window === "undefined" || !consented) return;
    
    // Track page view on route change
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    // Extract language from URL path for analytics
    const langMatch = pathname?.match(/^\/([a-z]{2})(\/|$)/);
    const language = langMatch ? langMatch[1] : "unknown";
    
    if (typeof window.gtag !== "undefined") {
      window.gtag("config", gaId, {
        page_path: url,
        page_language: language,
      });
    }
  }, [pathname, searchParams, consented, gaId]);

  if (!gaId || !consented) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// ============================================================
// Custom Event Trackers
// ============================================================
// ใช้สำหรับติดตาม events เฉพาะของ SiamHeritage
// ============================================================

/**
 * Track translation events
 */
export function trackTranslationEvent(
  action: "tier1_publish" | "tier2_jit_trigger" | "tier2_summary" | "tier2_jit_complete",
  data: {
    slug: string;
    locale: string;
    model?: string;
  }
) {
  if (typeof window === "undefined" || typeof window.gtag === "undefined") return;

  window.gtag("event", "translation", {
    event_category: "Translation",
    event_label: `${action}_${data.locale}_${data.slug}`,
    value: 1,
    ...data,
  });
}

/**
 * Track language switching
 */
export function trackLanguageSwitch(fromLocale: string, toLocale: string) {
  if (typeof window === "undefined" || typeof window.gtag === "undefined") return;

  window.gtag("event", "language_switch", {
    event_category: "Language",
    event_label: `${fromLocale}_to_${toLocale}`,
    from_language: fromLocale,
    to_language: toLocale,
  });
}

/**
 * Track article read (with translation status)
 */
export function trackArticleRead(slug: string, locale: string, translationStatus: string) {
  if (typeof window === "undefined" || typeof window.gtag === "undefined") return;

  window.gtag("event", "article_read", {
    event_category: "Article",
    event_label: `${locale}/${slug}`,
    article_slug: slug,
    article_language: locale,
    translation_status: translationStatus,
  });
}

/**
 * Track SEO performance (which language drives traffic)
 */
export function trackSEOPerformance(locale: string, seoTitle: string) {
  if (typeof window === "undefined" || typeof window.gtag === "undefined") return;

  window.gtag("event", "seo_impression", {
    event_category: "SEO",
    event_label: `${locale}_${seoTitle?.slice(0, 50)}`,
    language: locale,
  });
}

