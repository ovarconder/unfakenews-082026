// ============================================================
// Google Indexing API
// ============================================================
// ใช้ Google Service Account (JWT) ยืนยันตัวตน แล้ว POST URL ไปยัง
// https://indexing.googleapis.com/v3/urlNotifications:publish
//
// Prerequisites (ต้องตั้งใน env):
//   GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL   เช่น xxx@project.iam.gserviceaccount.com
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY    (ใส่ \n แทน newline ได้)
//   GOOGLE_SERVICE_ACCOUNT_PROJECT_ID
//
// ⚠️ ต้อง enable "Indexing API" ใน Google Cloud Console
//    และเพิ่ม Service Account ลงใน Search Console property นั้นก่อน
// ============================================================

const INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";

/** อ่านค่า config จาก env */
function getServiceAccountConfig() {
  return {
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || "",
    privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    projectId: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID || "",
  };
}

/** ตรวจว่ามี config ครบไหม */
export function isGoogleIndexingConfigured(): boolean {
  const cfg = getServiceAccountConfig();
  return Boolean(cfg.clientEmail && cfg.privateKey && cfg.projectId);
}

// ============================================================
// JWT (RS256) signing — ดึง access token จาก Google OAuth token endpoint
// ============================================================

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * ดึง OAuth access token สำหรับ Service Account
 * (ใช้ Node crypto sign RS256 — ทำงานได้ทั้ง serverless/edge-free runtime)
 */
async function getGoogleAccessToken(scopes: string[]): Promise<string> {
  const cfg = getServiceAccountConfig();

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: cfg.clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const { createSign } = require("crypto");
  const signingInput =
    base64UrlEncode(JSON.stringify(header)) +
    "." +
    base64UrlEncode(JSON.stringify(claims));
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(cfg.privateKey);
  const jwt = signingInput + "." + signature.toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth token failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Google OAuth did not return an access_token");
  }
  return data.access_token as string;
}

// ============================================================
// Index URL — ส่งเพิ่ม/อัปเดตหน้า (URL_NOTIFIED)
// ============================================================

export interface GoogleIndexingResult {
  submitted: boolean;
  reason?: string;
  /** แนะนำให้ inspect หลัง submit */
  inspectionUrl?: string;
}

export async function submitUrlToGoogle(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<GoogleIndexingResult> {
  if (!isGoogleIndexingConfigured()) {
    return { submitted: false, reason: "Google Indexing API not configured" };
  }

  try {
    const accessToken = await getGoogleAccessToken([
      "https://www.googleapis.com/auth/indexing",
    ]);

    const res = await fetch(INDEXING_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        type,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn(`[GoogleIndexing] status=${res.status} body=${JSON.stringify(data)}`);
      return {
        submitted: false,
        reason: `HTTP ${res.status}: ${data?.error?.message || res.statusText}`,
      };
    }

    return {
      submitted: true,
      inspectionUrl:
        data?.urlNotificationMetadata?.latestUpdate?.notifyTime
          ? `https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`
          : undefined,
    };
  } catch (err: any) {
    console.warn(`[GoogleIndexing] Request failed: ${err?.message}`);
    return { submitted: false, reason: err?.message };
  }
}

/** ส่งหลาย URL — เหมาะสำหรับ batch หลัง publish ทั้งภาษาเป็น course */
export async function submitUrlsToGoogle(
  targets: { url: string; type?: "URL_UPDATED" | "URL_DELETED" }[]
) {
  const results: { url: string; ok: boolean; reason?: string }[] = [];
  for (const t of targets) {
    const r = await submitUrlToGoogle(t.url, t.type || "URL_UPDATED");
    results.push({ url: t.url, ok: r.submitted, reason: r.reason });
  }
  return results;
}
