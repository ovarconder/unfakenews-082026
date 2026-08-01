"use client";

import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import Link from "next/link";
import { useSettings } from "@/components/admin/settings-context";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const settings = useSettings();
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";
  const copyright = settings?.copyright || `© ${new Date().getFullYear()} Vibe. All rights reserved.`;
  const logoInitial = siteName.charAt(0).toUpperCase();
  return (
    <footer className="bg-[#0a1628] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-300/20 flex items-center justify-center">
                <span className="text-amber-300 font-heading font-bold">{logoInitial}</span>
              </div>
              <span className="text-white font-heading text-lg font-bold">
                {siteName}
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              {t("footer.powered", locale)}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              "Menu"
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.home", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.about", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/articles`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.articles", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  {t("nav.contact", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-white/60 hover:text-amber-200 text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              "Language"
            </h3>
            <div className="flex gap-3">
              <Link
                href={`/th`}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  locale === "en"
                    ? "bg-amber-300/20 text-amber-300 border border-amber-300/30"
                    : "text-white/60 hover:text-white border border-white/10 hover:border-white/30"
                }`}
              >
                ภาษาไทย
              </Link>
              <Link
                href={`/en`}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  locale === "en"
                    ? "bg-amber-300/20 text-amber-300 border border-amber-300/30"
                    : "text-white/60 hover:text-white border border-white/10 hover:border-white/30"
                }`}
              >
                English
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

