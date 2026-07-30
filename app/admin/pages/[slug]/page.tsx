// ============================================================
// Admin: Static Page Editor
// ============================================================

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { File, Save, ArrowLeft, Eye, Check, AlertCircle, X } from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const settings = useSettings();
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage";
  const slug = params.slug as string;

  const DEFAULT_PAGE_DATA: Record<string, { title: string; content: string }> = {
    about: {
      title: "เกี่ยวกับเรา",
      content: `## เกี่ยวกับ ${siteName}\n\nเนื้อหาเกี่ยวกับ ${siteName}...`,
    },
    contact: {
      title: "ติดต่อเรา",
      content: "## ติดต่อเรา\n\nช่องทางการติดต่อ...",
    },
    privacy: {
      title: "นโยบายความเป็นส่วนตัว",
      content: "## นโยบายความเป็นส่วนตัว\n\nรายละเอียดนโยบาย...",
    },
    terms: {
      title: "ข้อกำหนดการใช้งาน",
      content: "## ข้อกำหนดการใช้งาน\n\nรายละเอียดข้อกำหนด...",
    },
  };

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (slug === "new") {
      setIsNew(true);
      setTitle("");
      setContent("");
    } else {
      const data = DEFAULT_PAGE_DATA[slug];
      if (data) {
        setTitle(data.title);
        setContent(data.content);
      } else {
        setError(`ไม่พบหน้า "${slug}"`);
      }
    }
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Simulate save
    await new Promise((r) => setTimeout(r, 500));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pages"
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-white">
              {isNew ? "สร้างหน้าใหม่" : `แก้ไข: ${title}`}
            </h1>
            <p className="text-white/50 text-sm mt-1 font-mono">/{slug}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm mb-4">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm mb-4">
          <Check size={16} />
          บันทึกสำเร็จ!
        </div>
      )}

      {/* Editor */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        <div className="mb-4">
          <label className="block text-white/70 text-sm mb-2">ชื่อหน้า</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ชื่อหน้า..."
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50"
          />
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">เนื้อหา (Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="เขียนเนื้อหาที่นี่ (รองรับ Markdown)..."
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 font-mono text-sm resize-y"
          />
        </div>
      </div>
    </div>
  );
}
