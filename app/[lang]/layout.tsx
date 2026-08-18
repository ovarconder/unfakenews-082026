import type { Metadata } from "next";
import { Noto_Serif, Playfair_Display, Prompt, Noto_Sans_Thai, Kanit } from "next/font/google";
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

// ============================================================
// Fonts — นิยามใหม่ใน segment layout นี้ เพราะ `app/[lang]/layout.tsx`
// render <html>/<body> ใหม่เอง ทำให้ variable classes (`--font-prompt` ฯลฯ)
// ของ root layout ถูกแทนที่หายไป ถ้าไม่ใส่ไว้ตรงนี้ font จะไม่ถูกใช้งานจริง
// ============================================================

const notoSerif = Noto_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-serif",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const prompt = Prompt({
  subsets: ["thai", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

const kanit = Kanit({
  subsets: ["thai", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

const FONT_CLASSES = `${notoSerif.variable} ${playfairDisplay.variable} ${prompt.variable} ${notoSansThai.variable} ${kanit.variable}`;

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
  
  if (settings.maintenanceMode) {
    return (
      <html lang={locale} suppressHydrationWarning>
        <body className={`${FONT_CLASSES} antialiased bg-[#0d1b2a] text-white`}>
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
      <body className={`${FONT_CLASSES} antialiased bg-[#0d1b2a] text-white`}>
        <link rel="icon" href={settings.favicon} data-dynamic-favicon />
        <SettingsProvider>
          <Suspense fallback={null}>
            {/* ส่ง GA ID จาก server (อ่านจาก DB) — จะ load script ทันทีจากค่าจริงใน database
                ถ้าไม่ตั้งค่า GA ใน DB จะ fallback ไป env var / client settings */}
            <GoogleAnalytics gaId={settings.googleAnalyticsId} />
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
