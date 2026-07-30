"use client";
// ============================================================
// Settings Context — ให้ client components เข้าถึง site settings
// และ apply เป็น CSS custom properties (CSS variables) ที่ <html>
// ============================================================

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { SiteSettings } from "@/lib/site-settings";

const SettingsContext = createContext<SiteSettings | null>(null);

// ค่า default (ตรงกับที่ใช้ใน Tailwind)
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

function applySettingsAsCSS(settings: SiteSettings | null) {
  const root = document.documentElement;
  const colors = settings
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
    root.style.setProperty(key, val);
  });
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings);
        applySettingsAsCSS(data.settings);
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
