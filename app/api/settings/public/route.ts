// ============================================================
// GET /api/settings/public
// ============================================================
// Public endpoint — คืนเฉพาะค่าที่ปลอดภัยสำหรับผู้ใช้ทั่วไป
// (branding, colors, social, GA/AdSense, support)
//
// ใช้โดย SettingsProvider (client) เพื่อ apply theme + ให้ component
// อ่านค่า settings ได้ โดยไม่ต้องล็อกอิน (เดิมใช้ /api/admin/settings
// ซึ่งต้องเป็น admin/editor → ผู้ใช้ทั่วไปจะได้ 401 และตกไปใช้ค่า default)
//
// ⚠️ ไม่คืนค่าลับ: OAuth secrets, API keys ต่าง ๆ
// ============================================================

import { NextResponse } from "next/server";
import { getSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await getSettings();

    // ส่งเฉพาะฟิลด์ที่ปลอดภัยต่อการเปิดเผยสู่สาธารณะ
    const settings = {
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      url: s.url,
      logo: s.logo,
      logoFull: s.logoFull,
      favicon: s.favicon,

      // Colors
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
      accentColor: s.accentColor,
      backgroundColor: s.backgroundColor,
      backgroundColorSecondary: s.backgroundColorSecondary,
      cardColor: s.cardColor,
      cardBorderColor: s.cardBorderColor,
      textColor: s.textColor,
      textColorMuted: s.textColorMuted,
      sidebarColor: s.sidebarColor,
      headerColor: s.headerColor,
      successColor: s.successColor,
      errorColor: s.errorColor,

      copyright: s.copyright,
      locale: s.locale,
      timezone: s.timezone,

      // SEO / Meta
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      ogTitle: s.ogTitle,
      ogDescription: s.ogDescription,
      ogImage: s.ogImage,
      twitterHandle: s.twitterHandle,

      // Analytics & Ads (ค่าพวกนี้เป็น public ID อยู่แล้ว)
      googleAnalyticsId: s.googleAnalyticsId,
      adsenseId: s.adsenseId,
      adsenseSlotHomepage: s.adsenseSlotHomepage,
      adsenseSlotSidebar: s.adsenseSlotSidebar,

      // Social
      facebookUrl: s.facebookUrl,
      twitterUrl: s.twitterUrl,
      instagramUrl: s.instagramUrl,
      youtubeUrl: s.youtubeUrl,
      email: s.email,
      phone: s.phone,
      address: s.address,

      // Features
      showAuthor: s.showAuthor,
      enableComments: s.enableComments,
      enableSocialShare: s.enableSocialShare,
      maintenanceMode: s.maintenanceMode,
      maintenanceMessage: s.maintenanceMessage,

      // Locale tiers (ใช้ตัดสินใจว่าจะแสดงภาษาใด)
      localeTiers: s.localeTiers,

      // Support section (ข้อมูลโอนเงิน — ตั้งใจให้ public เพราะหน้า /support แสดงอยู่แล้ว)
      supportEnabled: s.supportEnabled,
      supportQr: s.supportQr,
      supportTitle: s.supportTitle,
      supportDescription: s.supportDescription,
      supportAccountName: s.supportAccountName,
      supportAccountNumber: s.supportAccountNumber,

      // Custom CSS (ใช้ inject ใน public pages — เป็น public โดยตั้งใจ)
      customCss: s.customCss,
    };

    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error("[Settings/Public] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}
