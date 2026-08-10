import type { Metadata } from "next";
import { getSettings } from "@/lib/site-settings";
import AdminLayoutClient from "./admin-layout-client";

// ต้องอ่าน settings (favicon, metaTitle...) แบบสดจาก DB ในทุก request
// เพื่อไม่ให้ Next.js prerender/static cache หน้า admin ด้วย favicon เก่า
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================================
// generateMetadata — ตั้ง favicon + title จาก site_settings ใน Supabase
// ทำให้หน้า admin (ทุกหน้าภายใต้ app/admin) มี favicon เหมือนหน้า general
// (หน้า general ใช้ <link rel="icon"> ใน app/[lang]/layout.tsx)
// ============================================================
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: settings.metaTitle || settings.name || "Admin",
    description: settings.metaDescription,
    icons: { icon: settings.favicon },
    other: {
      "data-favicon": settings.favicon,
    },
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
