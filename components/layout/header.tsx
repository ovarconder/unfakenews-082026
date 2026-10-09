"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { getVisibleLocales, LOCALE_NAMES, ALL_LOCALES } from "@/lib/locales";
import { Menu, X, Globe, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

interface HeaderProps {
  locale: Locale;
}

// Key เดียวกับที่ admin ใช้
const SESSION_KEY = "siam_admin_session";

// Regex ตรวจจับหน้า article detail: /{locale}/articles/{slug}
const ARTICLE_DETAIL_REGEX = /^\/[a-z]{2}\/articles\/[^/]+$/i;

function switchLocale(pathname: string, currentLocale: Locale, newLocale: Locale): string {
  // แทนที่เฉพาะภาษาแรกใน path ไม่ใช่ทุกตำแหน่ง
  return pathname.replace(/^\/\w+/, `/${newLocale}`);
}

// ดึง slug จาก pathname ของหน้า article detail
function getArticleSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/[a-z]{2}\/articles\/([^/]+)$/i);
  return match ? match[1] : null;
}

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const settings = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // ★ published locales ของบทความปัจจุบัน (เฉพาะหน้า article detail)
  //    — แยกย่อยตาม SLUG: แสดงเฉพาะภาษาที่ slug นั้นมี translation เผยแพร่จริง
  const [articleLocales, setArticleLocales] = useState<Locale[] | null>(null);

  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";
  // ใช้ logo (field ที่บันทึกใน settings page) เป็นหลัก ก่อน logoFull
  // ถ้าไม่มีค่าจริงเลย ให้ fallback เป็นโลโก้ในเครื่องของเว็บนี้ (ห้าม hardcode URL เว็บอื่น)
  const logoUrl =
    settings?.logo?.trim() ||
    settings?.logoFull?.trim() ||
    process.env.NEXT_PUBLIC_SITE_LOGO ||
    "/images/logo/unfakenews-logo-360.png";

  // ★ ข้อความชื่อเว็บข้างโลโก้ (แสดงเฉพาะจอใหญ่) — ผู้ดูแลกำหนดได้ในหน้า Settings
  const logoText = settings?.logoText?.trim() || "";
  const logoTextFont = settings?.logoTextFont?.trim() || "";
  const logoTextColor = settings?.logoTextColor?.trim() || "";

  // ★ สีข้อความ/เมนูใน Header — ผู้ดูแลกำหนดได้ในหน้า Settings
  //    ตั้งเป็น CSS variable inline บน <header> แล้วให้ข้อความ/ไอคอนอ่านค่าผ่าน
  //    utility `headerTextClass` (มี fallback เป็นขาวเดิม เผื่อยังไม่ตั้งค่า)
  const headerTextColor = settings?.headerTextColor?.trim() || undefined;
  const headerStyle = headerTextColor
    ? ({ ["--header-text" as string]: headerTextColor } as React.CSSProperties)
    : undefined;
  const headerTextClass = "text-[color:var(--header-text,#ffffff)]";

  // ตรวจสถานะ login + role จาก sessionStorage (admin ใช้ key นี้)
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    setIsLoggedIn(!!raw);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setIsAdmin(user?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    }
  }, []);

  // ★ เมื่ออยู่หน้า article detail → ดึง published locales ของ slug นั้น
  //    ถ้าเจอ จะใช้ชุดนี้เป็นตัวเลือกภาษา (แทนที่จะเป็น generic tier1)
  const currentSlug = getArticleSlugFromPath(pathname);
  useEffect(() => {
    let cancelled = false;
    if (!currentSlug) {
      setArticleLocales(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/article-locales?slug=${encodeURIComponent(currentSlug)}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.locales)) {
          const valid = (data.locales as string[]).filter((l) =>
            ALL_LOCALES.includes(l as Locale)
          ) as Locale[];
          setArticleLocales(valid.length > 0 ? valid : null);
        }
      } catch {
        if (!cancelled) setArticleLocales(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    window.location.href = "/admin/logout";
  };

  // Close language menu when clicking outside
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
    if (path === `/${locale}`) return pathname === path;
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: `/${locale}`, key: "nav.home" as const },
    { href: `/${locale}/about`, key: "nav.about" as const },
    { href: `/${locale}/articles`, key: "nav.articles" as const },
    { href: `/${locale}/contact`, key: "nav.contact" as const },
  ];
  // แปล language-aware: ใช้ t() เพื่อให้เปลี่ยนตาม locale
  const supportLink = { label: t("nav.support", locale), href: `/${locale}/support` };

  const currentLangName = LOCALE_NAMES[locale]?.native || locale.toUpperCase();

  // ★ ชุดภาษาที่แสดงใน switcher:
  //    - หน้า article detail ที่รู้ published locales → ใช้ชุดนั้น (แยกตาม SLUG)
  //    - หน้าอื่น → ใช้ Tier 1 ตามเดิม (getVisibleLocales)
  const switcherLocales: Locale[] =
    currentSlug && articleLocales && articleLocales.length > 0
      ? articleLocales
      : (getVisibleLocales() as Locale[]);

  // ตรวจว่า slug ปัจจุบันมี variant ในชุด switcher หรือไม่ (สำหรับ UI label)
  const isArticleDetail = ARTICLE_DETAIL_REGEX.test(pathname);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-brand-header/90 backdrop-blur-md border-b border-white/10"
      style={headerStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 transition-colors min-w-0"
          >
            <img
              src={logoUrl}
              alt={siteName}
              className="h-8 w-auto flex-shrink-0"
            />
            {/* ข้อความชื่อเว็บ — แสดงเฉพาะจอใหญ่ (mobile ไม่แสดง) */}
            {logoText && (
              <span
                className="hidden md:inline-block text-lg font-bold truncate"
                style={{
                  fontFamily: logoTextFont || undefined,
                  color: logoTextColor || undefined,
                }}
              >
                {logoText}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-brand-primary"
                    : `${headerTextClass} hover:text-brand-primary`
                }`}
              >
                {t(link.key, locale)}
              </Link>
            ))}
            <Link
              href={supportLink.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-primary/30 text-brand-primary text-sm font-medium hover:bg-brand-primary/10 transition-colors"
            >
              {supportLink.label}
            </Link>

            {/* Admin Dashboard link (เฉพาะ admin) */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-primary/40 text-brand-primary text-sm font-medium hover:bg-brand-primary/10 transition-colors"
              >
                <LayoutDashboard size={14} />
                {t("common.admin", locale)}
              </Link>
            )}

            {/* Login / Logout */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 ${headerTextClass} text-sm font-medium hover:bg-white/10 hover:text-brand-primary transition-all`}
              >
                <LogOut size={14} />
                {t("common.logout", locale)}
              </button>
            ) : (
              <Link
                href="/admin/login"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 ${headerTextClass} text-sm font-medium hover:bg-white/10 hover:text-brand-primary transition-all`}
              >
                <LogIn size={14} />
                {t("common.login", locale)}
              </Link>
            )}

            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 text-xs font-medium ${headerTextClass} hover:bg-white/10 hover:text-brand-primary transition-all`}
              >
                <Globe size={14} />
                <span>{currentLangName}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-brand-card border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50">
                  <div className="py-2 max-h-72 overflow-y-auto">
                    {isArticleDetail && currentSlug ? (
                      // แสดงเฉพาะภาษาที่ slug นี้มี ชัดเจนว่าเป็นของบทความนี้
                      <>
                        {switcherLocales.map((l) => (
                          <Link
                            key={l}
                            href={switchLocale(pathname, locale, l)}
                            onClick={() => setLangOpen(false)}
                            className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                              l === locale
                                ? "text-brand-primary bg-brand-primary/10"
                                : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span>{LOCALE_NAMES[l]?.native || l}</span>
                            <span className="text-[10px] text-white/40">{LOCALE_NAMES[l]?.english || l}</span>
                          </Link>
                        ))}
                      </>
                    ) : (
                      <>
                        {switcherLocales.map((l) => (
                          <Link
                            key={l}
                            href={switchLocale(pathname, locale, l)}
                            onClick={() => setLangOpen(false)}
                            className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                              l === locale
                                ? "text-brand-primary bg-brand-primary/10"
                                : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span>{LOCALE_NAMES[l]?.native || l}</span>
                            <span className="text-[10px] text-white/40">{LOCALE_NAMES[l]?.english || l}</span>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden ${headerTextClass} hover:text-brand-primary transition-colors`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-bg-secondary/95 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-brand-primary"
                    : `${headerTextClass} hover:text-brand-primary`
                }`}
              >
                {t(link.key, locale)}
              </Link>
            ))}
            <Link
              href={supportLink.href}
              onClick={() => setMobileOpen(false)}

              className="block py-2 text-sm font-medium text-brand-primary hover:text-brand-primary transition-colors"
            >
              {supportLink.label}
            </Link>

            {/* Mobile Admin Dashboard link (เฉพาะ admin) */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-brand-primary hover:text-brand-primary transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard size={16} /> {t("common.admin", locale)}
                </span>
              </Link>
            )}

            {/* Mobile Login / Logout */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}

                className={`block w-full text-left py-2 text-sm font-medium ${headerTextClass} hover:text-brand-primary transition-colors`}
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={16} /> {t("common.logout", locale)}
                </span>
              </button>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm font-medium ${headerTextClass} hover:text-brand-primary transition-colors`}
              >
                <span className="inline-flex items-center gap-2">
                  <LogIn size={16} /> {t("common.login", locale)}
                </span>
              </Link>
            )}

            {/* Mobile Language Switcher */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">
                {t("lang.switchTo", locale)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {switcherLocales.map((l) => (
                  <Link
                    key={l}
                    href={switchLocale(pathname, locale, l)}
                    onClick={() => setMobileOpen(false)}
                    className={`px-2 py-1.5 rounded-md text-xs text-center transition-colors ${
                      l === locale
                        ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                        : `${headerTextClass} opacity-60 hover:opacity-100 border border-white/10 hover:border-white/30`
                    }`}
                  >
                    {LOCALE_NAMES[l]?.native || l}
                  </Link>
                ))}
              </div>
              {/* หน้า article detail → ระบุว่าแสดงเฉพาะภาษาที่บทความนี้มี */}
              {isArticleDetail && currentSlug && (
                <p className="text-white/30 text-[10px] mt-2">
                  {t("lang.articleLocales", locale)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
