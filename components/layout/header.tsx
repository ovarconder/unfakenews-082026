"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { getVisibleLocales, LOCALE_NAMES } from "@/lib/locales";
import { Menu, X, Globe, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

interface HeaderProps {
  locale: Locale;
}

// Key เดียวกับที่ admin ใช้
const SESSION_KEY = "siam_admin_session";

function switchLocale(pathname: string, currentLocale: Locale, newLocale: Locale): string {
  // แทนที่เฉพาะภาษาแรกใน path ไม่ใช่ทุกตำแหน่ง
  return pathname.replace(/^\/\w+/, `/${newLocale}`);
}

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const settings = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";
  const logoUrl = settings?.logoFull || settings?.logo || "/images/logo/SiamHeritage-logo-gradient-128.png";

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
  const supportLink = { label: "☕ สนับสนุน", href: `/${locale}/support` };

  const currentLangName = LOCALE_NAMES[locale]?.native || locale.toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 transition-colors"
          >
            <img src={logoUrl} alt={siteName} className="w-8 h-8" />
            <span className="font-thai text-lg font-bold tracking-wide hidden sm:block text-white hover:text-amber-200 transition-colors">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-amber-300"
                    : "text-white/70 hover:text-amber-200"
                }`}
              >
                {t(link.key, locale)}
              </Link>
            ))}
            <Link
              href={supportLink.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300/30 text-amber-300 text-sm font-medium hover:bg-amber-300/10 transition-colors"
            >
              {supportLink.label}
            </Link>

            {/* Admin Dashboard link (เฉพาะ admin) */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300/40 text-amber-300 text-sm font-medium hover:bg-amber-300/10 transition-colors"
              >
                <LayoutDashboard size={14} />
                Admin
              </Link>
            )}

            {/* Login / Logout */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 text-white/80 text-sm font-medium hover:bg-white/10 hover:text-amber-200 transition-all"
              >
                <LogOut size={14} />
                ออกจากระบบ
              </button>
            ) : (
              <Link
                href="/admin/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 text-white/80 text-sm font-medium hover:bg-white/10 hover:text-amber-200 transition-all"
              >
                <LogIn size={14} />
                เข้าสู่ระบบ
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
                    {getVisibleLocales().map((l) => (
                      <Link
                        key={l}
                        href={switchLocale(pathname, locale, l)}
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-amber-300"
                    : "text-white/70 hover:text-amber-200"
                }`}
              >
                {t(link.key, locale)}
              </Link>
            ))}
            <Link
              href={supportLink.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
            >
              {supportLink.label}
            </Link>

            {/* Mobile Admin Dashboard link (เฉพาะ admin) */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard size={16} /> Admin Dashboard
                </span>
              </Link>
            )}

            {/* Mobile Login / Logout */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 text-sm font-medium text-white/80 hover:text-amber-200 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={16} /> ออกจากระบบ
                </span>
              </button>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-white/80 hover:text-amber-200 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <LogIn size={16} /> เข้าสู่ระบบ
                </span>
              </Link>
            )}

            {/* Mobile Language Switcher */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">
                {t("lang.switchTo", locale)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {getVisibleLocales().map((l) => (
                  <Link
                    key={l}
                    href={switchLocale(pathname, locale, l)}
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
