// ============================================================
// Siam Heritage - Supabase Server Client
// ============================================================
// ใช้ใน Server Components, API Routes, Server Actions
// - createClient(): สำหรับ auth session management (ใช้ cookies)
// - createAdminClient(): สำหรับ bypass RLS (ใช้ service_role key)
//
// Fallback Mode: ถ้าไม่มี Supabase env vars จะคืนค่า empty dataset
// ทำให้ client components ทำงานได้โดยไม่พัง (แสดง "No articles yet")
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./supabase-types";

const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON_KEY = "placeholder-key-for-build-only";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — middleware will handle cookie refresh
          }
        },
      },
    }
  );
}

/**
 * Admin client ที่มี service_role key — bypasses RLS
 * ใช้เฉพาะใน server-side code ที่ต้องเขียน/อ่านข้อมูลทั้งหมด
 * e.g., translation service, admin CRUD
 */
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
