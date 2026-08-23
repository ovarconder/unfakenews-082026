// ============================================================
// Siam Heritage - YouTube Helper Utilities
// ============================================================
// ใช้ร่วมกันทั้ง editor, markdown-preview และ article-detail
// เพื่อแทรก/แสดงวิดีโอ YouTube ผ่าน shortcode `{% youtube VIDEO_ID %}`
// และรองรับการวาง HTML <iframe> จาก YouTube ได้ด้วย
// ============================================================

/**
 * ดึง Video ID จาก URL/embed ของ YouTube
 * รองรับรูปแบบ watch, youtu.be, embed, shorts, live, v/
 * และถ้าใส่ Video ID ตรง ๆ (11 ตัวอักษร) ก็รับด้วย
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/attribution_link\?.*?v=)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const m = trimmed.match(pattern);
    if (m) return m[1];
  }

  return null;
}

/** URL thumbnail (maxresdefault) ของวิดีโอ */
export function getYouTubeThumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/** URL thumbnail สำรอง (hqdefault) เผื่อไม่มี maxres */
export function getYouTubeThumbFallback(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** URL หน้า watch บน YouTube */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * แปลง shortcode `{% youtube VIDEO_ID %}` → { videoId } หรือ null
 */
export function parseYouTubeShortcode(line: string): { videoId: string } | null {
  const m = line.trim().match(/^\{%\s*youtube\s+([a-zA-Z0-9_-]{11})\s*%\}$/);
  return m ? { videoId: m[1] } : null;
}

/**
 * แปลง HTML <iframe src="...youtube..."> → { videoId } หรือ null
 */
export function parseYouTubeIframe(line: string): { videoId: string } | null {
  const m = line.match(/src=["']([^"']*(?:youtube\.com|youtu\.be)[^"']*?)["']/i);
  if (!m) return null;
  const videoId = extractYouTubeId(m[1]);
  return videoId ? { videoId } : null;
}

/** ตรวจว่า line เป็น shortcode/iframe วิดีโอ YouTube หรือไม่ */
export function isYouTubeLine(line: string): boolean {
  return (
    parseYouTubeShortcode(line) !== null ||
    (line.trim().toLowerCase().startsWith("<iframe") && parseYouTubeIframe(line) !== null)
  );
}
