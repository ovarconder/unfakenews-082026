// ============================================================
// Siam Heritage - Supabase Auth Service
// ============================================================
// แทนที่ auth-service.ts เดิมที่ใช้ JWT + file-based users
// ใช้ Supabase Auth แทน: Social Login (Google, GitHub, Facebook)
// + Email/Password
// ============================================================

import { createClient as createServerClient } from "./supabase-server";
import { createClient as createBrowserClient } from "./supabase-client";
import type { UserRole, Permission } from "./auth-types";
import { hasPermission } from "./auth-types";

// ============================================================
// ตรวจสอบว่า user มี permission หรือไม่
// ============================================================

function getRoleFromProfile(profileRole: string | null): UserRole {
  const roles: UserRole[] = ["unassigned", "admin", "editor", "writer"];
  if (profileRole && roles.includes(profileRole as UserRole)) {
    return profileRole as UserRole;
  }
  return "unassigned";
}

// ============================================================
// Social Login - URL Generators
// ============================================================

export function getSocialLoginUrl(
  provider: "google" | "github" | "facebook",
  redirectTo?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/auth/callback`;
  
  return callbackUrl; // social login URLs are generated on the login component instead
}

// ============================================================
// Server-side: Get current user with profile
// ============================================================

export async function getCurrentUser() {
  const supabase = await createServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, profile: null };
  }

  // Get profile from public.profiles
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as any;

  return {
    user: {
      id: user.id,
      email: user.email || "",
      name: profile?.name || user.user_metadata?.name || user.email || "Unknown",
      role: getRoleFromProfile(profile?.role || null),
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    },
    profile,
  };
}

// ============================================================
// Server-side: Check permission
// ============================================================

export async function requirePermission(permission: Permission) {
  const { user } = await getCurrentUser();
  if (!user) return { allowed: false, user: null };
  
  const allowed = hasPermission(user.role, permission);
  return { allowed, user };
}

export async function requireRole(...roles: UserRole[]) {
  const { user } = await getCurrentUser();
  if (!user) return { allowed: false, user: null };
  
  const allowed = roles.includes(user.role);
  return { allowed, user };
}

// ============================================================
// Server-side: Login with email/password (fallback)
// ============================================================

export async function loginWithEmail(email: string, password: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// ============================================================
// Server-side: Logout
// ============================================================

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}

// ============================================================
// Admin client: Create first admin (for seeding)
// ============================================================

export async function createFirstAdmin(email: string, password: string, name: string) {
  const supabase = await createServerClient();
  
  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "admin" },
  });

  if (authError) throw authError;

  // Set role to admin
  if (authData.user) {
    const adminClient = await createServerClient();
    await (adminClient as any)
      .from("profiles")
      .update({ role: "admin", name })
      .eq("id", authData.user.id);
  }

  return authData;
}
