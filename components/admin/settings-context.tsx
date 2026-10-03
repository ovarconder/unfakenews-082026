"use client";
// ============================================================
// Settings Context — ให้ client components เข้าถึง site settings
// และ apply เป็น CSS custom properties (CSS variables) ที่ <html>
// ============================================================

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { SiteSettings } from "@/lib/site-settings";

const SettingsContext = createContext<SiteSettings | null>(null);

// ค่า default (ตรงกับที่ใช้ใน Tailwind / globals.css)
const DEFAULT_COLORS: Record<string, string> = {
  "--color-primary": "#fbbf24",
  "--color-secondary": "#f59e0b",
  "--color-accent": "#d97706",
  "--color-bg": "#060e1a",
  "--color-bg-secondary": "#0a1628",
  "--color-card": "#0f1f3a",
  "--color-card-border": "rgba(255,255,255,0.1)",
  "--color-text": "#ffffff",
  "--color-text-muted": "rgba(255,255,255,0.5)",
  "--color-sidebar": "#0a1628",
  "--color-header": "#060e1a",
  "--color-success": "#10b981",
  "--color-error": "#ef4444",
};

const DEFAULT_RGB: Record<string, string> = {
  "--color-primary-rgb": "251 191 36",
  "--color-secondary-rgb": "245 158 11",
  "--color-accent-rgb": "217 119 6",
  "--color-bg-rgb": "6 14 26",
  "--color-bg-secondary-rgb": "10 22 40",
  "--color-card-rgb": "15 31 58",
  "--color-text-rgb": "255 255 255",
  "--color-success-rgb": "16 185 129",
  "--color-error-rgb": "239 68 68",
  "--color-header-rgb": "6 14 26",
  "--color-sidebar-rgb": "10 22 40",
};

/**
 * แปลงค่า CSS color (hex / rgb / rgba) เป็น "R G B" channel triplet
 * เพื่อใช้กับ rgba(var(--*-rgb), alpha)
 * คืน null ถ้า parse ไม่ได้ (เช่นค่าเป็น CSS keyword)
 */
function toRgbChannels(color: string | undefined | null): string | null {
  if (!color) return null;
  const c = color.trim();

  // #rgb / #rrggbb
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }

  // rgb(r,g,b) / rgba(r,g,b,a)
  const rgb = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return `${rgb[1]} ${rgb[2]} ${rgb[3]}`;

  return null;
}

function applySettingsAsCSS(settings: SiteSettings | null) {
  const root = document.documentElement;

  const colors: Record<string, string | undefined> = settings
    ? {
        "--color-primary": settings.primaryColor,
        "--color-secondary": settings.secondaryColor,
        "--color-accent": settings.accentColor,
        "--color-bg": settings.backgroundColor,
        "--color-bg-secondary": settings.backgroundColorSecondary,
        "--color-card": settings.cardColor,
        "--color-card-border": settings.cardBorderColor,
        "--color-text": settings.textColor,
        "--color-text-muted": settings.textColorMuted,
        "--color-sidebar": settings.sidebarColor,
        "--color-header": settings.headerColor,
        "--color-success": settings.successColor,
        "--color-error": settings.errorColor,
      }
    : DEFAULT_COLORS;

  Object.entries(colors).forEach(([key, val]) => {
    if (val) root.style.setProperty(key, val);
  });

  // อัปเดต RGB channels (สำหรับ rgba(var(--color-*-rgb), alpha))
  const rgbMap: Record<string, string | undefined> = settings
    ? {
        "--color-primary-rgb": toRgbChannels(settings.primaryColor) || undefined,
        "--color-secondary-rgb": toRgbChannels(settings.secondaryColor) || undefined,
        "--color-accent-rgb": toRgbChannels(settings.accentColor) || undefined,
        "--color-bg-rgb": toRgbChannels(settings.backgroundColor) || undefined,
        "--color-bg-secondary-rgb": toRgbChannels(settings.backgroundColorSecondary) || undefined,
        "--color-card-rgb": toRgbChannels(settings.cardColor) || undefined,
        "--color-text-rgb": toRgbChannels(settings.textColor) || undefined,
        "--color-success-rgb": toRgbChannels(settings.successColor) || undefined,
        "--color-error-rgb": toRgbChannels(settings.errorColor) || undefined,
        "--color-header-rgb": toRgbChannels(settings.headerColor) || undefined,
        "--color-sidebar-rgb": toRgbChannels(settings.sidebarColor) || undefined,
      }
    : DEFAULT_RGB;

  Object.entries(rgbMap).forEach(([key, val]) => {
    if (val) root.style.setProperty(key, val);
  });
}

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  /** ค่าที่ inject จาก server เพื่อลด FOUC (สีกระพริบ) — optional */
  initialSettings?: SiteSettings | null;
}) {
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings ?? null);

  // Apply ค่าจาก server ทันที (ก่อน fetch) เพื่อลด FOUC
  useEffect(() => {
    applySettingsAsCSS(initialSettings ?? null);
  }, [initialSettings]);

  useEffect(() => {
    // ใช้ public endpoint (ไม่ต้องล็อกอิน) เพื่อให้ผู้ใช้ทั่วไปได้ค่า theme จริง
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setSettings(data.settings);
          applySettingsAsCSS(data.settings);
        }
      })
      .catch(() => {
        console.warn("[Settings] Failed to load from API, using defaults");
        applySettingsAsCSS(null);
      });
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SiteSettings | null {
  return useContext(SettingsContext);
}
