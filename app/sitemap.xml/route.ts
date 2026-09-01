// ============================================================
// ⚠️ DEPRECATED — โปรดอย่าใช้ไฟล์นี้โดยตรง
// ============================================================
// Next.js App Router ไม่รองรับ folder ที่มี "." ในชื่อ
// (เช่น "sitemap.xml/") เป็น route handler อย่างถูกต้อง
// → response ออกมาเป็น plain text แทน XML
//
// ★ ตัวจริงอยู่ที่:
//   app/sitemap-xml/route.ts  ← GET /sitemap-xml
//   next.config.mjs           ← rewrite /sitemap.xml → /sitemap-xml
// ============================================================

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  // Fallback redirect ไป route จริง กรณี rewrite ใน next.config.mjs
  // ไม่ทำงาน (เช่น dev mode บางกรณี)
  return Response.redirect(
    new URL(
      "/sitemap-xml",
      process.env.NEXT_PUBLIC_SITE_URL || "https://unfakenews.asia"
    ),
    308 // Permanent Redirect
  );
}
