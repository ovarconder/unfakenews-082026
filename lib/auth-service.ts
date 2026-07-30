// ============================================================
// Siam Heritage - Auth Service (Supabase-backed)
// ============================================================
// ใช้ Supabase Auth สำหรับ session management
// ใช้ public.profiles table สำหรับ role/name
// ============================================================

import { createClient } from "./supabase-server";
import { createAdminClient } from "./supabase-server";
import type { UserRole, Permission } from "./auth-types";
import { hasPermission } from "./auth-types";
import { authenticateUser, getUserPublicById } from "./user-store";
// ============================================================
// Session helpers (ใช้ Supabase session cookies โดยตรง)
// ============================================================
export async function getCurrentSession(): Promise<{
  user: { id: string; email: string; name: string; role: UserRole } | null;
  session: any;
}> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return { user: null, session: null };
    }

    // Get profile from Supabase
    const { data: rawProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const profile = rawProfile as { name?: string; role?: string; avatar_url?: string } | null;

    const role = (profile?.role as UserRole) || "unassigned";
    return {
      user: {
        id: session.user.id,
        email: session.user.email || "",
        name: profile?.name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
        role,
      },
      session,
    };
  } catch (err: any) {
    console.error("[auth-service] getCurrentSession error:", err?.message || err);
    return { user: null, session: null };
  }
}

export async function createSession(userId: string, email: string, role: UserRole): Promise<void> {
  // Session is managed by Supabase Auth — no manual cookie needed
  // This function is kept for backward compatibility
  return;
}

export async function destroySession(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err: any) {
    console.error("[auth-service] destroySession error:", err?.message || err);
  }
}

// ============================================================
// Login/Logout
// ============================================================

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: { id: string; email: string; name: string; role: UserRole } }> {
  try {
    // ใช้ Supabase Auth สำหรับ login
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
    return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

    // ดึง profile
    const { data: rawProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    const profile = rawProfile as { name?: string; role?: string } | null;

    const role = (profile?.role as UserRole) || "unassigned";
    const name = profile?.name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User";

    // ถ้าไม่มี profile ให้สร้างให้
    if (!profile) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("profiles").insert({
          id: data.user.id,
          name,
          role: "unassigned",
        });
      } catch (e) {
        console.warn("[auth-service] Could not create profile:", e);
      }
    }
  return {
    success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        name,
        role,
      },
  };
  } catch (err: any) {
    console.error("[auth-service] login error:", err?.message || err);
    return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
}
}

export async function logout(): Promise<void> {
  await destroySession();
}

// ============================================================
// Permission Check
// ============================================================

export async function requirePermission(
  permission: Permission
): Promise<{ allowed: boolean; user?: { id: string; email: string; name: string; role: UserRole } }> {
  const { user } = await getCurrentSession();
  if (!user) return { allowed: false };

  const allowed = hasPermission(user.role, permission);
  return { allowed, user };
}

export async function requireRole(
  ...roles: UserRole[]
): Promise<{ allowed: boolean; user?: { id: string; email: string; name: string; role: UserRole } }> {
  const { user } = await getCurrentSession();
  if (!user) return { allowed: false };

  const allowed = roles.includes(user.role);
  return { allowed, user };
}

