// ============================================================
// Image Alt Utilities — ดึง alt text ของรูปทั้งหมดจากเนื้อหา (Markdown/HTML)
// ============================================================
// ใช้ร่วมกันระหว่าง /api/translate-new และ /api/translate-all
// เพื่อให้การแปล alt text ครอบคลุม "รูปทุกรูป" (ไม่ใช่แค่รูปหน้าปก)
//
// รองรับรูปแบบรูปในเนื้อหา:
//   1. Markdown         ![alt](url)
//   2. Gallery block    {% gallery %} ... ![alt](url) ... {% endgallery %}
//   3. HTML <img>       <img src="..." alt="..." />
// ============================================================

/**
 * ดึงคู่ { url -> alt } ของรูปทั้งหมดที่พบในเนื้อหา
 *
 * @param content      เนื้อหา markdown/HTML (ต้นฉบับภาษาไทย)
 * @param featuredUrl  URL ของรูปหน้าปก (ถ้ามี)
 * @param featuredAlt  alt ของรูปหน้าปก (ถ้ามี)
 * @returns            Record<url, alt> — เฉพาะรูปที่มี alt ไม่ว่าง
 */
export function extractImageAltsFromContent(
  content: string | null | undefined,
  featuredUrl?: string | null,
  featuredAlt?: string | null
): Record<string, string> {
  const result: Record<string, string> = {};

  // 0) รูปหน้าปก (featured image) — เก็บก่อน
  if (featuredUrl && featuredAlt && featuredAlt.trim()) {
    result[featuredUrl] = featuredAlt.trim();
  }

  if (!content) return result;

  // 1) Markdown image: ![alt](url) — ครอบคลุมกลายเป็น gallery ด้วย
  //    (gallery block ก็ใช้ syntax เดียวกัน จึงถูกจับที่นี่เช่นกัน)
  const mdImageRegex = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImageRegex.exec(content)) !== null) {
    const alt = (m[1] || "").trim();
    const url = (m[2] || "").trim();
    // เก็บเฉพาะรูปที่มี alt จริง และยังไม่มีใน result (รูปแรกของ URL นั้นชนะ)
    if (url && alt && !result[url]) {
      result[url] = alt;
    }
  }

  // 2) HTML <img ...> — รองรับ single/double quotes และลำดับ attribute ใดๆ
  const htmlImgRegex = /<img\s[^>]*>/gi;
  const imgTags = content.match(htmlImgRegex) || [];
  for (const tag of imgTags) {
    const srcMatch = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    const altMatch = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    const url = srcMatch ? srcMatch[2].trim() : "";
    const alt = altMatch ? altMatch[2].trim() : "";
    if (url && alt && !result[url]) {
      result[url] = alt;
    }
  }

  return result;
}
