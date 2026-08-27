// ============================================================
// Post-Publishing Automation Orchestrator
// ============================================================
// ระบบที่จะทำงาน "ภายหลัง" เมื่อ language variant หนึ่งๆ เข้าสู่สถานะ
// 'published' จริงเท่านั้น (guardrail ตาม SYSTEM PROMPT):
//
//   ✅ เงื่อนไขผ่านเมื่อ:
//      - ภาษาไทย (th): articles.status = 'published'
//      - ภาษาอื่น: translations.translation_status = 'complete'
//
//   ถ้ายังไม่ผ่านเงื่อนไข → ไม่ทำอะไร (ไม่ expose สถานะครึ่ง ๆ กลาง ๆ)
//
// ขั้นตอนเมื่อผ่าน:
//   1. (อัตโนมัติ) ข้ามการ generate claimReview ตรงนี้ — ดู schema-article.tsx
//   2. Trigger IndexNow สำหรับ URL ที่เพิ่ง publish/update
//   3. Trigger Google Indexing API สำหรับ URL นั้น
//   4. revalidatePath / revalidateTag สำหรับหน้า + หน้าที่เกี่ยวข้อง
//
// ฟังก์ชันนี้ DESIGN ให้ call ได้จากทุกจุดที่ "publish" เกิดขึ้น
// (admin edit, manual translation (translate-new), translate-all, ...)
// ============================================================

import { revalidatePath, revalidateTag } from "next/cache";
import { pingIndexNow } from "./indexnow";
import { submitUrlsToGoogle } from "./google-indexing";
import { getArticleIndexTargets } from "./seo-utils";
import { getActiveLocales } from "./locales";
import { createAdminClient } from "./supabase-server";

export interface PublishNotificationInput {
  /** article_id (UUID) หรือ slug — ตัวคั่นระบบ */
  slug: string;
  /** locale ที่เพิ่งเผยแพร่ (เช่น 'th', 'en') */
  locale: string;
  /** เดิมเป็นอะไรถ้าระบุได้ (ใช้ตรวจจับ transition) — optional */
  previousStatus?: string;
}

export interface PublishAutomationResult {
  triggered: boolean;
  publishedUrls: string[];
  indexNow: { submitted: boolean; reason?: string };
  google: { url: string; ok: boolean; reason?: string }[];
  revalidated: string[];
  skipped: boolean;
  reason?: string;
}

/**
 * ตรวจสถานะจริงจาก DB ว่า locale variant นี้ "เผยแพร่จริง" แล้วหรือยัง
 * (ยืนยันซ้ำอีกครั้งจาก DB — ไม่เชื่อ client เป็นหลัก)
 */
export async function isVariantPublished(
  slug: string,
  locale: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id, slug, status, published_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!article) return false;

  // ภาษาไทย = ต้นฉบับ ต้อง status published
  if (locale === "th") {
    return article.status === "published";
  }

  // ภาษาอื่น = ต้องมี translation_status = 'complete'
  const { data: trans } = await supabase
    .from("translations")
    .select("translation_status")
    .eq("article_id", article.id)
    .eq("locale", locale)
    .maybeSingle();

  return !!(trans && (trans as any).translation_status === "complete");
}

/**
 * เรียกใช้ automation หลัง publish
 * - ถ้า locale variant ยังไม่ 'published' → ไม่ทำ (skipped)
 */
export async function runPublishAutomation(
  input: PublishNotificationInput
): Promise<PublishAutomationResult> {
  const { slug, locale } = input;

  // 1) Guardrail: ต้องผ่านสถานะ published จริงจาก DB เท่านั้น
  const published = await isVariantPublished(slug, locale);
  if (!published) {
    return {
      triggered: false,
      publishedUrls: [],
      indexNow: { submitted: false, reason: "Variant not published yet" },
      google: [],
      revalidated: [],
      skipped: true,
      reason: `Variant [${locale}] of "${slug}" is not in verified published state — skipped`,
    };
  }

  // 2) ดึงข้อมูลบทความ (มี published translations ทั้งหมด)
  const supabase = createAdminClient();
  const { data: articleRow } = await supabase
    .from("articles")
    .select(`
      id, slug, status, published_at, original_title, updated_at,
      translations(article_id, locale, title, is_full_translated,
                   translated_at, translation_status)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (!articleRow) {
    return {
      triggered: false, publishedUrls: [], indexNow: { submitted: false },
      google: [], revalidated: [], skipped: true, reason: "Article not found",
    };
  }

  // 3) หา URL ที่เผยแพร่จริง (ทุกภาษา) — ผู้ publish ตัวนี้จะแจ้งเฉพาะ language ที่เพิ่งเผยแพร่
  const allTargets = getArticleIndexTargets(articleRow);
  // กรองเฉพาะ URL ของ locale ที่เผยแพร่ตอนนี้ (เพื่อไม่แจ้งซ้ำทุกครั้ง)
  const currentTargets = allTargets.filter((t) => t.locale === locale);

  // ถ้าไม่เจอ target ของ locale นี้ (เช่น ภาษาแปลยังไม่ complete) → ข้าม
  const publishedUrls =
    currentTargets.length > 0
      ? currentTargets.map((t) => t.url)
      : allTargets.map((t) => t.url);

  // 4) IndexNow — แจ้ง URL ใหม่/อัปเดตที่เพิ่งเผยแพร่
  const indexNow = await pingIndexNow(publishedUrls);

  // 5) Google Indexing API — ส่ง URL ที่เพิ่งเผยแพร่
  const google = await submitUrlsToGoogle(
    currentTargets.length > 0
      ? currentTargets.map((t) => ({ url: t.url }))
      : []
  );

  // 6) Revalidate Next.js cache — สำหรับหน้าใหม่ + หน้าอื่นๆ ในบทความเดียวกัน
  const revalidated: string[] = [];

  // 6a) หน้า article ของทุกภาษาที่บทความนี้มี (variant ที่เผยแพร่จริง)
  const variants = allTargets.map((t) => t.locale);
  for (const v of variants) {
    const p = `/${v}/articles/${slug}`;
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {}
  }

  // 6b) Revalidate หน้า home + article index ของทุกภาษา active
  //     (เมื่อ publish บทความใหม่/แก้ => หน้าแรกและ index ต้องอัปเดตทันที)
  const activeLocales = getActiveLocales();
  for (const l of activeLocales) {
    try {
      revalidatePath(`/${l}`);
      revalidated.push(`/${l}`);
    } catch {}
    try {
      revalidatePath(`/${l}/articles`);
      revalidated.push(`/${l}/articles`);
    } catch {}
  }

  // 6c) Revalidate sitemap รวม + รายภาษา (ขอเป็น cache-clear ให้ชัด)
  try {
    revalidatePath("/sitemap.xml");
    revalidated.push("/sitemap.xml");
  } catch {}
  for (const l of activeLocales) {
    try {
      revalidatePath(`/sitemap/${l}.xml`);
      revalidated.push(`/sitemap/${l}.xml`);
    } catch {}
  }

  // revalidate ทั้งชุดด้วย tag (ถ้าหน้าอื่นใช้ revalidateTag)
  try {
    revalidateTag("articles");
    revalidated.push("tag:articles");
  } catch {}
  try {
    revalidateTag("sitemap");
    revalidated.push("tag:sitemap");
  } catch {}

  console.log(
    `[PublishAutomation] "${slug}" [${locale}] → indexNow=${indexNow.submitted}, google=${google.length} url(s), revalidated=${revalidated.length}`
  );

  return {
    triggered: true,
    publishedUrls,
    indexNow,
    google,
    revalidated,
    skipped: false,
  };
}

// ============================================================
// Convenience helper: เรียกจาก server client เพื่อ log/audit
// (ไม่ block request หลัก เพราะ fire-and-forget เป็นไปได้)
// ⚠️ ใน Next.js Route Handler ควร await เพื่อให้ revalidate ทำงานครบ
// ============================================================
export function notifyPublish(input: PublishNotificationInput) {
  return runPublishAutomation(input);
}
