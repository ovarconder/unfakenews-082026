// ============================================================
// PUT, DELETE /api/admin/users/[id]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-service";
import { updateUser, deleteUser, getUserPublicById } from "@/lib/user-store";

// ============================================================
// GET /api/admin/users/[id]
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed } = await requirePermission("user:list");
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await getUserPublicById(id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// ============================================================
// PUT /api/admin/users/[id]
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed, user: currentUser } = await requirePermission("user:edit_role");
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updates: { name?: string; email?: string; role?: string; password?: string } = {};

    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;
    if (body.role) updates.role = body.role;
    if (body.password) updates.password = body.password;

    // Prevent removing the last admin
    if (body.role && id === currentUser?.id && body.role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change your own role from admin" },
        { status: 403 }
      );
    }

    const user = await updateUser(id, updates as any);

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/users/[id]
// ============================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed, user: currentUser } = await requirePermission("user:delete");
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent deleting yourself
  if (id === currentUser?.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 403 }
    );
  }

  try {
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
