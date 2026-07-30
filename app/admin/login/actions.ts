"use server";

import { login } from "@/lib/auth-service";
import { getSettings } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase-server";

export async function loginAdmin(email: string, password: string) {
  try {
    const result = await login(email, password);
    return result;
  } catch (err: any) {
    console.error("[loginAdmin]", err);
    return { success: false, error: "Login failed" };
  }
}

/**
 * ตรวจสอบ OAuth keys จาก settings (DB) ว่าครบถ้วนหรือไม่
 * โดยเทียบกับ Environment Variables เป็นอันดับแรก
 * 
 * ระบบทำงานแบบนี้:
 * 1. ถ้ามี Environment Variable (AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET) → ใช้ค่า ENV
 * 2. ถ้าไม่มี ENV → ใช้ค่าจากฐานข้อมูล (site_settings.google_oauth_client_id)
 * 3. ถ้าทั้งสองไม่มี → OAuth ไม่ทำงาน (ปุ่มถูก disable)
 */
export async function isGoogleOAuthConfigured(): Promise<boolean> {
  // Check env vars first (highest priority)
  if (process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET) {
    return true;
  }
  // Fallback to DB settings
  try {
    const settings = await getSettings();
    return !!(settings.googleOAuthClientId && settings.googleOAuthClientSecret);
  } catch {
    return false;
  }
}

export async function isFacebookOAuthConfigured(): Promise<boolean> {
  // Check env vars first (highest priority)
  if (process.env.AUTH_FACEBOOK_CLIENT_ID && process.env.AUTH_FACEBOOK_CLIENT_SECRET) {
    return true;
  }
  // Fallback to DB settings
  try {
    const settings = await getSettings();
    return !!(settings.facebookOAuthClientId && settings.facebookOAuthClientSecret);
  } catch {
    return false;
  }
}

export async function signInWithGoogle() {
  try {
    // Use env var first, then fallback to DB
    let clientId = process.env.AUTH_GOOGLE_CLIENT_ID || "";
    let clientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      const settings = await getSettings();
      clientId = settings.googleOAuthClientId || "";
      clientSecret = settings.googleOAuthClientSecret || "";
    }

    if (!clientId || !clientSecret) {
      return { success: false, error: "Google OAuth ไม่ได้ตั้งค่า", url: null };
    }

    // Build Supabase OAuth URL for Google
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        queryParams: {
          client_id: clientId,
        },
      },
    });

    if (error) throw error;
    return { success: true, error: null, url: data.url };
  } catch (err: any) {
    console.error("[signInWithGoogle]", err);
    return { success: false, error: err.message || "Google login failed", url: null };
  }
}

export async function signInWithFacebook() {
  try {
    // Use env var first, then fallback to DB
    let clientId = process.env.AUTH_FACEBOOK_CLIENT_ID || "";
    let clientSecret = process.env.AUTH_FACEBOOK_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      const settings = await getSettings();
      clientId = settings.facebookOAuthClientId || "";
      clientSecret = settings.facebookOAuthClientSecret || "";
    }

    if (!clientId || !clientSecret) {
      return { success: false, error: "Facebook OAuth ไม่ได้ตั้งค่า", url: null };
    }

    // Build Supabase OAuth URL for Facebook
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        queryParams: {
          client_id: clientId,
        },
      },
    });

    if (error) throw error;
    return { success: true, error: null, url: data.url };
  } catch (err: any) {
    console.error("[signInWithFacebook]", err);
    return { success: false, error: err.message || "Facebook login failed", url: null };
  }
}
