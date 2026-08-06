// ============================================================
// IndexNow Protocol — Instant Crawling Signal
// ============================================================
// แจ้ง Bing / Perplexity / Yandex / Seznam ทันทีเมื่อมีหน้าใหม่/อัปเดต
// Reference: https://www.indexnow.org/
//
// IndexNow ต้องการ:
//   1. API key file อยู่ที่ root ของ domain:  /{API_KEY}.txt
//   2. POST ไป https://api.indexnow.org/indexnow
//
// ⚠️ ต้องวางไฟล์ key ไว้ใน /public/{INDEXNOW_KEY}.txt ด้วย
// ============================================================

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** ดึง IndexNow API key จาก env */
export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY || process.env.NEXT_PUBLIC_INDEXNOW_KEY || "";
}

/**
 * ส่ง IndexNow ping สำหรับ URL เดียว (หรือหลาย URL)
 * - ใช้ได้กับหน้าใหม่ + หน้าที่อัปเดต
 * - fire-and-forget โดย default (ไม่ throw ถ้าไม่ config key)
 *
 * @returns ข้อมูลการส่ง (ส่งหรือไม่) เพื่อใช้ log
 */
export async function pingIndexNow(urls: string | string[]): Promise<{
  submitted: boolean;
  reason?: string;
  hits?: number;
}> {
  const key = getIndexNowKey();

  // ถ้ายังไม่มี key → ข้าม (ดีกว่าส่ง fail)
  if (!key) {
    return {
      submitted: false,
      reason: "INDEXNOW_KEY not configured",
      hits: 0,
    };
  }

  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);

  if (urlList.length === 0) {
    return { submitted: false, reason: "No URLs provided", hits: 0 };
  }

  const host = (() => {
    try {
      return new URL(urlList[0]).host;
    } catch {
      return "";
    }
  })();

  const payload = {
    host, // e.g. unfakenews.asia
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(
      `[IndexNow] status=${res.status} urls=${urlList.length} host=${host}`
    );

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[IndexNow] Non-2xx response: ${text}`);
      return { submitted: false, reason: `HTTP ${res.status}: ${text}`, hits: urlList.length };
    }

    return { submitted: true, hits: urlList.length };
  } catch (err: any) {
    console.warn(`[IndexNow] Request failed: ${err?.message}`);
    return { submitted: false, reason: err?.message, hits: urlList.length };
  }
}
