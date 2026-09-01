// ============================================================
// ⚠️ ไฟล์นี้ไม่ใช้งานอีกต่อไป — ดู app/sitemap.ts แทน
// ============================================================
// Sitemap ย้ายไปใช้ Next.js Built-in Metadata Route:
//   app/sitemap.ts → serve /sitemap.xml
// Next.js จัดการ Content-Type: application/xml ให้เอง
// ไม่มีปัญหา plain text อีกต่อไป
// ============================================================

// คง export GET ไว้เป็น fallback 404 เพื่อไม่ให้ไฟล์นี้ถูกเรียกโดยตรง
export async function GET(): Promise<Response> {
  return new Response("Not Found", { status: 404 });
}
