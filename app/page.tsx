import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ALL_LOCALES, type Locale } from "@/lib/locales";

// ============================================================
// Root Page "/"
// ============================================================
// ปกติ middleware จะ redirect "/" → "/{locale}" ให้ก่อนถึงหน้านี้แล้ว
// หน้านี้เป็น safety net (เผื่อ middleware ถูก bypass) จึง detect ภาษา
// จาก Accept-Language แทนการ hardcode "/en"

function detectLocale(acceptLang: string | null): Locale {
  if (acceptLang) {
    const preferred = acceptLang
      .split(",")[0]
      ?.split("-")[0]
      ?.split(";")[0]
      ?.trim()
      .toLowerCase();
    if (preferred && (ALL_LOCALES as readonly string[]).includes(preferred)) {
      return preferred as Locale;
    }
  }
  return "en";
}

export default async function RootPage() {
  const headersList = await headers();
  const locale = detectLocale(headersList.get("accept-language"));
  redirect(`/${locale}`);
}
