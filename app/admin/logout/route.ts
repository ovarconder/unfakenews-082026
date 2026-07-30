// ============================================================
// GET /admin/logout
// ============================================================

import { redirect } from "next/navigation";
import { logout } from "@/lib/auth-service";

export async function GET() {
  await logout();
  redirect("/admin/login");
}
