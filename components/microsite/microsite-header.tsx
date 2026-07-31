// ============================================================
// Microsite Header
// ============================================================
// Navbar เฉพาะของ microsite
// - มี logo/name ของตัวเอง
// - มีลิงก์ไป main site (optional)
// - มี navigation links ของตัวเอง
// - มี language switcher (15 ภาษา)
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { ALL_LOCALES, LOCALE_NAMES, getLocaleTiers } from "@/lib/locales";
import type { Microsite, MicrositeSettings } from "@/lib/microsite-types";
import { Menu, X, Globe, ExternalLink } from "lucide-react";

interface MicrositeHeaderProps {
  locale: Locale;
  microsite: Microsite;
  settings: MicrositeSettings | null;
}

function switchLocale(pathname: string, currentSlug: string, currentLocale: Locale, newLocale: Locale): string {
  // pathname = /thai-defend/th/articles/xxx
  // slug = thai-defend
  // Need to replace locale segment
  const parts = pathname.split("/").filter(Boolean);
  // parts[0] is the microsite slug (because of rewrite)
  // parts[1] is the locale
  if (parts.length >= 2 && (ALL_LOCALES as readonly string[]).includes(parts[1])) {
    parts[1] = newLocale;
  }
  return "/" + parts.join("/");
}

export function MicrositeHeader({ locale, microsite, settings }: MicrositeHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const siteName = microsite.name;
  const logoUrl = microsite.logo_url || "/images/logo/unfakenews-logo.png";
  const primaryColor = settings?.primaryColor || "#fbbf24";

  // Extract the actual path for route detection
  // Due to rewrite, pathname is /microsite/{slug}/{lang}/...
  const pathSegments = pathname.split("/").filter(Boolean);
  const actualSlug = microsite.slug;
  const currentLang = locale;
  
  // Build routes for this microsite
  const micrositePrefix = `/${actualSlug}/${currentLang}`;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === micrositePrefix) return pathname === path || pathname === `/microsite/${actualSlug}/${currentLang}`;
    return pathname.startsWith(path) || pathname.startsWith(`/microsite/${actualSlug}/${currentLang}${path.replace(micrositePrefix, '')}`);
  };

  const navLinks = [
    { href: micrositePrefix, key: "nav.home" as const },
    { href: `${micrositePrefix}/articles`, key: "nav.articles" as const },
    { href: `${micrositePrefix}/about`, key: "nav.about" as const },
  ];

  // Add custom nav links from microsite settings
  if (microsite.custom_nav_links) {
    const customLinks = Array.isArray(microsite.custom_nav_links) 
      ? microsite.custom_nav_links 
      : [];
    customLinks.forEach((link: any) => {
      const label = link.locale_specific?.[locale]?.label || link.label;
      navLinks.push({
        href: link.href.startsWith("/") 
          ? `${micrositePrefix}${link.href.startsWith(`/${locale}`) ? link.href.replace(`/${locale}`, '') : link.href}`
          : link.href,
        key: label as any,
      });
    });
  }

  const currentLangName = LOCALE_NAMES[locale]?.native || locale.toUpperCase();

  // Filter languages by tier 1 (what should be shown in header)
  const visibleLocales = ALL_LOCALES.filter(l => {
    const tiers = getLocaleTiers();
    return tiers[l] === "1";
  });
  // Ensure current locale is always shown even if tier 2
  if (!visibleLocales.includes(locale)) {
    visibleLocales.push(locale);
  }

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
      style={{ 
        backgroundColor: settings?.backgroundColor ? `${settings.backgroundColor}E6` : '#0a1628E6',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${actualSlug}/${locale}`}
            className="flex items-center gap-2 transition-colors"
          >
            <img
              src={logoUrl}
              alt={siteName}
              className="w-8 h-8"
            />
            <span className="font-thai text-lg font-bold tracking-wide hidden sm:block text-white hover:text-amber-200 transition-colors">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-amber-300"
                    : "text-white/70 hover:text-amber-200"
                }`}
              >
                {(typeof link.key === 'string' && !link.key.startsWith('nav.')) ? link.key : t(link.key as any, locale)}
              </Link>
            ))}

            {/* Link to Main Site */}
            {microsite.show_main_site_link && (
              <Link
                href={`/${locale}`}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-amber-200 transition-colors border-l border-white/10 pl-6"
              >
                <ExternalLink size={12} />
                <span>
                  {locale === "th" ? "สยามเฮอริเทจ" : "Siam Heritage"}
                </span>
              </Link>
            )}

            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-amber-200 transition-all"
              >
                <Globe size={14} />
                <span>{currentLangName}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f1f3a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50">
                  <div className="py-2 max-h-72 overflow-y-auto">
                    {visibleLocales.map((l) => (
                      <Link
                        key={l}
                        href={switchLocale(pathname, actualSlug, locale, l)}
                        onClick={() => setLangOpen(false)}
                        className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                          l === locale
                            ? "text-amber-300 bg-amber-300/10"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{LOCALE_NAMES[l]?.native || l}</span>
                        <span className="text-[10px] text-white/40">{LOCALE_NAMES[l]?.english || l}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/80 hover:text-amber-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a1628]/95 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-amber-300"
                    : "text-white/70 hover:text-amber-200"
                }`}
              >
                {(typeof link.key === 'string' && !link.key.startsWith('nav.')) ? link.key : t(link.key as any, locale)}
              </Link>
            ))}
            
            {/* Link to Main Site */}
            {microsite.show_main_site_link && (
              <Link
                href={`/${locale}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 py-2 text-xs text-white/40 hover:text-amber-200 transition-colors"
              >
                <ExternalLink size={12} />
                {locale === "th" ? "ไปยังสยามเฮอริเทจ" : "Go to Siam Heritage"}
              </Link>
            )}

            {/* Mobile Language Switcher */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">
                {t("lang.switchTo", locale)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {visibleLocales.map((l) => (
                  <Link
                    key={l}
                    href={switchLocale(pathname, actualSlug, locale, l)}
                    onClick={() => setMobileOpen(false)}
                    className={`px-2 py-1.5 rounded-md text-xs text-center transition-colors ${
                      l === locale
                        ? "bg-amber-300/20 text-amber-300 border border-amber-300/30"
                        : "text-white/60 hover:text-white border border-white/10 hover:border-white/30"
                    }`}
                  >
                    {LOCALE_NAMES[l]?.native || l}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}