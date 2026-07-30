// ============================================================
// Siam Heritage - Authentication & Authorization Types
// ============================================================

export type UserRole = "unassigned" | "writer" | "editor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string; // sha256 hashed
  createdAt: string;    // ISO date
  lastLogin?: string;
  avatar?: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

// Session token payload (stored in JWT)
export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number; // Unix timestamp
}

// Permission system
export type Permission =
  | "article:create"
  | "article:edit_own"
  | "article:edit_any"
  | "article:delete_own"
  | "article:delete_any"
  | "article:publish"
  | "article:unpublish"
  | "article:review"
  | "user:list"
  | "user:create"
  | "user:edit_role"
  | "user:delete"
  | "settings:view"
  | "settings:edit"
  | "admin:access";

// Role -> Permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  unassigned: [],
  writer: [
    "article:create",
    "article:edit_own",
    "article:delete_own",
  ],
  editor: [
    "article:create",
    "article:edit_own",
    "article:edit_any",
    "article:delete_own",
    "article:delete_any",
    "article:publish",
    "article:unpublish",
    "article:review",
    "user:list",
  ],
  admin: [
    "article:create",
    "article:edit_own",
    "article:edit_any",
    "article:delete_own",
    "article:delete_any",
    "article:publish",
    "article:unpublish",
    "article:review",
    "user:list",
    "user:create",
    "user:edit_role",
    "user:delete",
    "settings:view",
    "settings:edit",
    "admin:access",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const USER_ROLES: UserRole[] = ["unassigned", "writer", "editor", "admin"];

export const ROLE_LABELS: Record<UserRole, string> = {
  unassigned: "รออนุมัติ",
  writer: "นักเขียน",
  editor: "บรรณาธิการ",
  admin: "ผู้ดูแลระบบ",
};

export const ROLE_LABELS_EN: Record<UserRole, string> = {
  unassigned: "Unassigned",
  writer: "Writer",
  editor: "Editor",
  admin: "Admin",
};
