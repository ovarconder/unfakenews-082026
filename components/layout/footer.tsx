"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { getVisibleLocales, LOCALE_NAMES } from "@/lib/locales";
import Link from "next/link";
import { useSettings } from "@/components/admin/settings-context";

interface FooterProps {
  locale: Locale;
}

interface FooterCategory {
  id: string;
  slug: string;
  name: string;
}

export function Footer({ locale }: FooterProps) {
  const settings = useSettings();
  const [footerCategories, setFooterCategories] = useState<FooterCategory[]>([]);
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";
  const copyright = settings?.copyright || `© ${new Date().getFullYear()} Vibe. All rights reserved.`;
  const logoInitial = siteName.charAt(0).toUpperCase();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/categories?locale=${encodeURIComponent(locale)}&scope=footer`)
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.categories)) {
          setFooterCategories(data.categories);
        }
      })
      .catch(() => {
        // footer categories เป็น optional — ignore error
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <footer className="bg-brand-bg-secondary border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                <span className="text-brand-primary font-heading font-bold">{logoInitial}</span>
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
              {t("footer.menu", locale)}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("nav.home", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("nav.about", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/articles`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("nav.articles", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("nav.contact", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("footer.privacy", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("footer.terms", locale)}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/support`}
                  className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                >
                  {t("footer.support", locale)}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories (show_at_footer = true) */}
          {footerCategories.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {t("articles.category", locale)}
              </h3>
              <ul className="space-y-2">
                {footerCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/${locale}/articles?category=${encodeURIComponent(cat.name)}`}
                      className="text-white/60 hover:text-brand-primary text-sm transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Language */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t("lang.language", locale)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {getVisibleLocales().map((l) => (
                <Link
                  key={l}
                  href={`/${l}`}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    locale === l
                      ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                      : "text-white/60 hover:text-white border border-white/10 hover:border-white/30"
                  }`}
                >
                  {LOCALE_NAMES[l]?.native || l}
                </Link>
              ))}
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
