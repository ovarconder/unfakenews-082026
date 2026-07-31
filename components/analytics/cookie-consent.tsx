// ============================================================
// Cookie Consent Banner
// ============================================================
// แสดง banner ขอความยินยอมจากผู้ใช้ก่อนใช้ Google Analytics
// รองรับทุกภาษา (15 ภาษา)
// เมื่อผู้ใช้กด "Accept" จะค่อยโหลด Google Analytics
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocale, type Locale } from "@/lib/locales";

const COOKIE_CONSENT_KEY = "unfakenews_cookie_consent";

// ============================================================
// Cookie Consent Translations (15 languages)
// ============================================================

type ConsentTranslationKey =
  | "consent.title"
  | "consent.message"
  | "consent.accept"
  | "consent.decline"
  | "consent.privacyLink";

const consentTranslations: Record<ConsentTranslationKey, Partial<Record<Locale, string>>> = {
  "consent.title": {
    en: "🔒 Privacy Settings",
  },
  "consent.message": {
    en: "We use Google Analytics cookies to analyze and improve your browsing experience. Please accept to help us grow. Thank you for supporting us! 🙏",
  },
  "consent.accept": {
    en: "✅ Accept",
  },
  "consent.decline": {
    en: "❌ Decline",
  },
  "consent.privacyLink": {
    en: "Privacy Policy",
  },
};

function ct(key: ConsentTranslationKey, locale: Locale): string {
  const map = consentTranslations[key];
  if (!map) return key;
  if (map[locale]) return map[locale]!;
  if (map["en"]) return map["en"]!;
  return key;
}

// ============================================================
// Cookie Consent Component
// ============================================================

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    // Detect locale from path
    const langMatch = pathname?.match(/^\/([a-z]{2})(\/|$)/);
    const detected = langMatch ? getLocale(langMatch[1]) : "en";
    setLocale(detected);

    // Check if user already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // แสดง banner ช้าหน่อยเพื่อไม่ให้รบกวนการโหลดครั้งแรก
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
    // Reload to activate Google Analytics (scripts will run on next load)
    // Or we can dynamically initialize GA here
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0f1f3a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
          {/* Title */}
          <h3 className="text-white font-heading font-semibold text-sm mb-2">
            {ct("consent.title", locale)}
          </h3>

          {/* Message */}
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            {ct("consent.message", locale)}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAccept}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0a1628] text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {ct("consent.accept", locale)}
            </button>
            <button
              onClick={handleDecline}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-xl border border-white/10 transition-all duration-200"
            >
              {ct("consent.decline", locale)}
            </button>
            <a
              href={`/${locale}/privacy`}
              className="text-amber-300/70 hover:text-amber-200 text-xs underline underline-offset-2 ml-auto transition-colors"
            >
              {ct("consent.privacyLink", locale)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

