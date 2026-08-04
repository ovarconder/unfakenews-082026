import type { Metadata } from "next";
import { getSettings } from "@/lib/site-settings";
import type { Locale } from "@/lib/locales";
import { ALL_LOCALES, getActiveLocales, getVisibleLocales, isDisabled, LOCALE_NAMES } from "@/lib/locales";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SettingsProvider } from "@/components/admin/settings-context";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { AdSenseScript } from "@/components/analytics/adsense";
import { MaintenancePage } from "@/components/ui/maintenance-page";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

// Must read fresh settings from DB on every request so dynamic values
// (favicon, meta, colors, support...) are never statically cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

// Generate metadata with dynamic settings from DB
export async function generateMetadata({ params }: LangLayoutProps): Promise<Metadata> {
  const { lang } = await params;

  // Validate locale
  const locale = ALL_LOCALES.includes(lang as Locale) ? (lang as Locale) : null;
  if (!locale) return {};

  const settings = await getSettings();
  const baseUrl = settings?.url || process.env.NEXT_PUBLIC_SITE_URL || "https://unfakenews.asia";

  // Build alternate language links (hreflang) — only active (non-disabled) locales
  const activeLocales = getActiveLocales();
  const alternates: Record<string, string> = {};
  for (const l of activeLocales) {
    const hreflang = l === "en" ? "en" : l;
    alternates[hreflang] = `${baseUrl}/${l}`;
  }
  alternates["x-default"] = `${baseUrl}/en`;

  return {
    title: settings.metaTitle,
    description: settings.metaDescription,
    icons: { icon: settings.favicon },
    other: {
      "data-favicon": settings.favicon,
    },
    openGraph: {
      title: settings.ogTitle,
      description: settings.ogDescription,
      url: `${baseUrl}/${lang}`,
      siteName: settings.name,
      locale: lang === "en" ? "en_US" : lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.ogTitle,
      description: settings.ogDescription,
    },
    alternates: {
      languages: alternates,
    },
  };
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  // Validate locale — 404 if invalid, redirect to /en if disabled (Tier 0)
  if (!ALL_LOCALES.includes(lang as Locale)) {
    notFound();
  }

  if (isDisabled(lang as Locale)) {
    // ถ้าภาษาถูกปิด — redirect กลับไป /en แทนการ 404
    redirect("/en");
  }

  const locale = lang as Locale;

  // Check maintenance mode from settings
  const settings = await getSettings();
  // [DEBUG] ดูค่าที่ layout อ่านได้
  console.log("[lang/layout] favicon =", settings.favicon);
  
  if (settings.maintenanceMode) {
    return (
      <html lang={locale} suppressHydrationWarning>
        <body className="antialiased bg-[#0d1b2a] text-white">
          <link rel="icon" href={settings.favicon} data-dynamic-favicon />
          <MaintenancePage 
            message={settings.maintenanceMessage} 
            locale={locale} 
          />
        </body>
      </html>
    );
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased bg-[#0d1b2a] text-white">
        <link rel="icon" href={settings.favicon} data-dynamic-favicon />
        <SettingsProvider>
          <Suspense fallback={null}>
            <GoogleAnalytics />
            <CookieConsent />
            <AdSenseScript />
          </Suspense>
          <Header locale={locale} />
          <main className="min-h-screen">{children}</main>
          <Footer locale={locale} />
        </SettingsProvider>
      </body>
    </html>
  );
}

