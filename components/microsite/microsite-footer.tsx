// ============================================================
// Microsite Footer
// ============================================================

"use client";

import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import type { Microsite, MicrositeSettings } from "@/lib/microsite-types";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface MicrositeFooterProps {
  locale: Locale;
  microsite: Microsite;
  settings: MicrositeSettings | null;
}

export function MicrositeFooter({ locale, microsite, settings }: MicrositeFooterProps) {
  const siteName = microsite.name;
  const primaryColor = settings?.primaryColor || "#fbbf24";
  const logoUrl = microsite.logo_url || "/images/logo/unfakenews-logo.png";
  const micrositePrefix = `/${microsite.slug}/${locale}`;

  return (
    <footer className="border-t border-white/10"
      style={{ backgroundColor: settings?.backgroundColorSecondary || '#0a1628' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={logoUrl}
                alt={siteName}
                className="w-8 h-8"
              />
              <span className="text-white font-heading text-lg font-bold">
                {siteName}
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              {microsite.description || t("footer.powered", locale)}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {locale === "th" ? "เมนู" : "Menu"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={micrositePrefix}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.home", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`${micrositePrefix}/articles`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.articles", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`${micrositePrefix}/about`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.about", locale)}
                </Link>
              </li>
            </ul>
          </div>

          {/* Main Site Link */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {locale === "th" ? "ไซต์หลัก" : "Main Site"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}`}
                  className="flex items-center gap-1.5 text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  <ExternalLink size={12} />
                  {locale === "th" ? "อันเฟคนิวส์" : "UnFake News"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} {siteName}. {t("footer.copyright", locale)}
          </p>
        </div>
      </div>
    </footer>
  );
}