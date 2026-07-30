// ============================================================
// Siam Heritage - User Store (Supabase-backed)
// ============================================================
// ใช้ Supabase profiles table + auth.users แทน JSON file
// ============================================================

import { createAdminClient } from "./supabase-server";
import type { User, UserPublic, UserRole } from "./auth-types";

// ============================================================
// Cache (runtime)
// ============================================================

let cachedProfiles: ProfileCache[] | null = null;

interface ProfileCache {
  id: string;      // auth.users.id
  email: string;   // from auth.users.email
  name: string;
  role: UserRole;
  avatar: string | undefined;
  created_at: string;
  last_login?: string;
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * ดึง profiles + emails จาก Supabase
 * จอยระหว่าง auth.users กับ public.profiles
 */
async function fetchAllProfiles(): Promise<ProfileCache[]> {
  if (cachedProfiles) return cachedProfiles;

  try {
    const supabase = createAdminClient();

    // Get profiles from public table
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("[user-store] Error fetching profiles:", profilesError.message);
      return [];
    }

    if (!profiles || !Array.isArray(profiles)) {
      return [];
    }

    // Get emails from auth.users (admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    const authUsers = (!authError && authData?.users) ? authData.users : [];

    const result: ProfileCache[] = profiles.map((p: any) => {
      const authUser = authUsers.find((au: any) => au.id === p.id);
      return {
        id: p.id,
        email: authUser?.email || "",
        name: p.name || "Unknown",
        role: (p.role as UserRole) || "unassigned",
        avatar: p.avatar_url || undefined,
        created_at: p.created_at || new Date().toISOString(),
      };
    });

    cachedProfiles = result;
    return result;
  } catch (err: any) {
    console.error("[user-store] fetchAllProfiles error:", err?.message || err);
    return [];
  }
}

function invalidateCache(): void {
  cachedProfiles = null;
}

// ============================================================
// Public API (เหมือนเดิม — ใช้ interface เดิม)
// ============================================================

export async function authenticateUser(
  email: string,
  password: string
): Promise<UserPublic | null> {
  try {
    const supabase = createAdminClient();

    // Try sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return null;
    }

    // Get profile
    const profiles = await fetchAllProfiles();
    const profile = profiles.find((p) => p.id === data.user!.id);
    
    if (!profile) {
      // Create profile if not exists (auto-create on first login)
      // Default role: unassigned — รอ admin assign
      const userRole: UserRole = "unassigned";
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
          role: userRole,
        });

      if (insertError) {
        console.error("[user-store] Error creating profile:", insertError.message);
      }

      invalidateCache();

      return {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
        role: userRole,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      createdAt: profile.created_at,
      lastLogin: profile.last_login,
    };
  } catch (err: any) {
    console.error("[user-store] authenticateUser error:", err?.message || err);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserPublic | null> {
  const profiles = await fetchAllProfiles();
  const profile = profiles.find((p) => p.email === email);
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    createdAt: profile.created_at,
    avatar: profile.avatar || undefined,
  };
}

export async function getUserById(id: string): Promise<UserPublic | null> {
  const profiles = await fetchAllProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    createdAt: profile.created_at,
    avatar: profile.avatar || undefined,
  };
}

export async function getUserPublicById(id: string): Promise<UserPublic | null> {
  return getUserById(id);
}

export async function listUsers(): Promise<UserPublic[]> {
  const profiles = await fetchAllProfiles();
  return profiles.map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    createdAt: p.created_at,
    lastLogin: p.last_login,
    avatar: p.avatar || undefined,
  }));
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole
): Promise<UserPublic> {
  const supabase = createAdminClient();

  // Check duplicate
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error(`User with email ${email} already exists`);
  }

  // Create in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Failed to create user");

  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authData.user.id,
      name,
      role,
    });

  if (profileError) {
    console.error("[user-store] Profile creation error:", profileError.message);
  }

  invalidateCache();

  return {
    id: authData.user.id,
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  };
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; role?: UserRole; password?: string }
): Promise<UserPublic> {
  const supabase = createAdminClient();

  // Update profile fields
  const profileUpdates: any = {};
  if (updates.name) profileUpdates.name = updates.name;
  if (updates.role) profileUpdates.role = updates.role;

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", id);

    if (profileError) {
      console.error("[user-store] Profile update error:", profileError.message);
    }
  }

  // Update password via Supabase Auth
  if (updates.password) {
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      password: updates.password,
    });

    if (authError) {
      console.error("[user-store] Password update error:", authError.message);
    }
  }

  // Update email
  if (updates.email) {
    const { error: emailError } = await supabase.auth.admin.updateUserById(id, {
      email: updates.email,
    });

    if (emailError) {
      console.error("[user-store] Email update error:", emailError.message);
    }
  }

  invalidateCache();

  const user = await getUserPublicById(id);
  if (!user) throw new Error(`User not found: ${id}`);

  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = createAdminClient();

  // Delete from Supabase Auth (cascades to profiles via trigger)
  const { error: authError } = await supabase.auth.admin.deleteUser(id);

  if (authError) throw new Error(authError.message);

  invalidateCache();
}
