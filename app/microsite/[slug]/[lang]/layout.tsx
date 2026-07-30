// ============================================================
// Microsite Layout — มี Header + Footer เฉพาะของ microsite
// ============================================================
// แต่ละ microsite มีธีม/สี/navigation ของตัวเอง
// แต่ยังคง use session + ระบบภาษา 15 ภาษาเหมือน main site
// ============================================================

import { getMicrositeBySlug, getMergedMicrositeSettings } from "@/lib/microsite-service";
import { getLocale, ALL_LOCALES, type Locale, setLocaleTiers } from "@/lib/locales";
import { getSettings } from "@/lib/site-settings";
import { MicrositeHeader } from "@/components/microsite/microsite-header";
import { MicrositeFooter } from "@/components/microsite/microsite-footer";
import { SettingsProvider } from "@/components/admin/settings-context";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { AdSenseScript } from "@/components/analytics/adsense";
import { MaintenancePage } from "@/components/ui/maintenance-page";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // Dynamic — ไม่ generate static เพราะ microsites เปลี่ยนตาม DB
  return [];
}

// Dynamic params for microsite routes
export const dynamicParams = true;

export default async function MicrositeLangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang } = await params;
  const locale = getLocale(lang);
  
  // ตรวจสอบว่า microsite มีอยู่จริง
  const microsite = await getMicrositeBySlug(slug);
  if (!microsite || !microsite.is_active) {
    notFound();
  }

  // ใช้ getMergedMicrositeSettings เพื่อ resolve inherit + localeTiers
  const microSettings = await getMergedMicrositeSettings(microsite);

  // Sync locale tiers from microsite settings to locales.ts runtime cache
  if (microSettings?.localeTiers) {
    setLocaleTiers(microSettings.localeTiers);
  }

  // Check maintenance mode from main site settings
  const mainSettings = await getSettings();
  
  if (mainSettings.maintenanceMode) {
    return (
      <MaintenancePage 
        message={mainSettings.maintenanceMessage} 
        locale={locale} 
      />
    );
  }

  return (
    <SettingsProvider>
      {/* Analytics + AdSense + Cookie Consent (เหมือน main site) */}
      <Suspense fallback={null}>
        <GoogleAnalytics />
        <CookieConsent />
        <AdSenseScript />
      </Suspense>

      {/* Inject CSS variables สำหรับธีมของ microsite นี้ */}
      <style>{`
        :root {
          --ms-primary: ${microSettings?.primaryColor || "#fbbf24"};
          --ms-bg: ${microSettings?.backgroundColor || "#060e1a"};
          --ms-bg-secondary: ${microSettings?.backgroundColorSecondary || "#0a1628"};
          --ms-card: ${microSettings?.cardColor || "#0f1f3a"};
          --ms-text: #ffffff;
          --ms-text-muted: rgba(255,255,255,0.5);
        }
      `}</style>
      
      <MicrositeHeader 
        locale={locale} 
        microsite={microsite!} 
        settings={microSettings}
      />
      <main>{children}</main>
      <MicrositeFooter 
        locale={locale} 
        microsite={microsite!}
        settings={microSettings}
      />
    </SettingsProvider>
  );
}