// ============================================================
// Admin: New Article
// ============================================================

"use client";

import { useRouter } from "next/navigation";
import ArticleEditor from "@/components/admin/article-editor";
import { adminFetch } from "@/lib/use-admin-fetch";
import type { ArticleFormData } from "@/components/admin/article-editor";

export default function NewArticlePage() {
  const router = useRouter();

  const handleSave = async (data: ArticleFormData) => {
    const res = await adminFetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to create article");
    }

    // Redirect to edit page
    router.push(`/admin/articles/edit/${data.slug}`);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-white">เขียนบทความใหม่</h1>
        <p className="text-white/50 text-sm mt-1">สร้างบทความภาษาไทยฉบับเต็ม</p>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        <ArticleEditor onSave={handleSave} />
      </div>
    </div>
  );
}
