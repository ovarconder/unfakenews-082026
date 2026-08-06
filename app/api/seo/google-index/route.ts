// ============================================================
// POST /api/seo/google-index — Google Indexing API trigger
// ============================================================
// ใช้เรียกจากภายในเพื่อ submit URL ไปยัง Google Indexing API
//
// Body: { urls: string[] | string, type?: 'URL_UPDATED'|'URL_DELETED' }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  submitUrlToGoogle,
  submitUrlsToGoogle,
  isGoogleIndexingConfigured,
} from "@/lib/google-indexing";

export async function POST(request: NextRequest) {
  try {
    if (!isGoogleIndexingConfigured()) {
      return NextResponse.json(
        {
          submitted: false,
          error:
            "Google Indexing API not configured (need GOOGLE_SERVICE_ACCOUNT_* env vars)",
        },
        { status: 501 }
      );
    }

    const body = await request.json();
    const { urls, type } = body;

    if (!urls) {
      return NextResponse.json({ error: "urls required" }, { status: 400 });
    }

    const urlList = Array.isArray(urls) ? urls : [urls];
    const results = await submitUrlsToGoogle(
      urlList.map((u: string) => ({ url: u, type: type || "URL_UPDATED" }))
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[Google Index API] Error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
