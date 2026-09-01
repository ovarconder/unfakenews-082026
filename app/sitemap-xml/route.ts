// ============================================================
// ⚠️ ไฟล์นี้ไม่ใช้งานอีกต่อไป — ดู app/sitemap.ts แทน
// ============================================================
// Next.js ใช้ /sitemap-xml เป็น internal route name
// สำหรับ built-in sitemap (app/sitemap.ts)
// ถ้า route handler นี้ยังมี logic อยู่จะ intercept ทับ
// ทำให้ Content-Type ผิด → plain text
//
// ★ Sitemap อยู่ที่: app/sitemap.ts
// ============================================================

export async function GET(): Promise<Response> {
  return new Response(null, { status: 404 });
}
