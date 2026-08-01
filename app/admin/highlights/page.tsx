// ============================================================
// Admin: Highlight Manager
// ============================================================
// จัดการบทความที่ "เด่น/ไฮไลต์" ที่แสดงบนหน้าหลัก (Highlight section)
// - ติ๊กตั้ง / เอาออกได้
// - มีช่อง search
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HighlightsClient from "./highlights-client";
import type { ArticleMaster } from "@/lib/types";

const SESSION_KEY = "siam_admin_session";

export default function AdminHighlightsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [articles, setArticles] = useState<ArticleMaster[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth from sessionStorage
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.push("/admin/login");
      return;
    }

    let userData;
    try {
      userData = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      router.push("/admin/login");
      return;
    }

    setUser(userData);

    // Fetch articles
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles) {
          setArticles(data.articles);
        }
      })
      .catch((err) => console.error("Failed to load articles:", err))
      .finally(() => setLoading(false));

    // Fetch category names
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data: any) => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) {
          data.forEach((c: any) => { map[c.id] = c.name_th || c.name_en || c.id; });
        } else if (data.categories) {
          data.categories.forEach((c: any) => { map[c.id] = c.name_th || c.name_en || c.id; });
        }
        setCategoryMap(map);
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Only editor/admin allowed
  if (!["admin", "editor"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/50">คุณไม่มีสิทธิ์จัดการไฮไลต์</p>
      </div>
    );
  }

  return (
    <HighlightsClient
      articles={articles}
      categoryMap={categoryMap}
      userRole={user.role}
    />
  );
}
