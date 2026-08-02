// ============================================================
// vibe.overconda.space — Middleware
// ============================================================
// - Locale detection: cookie → Accept-Language → "en"
// - If cookie exists → always use that locale (user's choice)
// - If no cookie → detect from Accept-Language → save cookie
// - Redirect / → /{locale}
// - Auth callback session refresh
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";
import { ALL_LOCALES } from "@/lib/locales";

const LOCALE_COOKIE = "vibe_locale";
const VALID_LOCALES = ALL_LOCALES as readonly string[];

function getLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && VALID_LOCALES.includes(match[1])) {
    return match[1];
  }
  return null;
}

/**
 * หา locale ที่เหมาะสม:
 * 1. Cookie (user เลือกไว้) → ใช้ภาษานั้นเสมอ ไม่สน Accept-Language
 * 2. Accept-Language header (ครั้งแรกที่ยังไม่มี cookie) → ใช้ภาษาที่ browser ส่งมา
 * 3. Default → "en"
 *
 * ⚠️ หลักการ: Cookie คือ source of truth
 *    - ถ้า user เปลี่ยนภาษา → cookie จะถูกอัปเดตทันที
 *    - ครั้งต่อไปที่กลับมา → อ่าน cookie → ยึดภาษาที่เคยเลือกไว้
 *    - จะไม่กลับไปใช้ Accept-Language อีกจนกว่า cookie จะถูกลบ
 */
function getPreferredLocale(request: NextRequest): string {
  // 1. Cookie มี → ยึดภาษาที่ user เลือกไว้ (สำคัญที่สุด!)
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && VALID_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. ไม่มี cookie → ครั้งแรก → ใช้ Accept-Language
  const acceptLang = request.headers.get("accept-language");
  if (acceptLang) {
    const preferred = acceptLang.split(",")[0]?.split("-")[0]?.split(";")[0]?.trim().toLowerCase();
    if (preferred && VALID_LOCALES.includes(preferred)) {
      return preferred;
    }
  }

  // 3. ไม่มีอะไรเลย → อังกฤษ
  return "en";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Auth callback — refresh session
  if (pathname === "/auth/callback") {
    return await updateSession(request);
  }

  // 2. Skip non-page routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return;
  }

  // 3. Root / → redirect to preferred locale
  if (pathname === "/") {
    const preferredLocale = getPreferredLocale(request);
    const url = new URL(`/${preferredLocale}`, request.url);
    const response = NextResponse.redirect(url);
    // ตั้ง cookie ให้ยึดภาษานี้ต่อไป
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 ปี
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // 4. Handle /{locale}/... paths — ตั้ง/อัปเดต cookie ทุกครั้งที่ user เปลี่ยนภาษา
  const pathLocale = getLocaleFromPath(pathname);
  if (pathLocale) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 ปี
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // 5. Unknown path without locale — redirect to /en
  const url = new URL(`/en${pathname}`, request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

