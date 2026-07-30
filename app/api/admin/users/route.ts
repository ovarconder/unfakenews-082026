// ============================================================
// GET, POST /api/admin/users
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-service";
import { listUsers, createUser } from "@/lib/user-store";

// ============================================================
// GET /api/admin/users
// ============================================================

export async function GET() {
  const { allowed } = await requirePermission("user:list");
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await listUsers();
  return NextResponse.json({ users, total: users.length });
}

// ============================================================
// POST /api/admin/users
// ============================================================

export async function POST(request: NextRequest) {
  const { allowed } = await requirePermission("user:create");
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "email, name, password, and role are required" },
        { status: 400 }
      );
    }

    const user = await createUser(email, name, password, role);

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
