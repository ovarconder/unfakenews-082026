// ============================================================
// Admin Dashboard
// ============================================================
// Client component — ใช้ session จาก sessionStorage

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import DashboardClient from "./dashboard-client";

const SESSION_KEY = "siam_admin_session";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalUsers: 0,
    totalTranslations: 0,
    totalLanguages: 15,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Get user from sessionStorage
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        window.location.href = "/admin/login";
        return;
      }

      let userData;
      try {
        userData = JSON.parse(raw);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = "/admin/login";
        return;
      }

      setUser(userData);

      // Get stats from Supabase using service role (bypass RLS)
      try {
        const supabase = createClient();
        const [{ count: totalArticles }, { count: totalUsers }, { count: totalTranslations }] =
          await Promise.all([
            supabase.from("articles").select("*", { count: "exact", head: true }).eq("is_published", true),
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("translations").select("*", { count: "exact", head: true }),
          ]);

        setStats({
          totalArticles: totalArticles || 0,
          totalUsers: totalUsers || 0,
          totalTranslations: totalTranslations || 0,
          totalLanguages: 15,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
      
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardClient
      user={user}
      stats={stats}
    />
  );
}
