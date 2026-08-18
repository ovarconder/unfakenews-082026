// ============================================================
// Admin: View Articles for a Specific Microsite
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, ExternalLink } from "lucide-react";
import { adminFetch } from "@/lib/use-admin-fetch";
import type { ArticleMaster } from "@/lib/types";

export default function MicrositeArticlesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [microsite, setMicrosite] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { slug: slugParam } = await params;
      setSlug(slugParam);

      try {
        const msRes = await adminFetch(`/api/admin/microsites/${slugParam}`);
        const msData = await msRes.json();
        setMicrosite(msData.microsite);
      } catch (err) {
        console.error("Failed to load microsite:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/microsites"
          className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">
            บทความ: {microsite?.name || slug}
          </h1>
          <p className="text-white/50 mt-1">จัดการบทความของ microsite นี้</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/${slug}/th/articles`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 hover:text-amber-200 hover:bg-white/10 text-sm transition-all"
          >
            <ExternalLink size={14} />
            ดูหน้า Articles
          </Link>
          <Link
            href={`/admin/articles/new?microsite=${slug}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 text-[#0a1628] font-semibold hover:bg-amber-300 transition-colors text-sm"
          >
            <Plus size={16} />
            เขียนบทความใหม่
          </Link>
        </div>
      </div>

      {/* Note */}
      <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-300 text-sm">
          บทความของ microsite นี้จะปรากฏเฉพาะใน <code className="text-blue-200 font-mono text-xs bg-blue-500/20 px-1.5 py-0.5 rounded">/{slug}/...</code> เท่านั้น 
          และจะไม่แสดงในหน้าแรกของ UnFake News
        </p>
      </div>

      {/* Articles list - use the existing admin articles page with filter */}
      <p className="text-white/50 text-sm mb-4">
        ใช้หน้า <Link href="/admin/articles" className="text-amber-300 hover:text-amber-200 underline">จัดการบทความ</Link> หลัก 
        โดยเลือก microsite จากตัวกรอง (เร็วๆ นี้)
      </p>

      {/* Placeholder - will link to filtered view */}
      <div className="text-center py-20 rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10">
        <FileText size={48} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/60 mb-2">การจัดการบทความเฉพาะ microsite</p>
        <p className="text-white/40 text-sm mb-6">
          ไปที่หน้า Articles หลักและเลือก microsite filter
        </p>
        <Link
          href={`/admin/articles`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-400 text-[#0a1628] font-semibold hover:bg-amber-300 transition-colors"
        >
          <FileText size={18} />
          ไปยังหน้าจัดการบทความ
        </Link>
      </div>
    </div>
  );
}