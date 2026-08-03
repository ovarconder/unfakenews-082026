"use client";

// ============================================================
// Hero Slide Editor Component
// ============================================================
// ใช้สำหรับทั้งสร้างใหม่และแก้ไข
// รองรับ: กรอกข้อมูลเอง หรือเลือกบทความมาเป็น slide

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  X,
  AlertCircle,
  Check,
  Image,
  Upload,
  Search,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import type { ArticleMaster } from "@/lib/types";

// ============================================================
// Types
// ============================================================

interface HeroSlideFormData {
  title_th: string;
  title_en: string;
  subtitle_th: string;
  subtitle_en: string;
  image_url: string;
  cta_text_th: string;
  cta_text_en: string;
  cta_link: string;
  is_active: boolean;
}

interface HeroSlideEditorProps {
  initialData?: HeroSlideFormData & { id?: string };
}

// ============================================================
// Image Upload
// ============================================================

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  return data.url;
}

// ============================================================
// Main Component
// ============================================================

export function HeroSlideEditor({ initialData }: HeroSlideEditorProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  // Form state
  const [formData, setFormData] = useState<HeroSlideFormData>({
    title_th: initialData?.title_th || "",
    title_en: initialData?.title_en || "",
    subtitle_th: initialData?.subtitle_th || "",
    subtitle_en: initialData?.subtitle_en || "",
    image_url: initialData?.image_url || "",
    cta_text_th: initialData?.cta_text_th || "",
    cta_text_en: initialData?.cta_text_en || "",
    cta_link: initialData?.cta_link || "",
    is_active: initialData?.is_active ?? true,
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Article selector
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [articles, setArticles] = useState<ArticleMaster[]>([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Load articles list for selector
  const loadArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      console.error("Failed to load articles:", err);
    } finally {
      setLoadingArticles(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (!articleSearch) return true;
    const q = articleSearch.toLowerCase();
    return (
      a.originalTitle.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.category || "").toLowerCase().includes(q)
    );
  });

  // เลือกบทความ: เอาชื่อบทความ + ภาพปก + slug
  const selectArticle = (article: ArticleMaster) => {
    setFormData({
      ...formData,
      title_th: article.originalTitle,
      title_en: "", // ต้องกรอกเอง
      image_url: article.imageUrl || formData.image_url,
      cta_link: `/th/articles/${article.slug}`,
      cta_text_th: "อ่านต่อ",
      cta_text_en: "Read more",
    });
    setShowArticleSelector(false);
  };

  // ============================================================
  // Save
  // ============================================================

  const handleSave = async () => {
    // Validate
    if (!formData.title_th.trim()) {
      setError("กรุณากรอกหัวข้อภาษาไทย");
      return;
    }
    if (!formData.title_en.trim()) {
      setError("กรุณากรอกหัวข้อภาษาอังกฤษ");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let res;

      if (isEditing) {
        // Update existing
        res = await fetch("/api/hero-slides", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initialData.id, ...formData }),
        });
      } else {
        // Create new
        res = await fetch("/api/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save slide");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/hero-slides");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Handle image upload
  // ============================================================

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadImage(file);
        setFormData({ ...formData, image_url: url });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm">
          <Check size={16} />
          {isEditing ? "บันทึกสำเร็จ!" : "สร้าง Slide สำเร็จ! กำลังกลับไปยังรายการ..."}
        </div>
      )}

      {/* ======== เลือกจากบทความ ======== */}
      {!isEditing && (
        <div className="rounded-lg border border-dashed border-amber-300/30 bg-amber-300/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <FileText size={16} className="text-amber-300" />
                เลือกจากบทความที่มีอยู่
              </h3>
              <p className="text-white/40 text-xs mt-1">
                ดึงชื่อบทความ ภาพปก และลิงก์มาใส่ใน Slide โดยอัตโนมัติ
              </p>
            </div>
            <button
              onClick={() => {
                loadArticles();
                setShowArticleSelector(!showArticleSelector);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-all text-sm"
            >
              <Search size={14} />
              {showArticleSelector ? "ปิด" : "เลือกบทความ"}
            </button>
          </div>

          {/* Article Selector */}
          {showArticleSelector && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                placeholder="ค้นหาบทความ..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
              />
              <div className="max-h-64 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2">
                {loadingArticles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full" />
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <p className="text-white/40 text-center py-8 text-sm">ไม่พบบทความ</p>
                ) : (
                  filteredArticles.map((article) => (
                    <button
                      key={article.slug}
                      onClick={() => selectArticle(article)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all text-left"
                    >
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-white/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {article.originalTitle}
                        </p>
                        <p className="text-white/40 text-xs truncate">
                          /{article.slug}
                          {article.category && (
                            <>
                              <span className="mx-1">·</span>
                              {article.category}
                            </>
                          )}
                        </p>
                      </div>
                      <ExternalLink size={14} className="text-amber-300/50 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== Title (TH/EN) ======== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">
            หัวข้อภาษาไทย <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title_th}
            onChange={(e) => setFormData({ ...formData, title_th: e.target.value })}
            placeholder="หัวข้อภาษาไทย..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">
            หัวข้อภาษาอังกฤษ <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title_en}
            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
            placeholder="Title in English..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 transition-all"
          />
        </div>
      </div>

      {/* ======== Subtitle (TH/EN) ======== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">คำอธิบายสั้นภาษาไทย</label>
          <input
            type="text"
            value={formData.subtitle_th}
            onChange={(e) => setFormData({ ...formData, subtitle_th: e.target.value })}
            placeholder="คำอธิบายสั้นภาษาไทย..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">คำอธิบายสั้นภาษาอังกฤษ</label>
          <input
            type="text"
            value={formData.subtitle_en}
            onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
            placeholder="Subtitle in English..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 transition-all"
          />
        </div>
      </div>

      {/* ======== Image ======== */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
          <Image size={16} />
          รูปภาพ Slide
        </label>

        <ImageUploader
          value={formData.image_url}
          onChange={(url) => setFormData({ ...formData, image_url: url })}
          previewHeight={220}
          folder="hero-slides"
        />
      </div>

      {/* ======== CTA ======== */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <label className="block text-white/80 text-sm font-medium mb-3">
          ปุ่ม Call-to-Action (CTA)
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/50 text-xs mb-1">ข้อความภาษาไทย</label>
            <input
              type="text"
              value={formData.cta_text_th}
              onChange={(e) => setFormData({ ...formData, cta_text_th: e.target.value })}
              placeholder="อ่านต่อ, ดูเพิ่มเติม..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-1">ข้อความภาษาอังกฤษ</label>
            <input
              type="text"
              value={formData.cta_text_en}
              onChange={(e) => setFormData({ ...formData, cta_text_en: e.target.value })}
              placeholder="Read more, Learn more..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-white/50 text-xs mb-1">ลิงก์ปลายทาง</label>
          <input
            type="text"
            value={formData.cta_link}
            onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
            placeholder="/th/articles/article-slug หรือ https://..."
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm font-mono"
          />
          <p className="text-white/30 text-[10px] mt-1">
            ถ้าเลือกจากบทความ ลิงก์จะถูกตั้งอัตโนมัติ สามารถแก้ไขเองได้
          </p>
        </div>
      </div>

      {/* ======== Active Toggle ======== */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
        </label>
        <span className="text-white/70 text-sm">แสดง Slide นี้</span>
      </div>

      {/* ======== Actions ======== */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้าง Slide"}
        </button>

        <button
          onClick={() => router.push("/admin/hero-slides")}
          className="px-4 py-2.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 transition-all text-sm"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
