// ============================================================
// GET, POST /api/admin/settings
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";
import { getSettings, saveSettings, clearSettingsCache } from "@/lib/site-settings";

// ============================================================
// Helper: parse user from request
// ============================================================

async function getRequestUser(request: NextRequest) {
  const cookieSession = await getCurrentSession();
  if (cookieSession.user) return cookieSession.user;

  const sessionHeader = request.headers.get("x-session-data");
  if (sessionHeader) {
    try {
      const decoded = decodeURIComponent(atob(sessionHeader));
      const userData = JSON.parse(decoded);
      if (userData && userData.id) {
        return { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
      }
    } catch {}
  }
  return null;
}

function requireAdmin(user: { role: string } | null): boolean {
  return user?.role === "admin";
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    // Allow read if logged in as editor/admin
    if (!user || !["admin", "editor"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear cache to force fresh read from DB
    clearSettingsCache();

    const settings = await getSettings();

    // Determine which values come from env vars (not set in DB)
    // The server merges env into the DB response, so we detect env-only values
    // by checking if the DB field would be empty without env fallback
    const sources = {
      googleAnalyticsId: settings.googleAnalyticsId
        ? (process.env.NEXT_PUBLIC_GA_ID && settings.googleAnalyticsId === process.env.NEXT_PUBLIC_GA_ID
            ? "env" : "db")
        : "none",
      adsenseId: settings.adsenseId
        ? (process.env.NEXT_PUBLIC_ADSENSE_ID && settings.adsenseId === process.env.NEXT_PUBLIC_ADSENSE_ID
            ? "env" : "db")
        : "none",
      // OAuth Keys sources
      googleOAuthClientId: settings.googleOAuthClientId
        ? (process.env.AUTH_GOOGLE_CLIENT_ID && settings.googleOAuthClientId === process.env.AUTH_GOOGLE_CLIENT_ID
            ? "env" : "db")
        : "none",
      googleOAuthClientSecret: settings.googleOAuthClientSecret
        ? (process.env.AUTH_GOOGLE_CLIENT_SECRET && settings.googleOAuthClientSecret === process.env.AUTH_GOOGLE_CLIENT_SECRET
            ? "env" : "db")
        : "none",
      facebookOAuthClientId: settings.facebookOAuthClientId
        ? (process.env.AUTH_FACEBOOK_CLIENT_ID && settings.facebookOAuthClientId === process.env.AUTH_FACEBOOK_CLIENT_ID
            ? "env" : "db")
        : "none",
      facebookOAuthClientSecret: settings.facebookOAuthClientSecret
        ? (process.env.AUTH_FACEBOOK_CLIENT_SECRET && settings.facebookOAuthClientSecret === process.env.AUTH_FACEBOOK_CLIENT_SECRET
            ? "env" : "db")
        : "none",
    };

    return NextResponse.json({ settings, sources });
  } catch (err: any) {
    console.error("[Settings API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || !["admin", "editor"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized — admin/editor only" }, { status: 401 });
    }

    const body = await request.json();
    const updated = await saveSettings({ ...body });

    const sources = {
      googleAnalyticsId: updated.googleAnalyticsId
        ? (process.env.NEXT_PUBLIC_GA_ID && updated.googleAnalyticsId === process.env.NEXT_PUBLIC_GA_ID
            ? "env" : "db")
        : "none",
      adsenseId: updated.adsenseId
        ? (process.env.NEXT_PUBLIC_ADSENSE_ID && updated.adsenseId === process.env.NEXT_PUBLIC_ADSENSE_ID
            ? "env" : "db")
        : "none",
      // OAuth Keys sources
      googleOAuthClientId: updated.googleOAuthClientId
        ? (process.env.AUTH_GOOGLE_CLIENT_ID && updated.googleOAuthClientId === process.env.AUTH_GOOGLE_CLIENT_ID
            ? "env" : "db")
        : "none",
      googleOAuthClientSecret: updated.googleOAuthClientSecret
        ? (process.env.AUTH_GOOGLE_CLIENT_SECRET && updated.googleOAuthClientSecret === process.env.AUTH_GOOGLE_CLIENT_SECRET
            ? "env" : "db")
        : "none",
      facebookOAuthClientId: updated.facebookOAuthClientId
        ? (process.env.AUTH_FACEBOOK_CLIENT_ID && updated.facebookOAuthClientId === process.env.AUTH_FACEBOOK_CLIENT_ID
            ? "env" : "db")
        : "none",
      facebookOAuthClientSecret: updated.facebookOAuthClientSecret
        ? (process.env.AUTH_FACEBOOK_CLIENT_SECRET && updated.facebookOAuthClientSecret === process.env.AUTH_FACEBOOK_CLIENT_SECRET
            ? "env" : "db")
        : "none",
    };

    return NextResponse.json({ success: true, settings: updated, sources });
  } catch (err: any) {
    console.error("[Settings API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

