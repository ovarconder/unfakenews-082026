// ============================================================
// Google AdSense Component
// ============================================================
// ใช้ค่า adsenseId จาก:
// 1. prop `adsenseId` (ส่งจาก layout)
// 2. Settings DB (useSettings context)
// 3. Environment Variable: NEXT_PUBLIC_ADSENSE_ID
// ถ้าไม่ได้ set จะไม่ render อะไร
//
// Features:
// - AdSenseScript: โหลด adsbygoogle.js ใน <head> (แค่ครั้งเดียว)
// - AdUnit: วางโฆษณา responsive auto-fill
// - AdUnitFixed: วางโฆษณาแบบ fixed size
//
// วิธีใช้:
// 1. ใส่ค่าใน /admin/settings → AdSense Section
// 2. วาง <AdSenseScript /> ใน [lang]/layout.tsx
// 3. วาง <AdUnit slot="XXXX" /> ตรงที่ต้องการ
// ============================================================

"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useSettings } from "@/components/admin/settings-context";

// ============================================================
// Type declaration for window.adsbygoogle
// ============================================================

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

// ============================================================
// AdSense Script (วางใน layout.tsx แค่ครั้งเดียว)
// ============================================================
// ใช้ adsenseId จาก Settings (DB) ถ้าไม่มี fallback env var
// ============================================================

export function AdSenseScript({ adsenseId: propId }: { adsenseId?: string }) {
  const settings = useSettings();
  // Resolve AdSense ID: prop > Settings DB > env var
  const adsenseId = propId || settings?.adsenseId || process.env.NEXT_PUBLIC_ADSENSE_ID;
  if (!adsenseId) return null;

  return (
    <Script
      id="adsense-init"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      crossOrigin="anonymous"
      onError={(e) => {
        console.warn("[AdSense] Failed to load:", e);
      }}
    />
  );
}

// ============================================================
// Ad Unit — Responsive (auto-fill container)
// ============================================================
// ใช้ <AdUnit slot="1234567890" />
// หรือ <AdUnit slot="1234567890" className="md:max-w-[728px] mx-auto" />
// ============================================================

interface AdUnitProps {
  slot: string;
  adsenseId?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
}

export function AdUnit({
  slot,
  adsenseId: propId,
  format = "auto",
  className = "",
  style,
}: AdUnitProps) {
  const settings = useSettings();
  const adsenseId = propId || settings?.adsenseId || process.env.NEXT_PUBLIC_ADSENSE_ID;
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (insRef.current && adsenseId) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("[AdSense] Push error:", e);
      }
    }
  }, [adsenseId]);

  if (!adsenseId) return null;

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: "block",
          ...(format === "auto" ? {} : format === "rectangle" ? { width: "300px", height: "250px" } : {}),
          ...style,
        }}
        data-ad-client={adsenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ============================================================
// Ad Unit — Fixed size (สำหรับตำแหน่งเฉพาะ)
// ============================================================

interface AdUnitFixedProps {
  slot: string;
  width: number;
  height: number;
  adsenseId?: string;
  className?: string;
}

export function AdUnitFixed({
  slot,
  width,
  height,
  adsenseId: propId,
  className = "",
}: AdUnitFixedProps) {
  const settings = useSettings();
  const adsenseId = propId || settings?.adsenseId || process.env.NEXT_PUBLIC_ADSENSE_ID;
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (insRef.current && adsenseId) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("[AdSense] Push error:", e);
      }
    }
  }, [adsenseId]);

  if (!adsenseId) return null;

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: "inline-block",
          width: `${width}px`,
          height: `${height}px`,
        }}
        data-ad-client={adsenseId}
        data-ad-slot={slot}
      />
    </div>
  );
}

