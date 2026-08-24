// ============================================================
// Admin: Article List
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArticleListClient from "./article-list-client";
import type { ArticleMaster } from "@/lib/types";

const SESSION_KEY = "siam_admin_session";

export default function AdminArticlesPage() {
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

    // Fetch articles and permissions from API
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
      .then(res => res.json())
      .then((data: any) => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) {
          data.forEach((c: any) => { map[c.id] = c.nameTH || c.nameEN || c.id; });
        } else if (data.categories) {
          data.categories.forEach((c: any) => { map[c.id] = c.nameTH || c.nameEN || c.id; });
        }
        setCategoryMap(map);
      })
      .catch(err => console.error("Failed to load categories:", err));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ArticleListClient
      articles={articles}
      categoryMap={categoryMap}
      currentUserId={user.id}
      userRole={user.role}
      canCreate={true}
      canDelete={true}
    />
  );
}

