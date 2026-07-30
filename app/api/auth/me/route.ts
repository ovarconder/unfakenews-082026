// ============================================================
// GET /api/auth/me
// ============================================================

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-service";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to get session" },
      { status: 500 }
    );
  }
}
