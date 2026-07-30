// ============================================================
// Siam Heritage - Supabase Browser Client
// ============================================================
// ใช้สำหรับ Client Components เท่านั้น
// มี NEXT_PUBLIC_ prefix แปลว่า Browser-safe
// ============================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./supabase-types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
