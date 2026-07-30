// ============================================================
// Admin Login Page
// ============================================================

import Image from "next/image";
import { getSettings } from "@/lib/site-settings";
import AdminLoginClient from "./login-client";

export async function generateMetadata() {
  const settings = await getSettings();
  return {
    title: `เข้าสู่ระบบ - ${settings.name} Admin`,
  };
}

export default function AdminLoginPage() {
  return (
    <>
      {/* Logo header is inside login-client.tsx, but we override it here via CSS/JS */}
      <AdminLoginClient />
    </>
  );
}
