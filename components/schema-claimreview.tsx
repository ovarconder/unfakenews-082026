import type { Locale } from "@/lib/locales";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

// ============================================================
// Schema.org ClaimReview — Structured data สำหรับ Fact-Check
// ============================================================
// ตาม Spesifikasi Google Fact Check / ClaimReview
// (https://developers.google.com/search/docs/appearance/structured-data/factcheck)
//
// field ที่ "บังคับ" ตาม schema:
//   itemReviewed       — สิ่งที่ถูกตรวจสอบ (Claim)
//   claimReviewed      — ข้อความ/หัวข้อของ claim
//   author             — ผู้ตรวจสอบ (Reviewer) = publisher ของเว็บ
//   datePublished      — วันที่ออกผลตรวจสอบ ต่อ variant ภาษา
//   reviewRating       — rating scale เช่น 1-5
//   url                — URL ของบทความ variant นี้
//
// คุณสมบัติที่รองรับตาม spec ของโปรเจกต์:
//   inLanguage / dateModified — สะท้อนการ release ของ variant ภาษานั้น
// ============================================================

interface SchemaClaimReviewProps {
  /** URL เต็มของ variant ภาษานี้ เช่น https://x.com/en/articles/slug */
  url: string;
  /** ภาษาของ variant นี้ (inLanguage) */
  locale: Locale;
  /** ชื่อบทความ (ภาษา variant) — ใช้เป็น claimReviewed / headline */
  headline: string;
  /** คำอธิบาย/abstract ของ variant */
  description?: string;
  /** วันที่ variant นี้เผยแพร่จริง (per-language release date) */
  datePublished: string;
  /** วันที่แก้ไขล่าสุดต่อ variant */
  dateModified?: string;
  /** ผลตรวจสอบ — default "true" (ตรวจสอบข้อเท็จจริง) */
  claimResult?: "True" | "False" | "Mixture" | "Unsubstantiated";
  /** ขนาด scale ของ rating (default 5) */
  ratingScale?: number;
  /** rating value (default 5 = true) */
  ratingValue?: number;
}

export function SchemaClaimReview({
  url,
  locale,
  headline,
  description,
  datePublished,
  dateModified,
  claimResult = "True",
  ratingScale = 5,
  ratingValue = 5,
}: SchemaClaimReviewProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url: url,
    datePublished: datePublished,
    ...(dateModified ? { dateModified } : {}),
    inLanguage: locale,
    itemReviewed: {
      "@type": "Claim",
      author: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      datePublished: datePublished,
      name: headline,
      ...(description ? { text: description } : {}),
    },
    claimReviewed: headline,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: ratingValue,
      bestRating: ratingScale,
      alternateName: claimResult,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
      data-schema="claimreview"
    />
  );
}
