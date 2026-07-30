// ============================================================
// OAuth Callback - Google / Facebook
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get user profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // Create profile for new OAuth user — default role: unassigned (รอ admin assign)
          await supabase.from("profiles").insert({
            // @ts-ignore - dynamic OAuth profile data
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            email: user.email,
            role: "unassigned",
            avatar_url: user.user_metadata?.avatar_url || null,
          } as any);
        }
      }

      // Redirect with user info as hash for client to pick up
      const redirectUrl = new URL(next, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback: redirect to login
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
