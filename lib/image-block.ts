// ============================================================
// Siam Heritage - Single Image Block Helper
// ============================================================
// Parse รูปแบบ wrapper `<div class="image-{align} image-w-{width}">`
// ใช้ร่วมกันใน renderer ทั้ง 3 จุด (editor preview, markdown-preview,
// article-detail) เพื่อให้ render ภาพเดี่ยวเหมือนกันหมด
// ============================================================

export type ImageAlign = "center" | "left" | "right";
export type ImageWidth = "full" | "75" | "50" | "25";

export interface ImageBlockStyle {
  align: ImageAlign;
  width: ImageWidth;
}

// ตรวจว่า line เป็น opening div ของ image block หรือไม่
export function isImageBlockOpen(line: string): boolean {
  return /<div\s+class="image-(center|left|right)(\s+image-w-[a-z0-9]+)?"/i.test(line.trim());
}

// อ่าน align + width จาก opening div
export function parseImageBlockOpen(line: string): ImageBlockStyle {
  const alignMatch = line.match(/image-(center|left|right)/i);
  const widthMatch = line.match(/image-w-(full|25|50|75)/i);

  return {
    align: (alignMatch?.[1] as ImageAlign) || "center",
    width: (widthMatch?.[1] as ImageWidth) || "full",
  };
}

// ตรวจว่า line เป็น closing div tag (> ตามหลังการเปิด block)
export function isImageBlockClose(line: string): boolean {
  return /<\/div>/.test(line);
}
