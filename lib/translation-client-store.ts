// ============================================================
// Siam Heritage - Translation Client Store
// ============================================================
// ไฟล์นี้ใช้สำหรับ Client Components เท่านั้น (ไม่มี 'fs' module)
// 
// Client components (เช่น article-detail.tsx) ใช้ import จากไฟล์นี้
// แทน translation-store.ts ที่มี server-side code (fs, path)
//
// Functions เหล่านี้ใช้ cached data ที่ fetch ผ่าน API เท่านั้น
// ไม่ได้อ่าน/เขียนไฟล์โดยตรง
// ============================================================

import type { Locale } from "./locales";
import type { TranslatedArticle, TranslationStatus } from "./types";

// ============================================================
// Client-side: อ่าน Translation Cache ผ่าน API
// ============================================================
// Client components จะเรียก API endpoint เพื่ออ่าน cache
// แทนที่จะอ่านไฟล์โดยตรง (ซึ่งทำไม่ได้บน browser)
//
// Functions ข้างล่างนี้เป็น utility สำหรับจัดการข้อมูล
// ในฝั่ง client โดยไม่มี dependency กับ 'fs' module
// ============================================================

/**
 * ตรวจสอบว่า article นี้มี isFullTranslated=true หรือไม่
 * ใช้ใน Client Components
 */
export function checkIsFullTranslated(article: TranslatedArticle | null): boolean {
  if (!article) return false;
  return article.isFullTranslated === true || article.translationStatus === "complete";
}

/**
 * ตรวจสอบว่าต้องขอแปล content เพิ่มหรือไม่
 * ใช้ใน Client Components
 */
export function checkNeedsFullTranslation(article: TranslatedArticle | null): boolean {
  if (!article) return true;
  if (article.isFullTranslated === true) return false;
  return article.translationStatus !== "complete";
}

export interface FetchContentTranslationResult {
  success: boolean;
  content?: string;
  cached?: boolean;
  translatingInProgress?: boolean;
  error?: string;
  imageAltTexts?: Record<string, string>;
}

/**
 * ฟังก์ชันเรียก API เพื่อขอแปล content แบบ JIT
 * ใช้ใน Client Components
 * ส่งคืน content ที่แปลแล้ว + imageAltTexts (alt text ของรูปที่แปลแล้ว)
 */
export async function fetchContentTranslation(
  slug: string,
  locale: Locale
): Promise<FetchContentTranslationResult> {
  try {
    const response = await fetch(`/api/translate-content/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error (${response.status}): ${errorText}` };
    }

    return await response.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}
