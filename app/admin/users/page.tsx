// ============================================================
// Admin: User Management
// ============================================================

import { listUsers } from "@/lib/user-store";
import { getCurrentSession } from "@/lib/auth-service";
import { hasPermission } from "@/lib/auth-types";
import UserListClient from "./user-list-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const { user } = await getCurrentSession();
  const users = await listUsers();
  const canCreate = user ? hasPermission(user.role, "user:create") : false;
  const canEditRole = user ? hasPermission(user.role, "user:edit_role") : false;

  return (
    <UserListClient
      users={users}
      currentUserId={user?.id || ""}
      canCreate={canCreate}
      canEditRole={canEditRole}
    />
  );
}
