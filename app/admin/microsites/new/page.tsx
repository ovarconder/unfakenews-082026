// ============================================================
// Admin: Create New Microsite
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Check } from "lucide-react";
import { adminFetch } from "@/lib/use-admin-fetch";

export default function NewMicrositePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [slugPreview, setSlugPreview] = useState("");
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    primary_color: "#fbbf24",
    background_color: "#060e1a",
    background_secondary: "#0a1628",
    card_color: "#0f1f3a",
    logo_url: "",
    show_in_main_nav: false,
    main_site_visible: false,
    show_main_site_link: true,
    show_author: true,
    meta_title: "",
    meta_description: "",
  });

  function handleChange(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "slug") {
      setSlugPreview(value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, ""));
    }
    if (field === "name" && !form.slug) {
      const generatedSlug = value.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F\s-]/g, "").trim().replace(/\s+/g, "-");
      setSlugPreview(generatedSlug);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const slug = slugPreview || form.slug;

    try {
      const res = await adminFetch("/api/admin/microsites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug,
          logo_url: form.logo_url || null,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create microsite");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/microsites");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">สร้าง Microsite สำเร็จ!</h2>
          <p className="text-white/50">กำลังนำกลับไปยังหน้า Microsites...</p>
        </div>
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
          <h1 className="text-base sm:text-2xl font-bold text-white">สร้าง Microsite ใหม่</h1>
          <p className="text-white/50 mt-1">ตั้งค่าไมโครไซต์ใหม่ภายใต้ {window.location.hostname}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Basic Info */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">ข้อมูลพื้นฐาน</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-white/70 text-sm mb-1.5">
                ชื่อ Microsite <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
                placeholder="เช่น Thai Defend, Travel Guide"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-white/70 text-sm mb-1.5">
                Slug / URL <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-sm">/</span>
                <input
                  type="text"
                  value={slugPreview}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors font-mono"
                  placeholder="thai-defend"
                  required
                />
              </div>
              {slugPreview && (
                <p className="text-white/30 text-xs mt-1">
                  URL: https://siamheritage.org/<span className="text-amber-300/70">{slugPreview}</span>/th/
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/70 text-sm mb-1.5">คำอธิบาย</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
              placeholder="คำอธิบายสั้นๆ เกี่ยวกับ microsite นี้"
              rows={2}
            />
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">การตั้งค่าสีและธีม</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">สีหลัก (Primary)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.primary_color}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono focus:border-amber-300/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">สีพื้นหลัง</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.background_color}
                  onChange={(e) => handleChange("background_color", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.background_color}
                  onChange={(e) => handleChange("background_color", e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono focus:border-amber-300/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">สีพื้นหลังรอง</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.background_secondary}
                  onChange={(e) => handleChange("background_secondary", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.background_secondary}
                  onChange={(e) => handleChange("background_secondary", e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono focus:border-amber-300/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">สี Card</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.card_color}
                  onChange={(e) => handleChange("card_color", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.card_color}
                  onChange={(e) => handleChange("card_color", e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono focus:border-amber-300/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-white/70 text-sm mb-1.5">URL Logo</label>
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) => handleChange("logo_url", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
              placeholder="/images/logo/my-logo.png"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">การตั้งค่า</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_main_site_link}
                onChange={(e) => handleChange("show_main_site_link", e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-amber-400 focus:ring-amber-400/30"
              />
              <div>
                <p className="text-white text-sm">แสดงลิงก์ไป Main Site</p>
                <p className="text-white/40 text-xs">มีลิงก์กลับไปยัง UnFake Newsใน navbar และ footer</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_in_main_nav}
                onChange={(e) => handleChange("show_in_main_nav", e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-amber-400 focus:ring-amber-400/30"
              />
              <div>
                <p className="text-white text-sm">แสดงใน Navigation ของ Main Site</p>
                <p className="text-white/40 text-xs">เพิ่มลิงก์ไปยัง microsite นี้ใน navbar ของ UnFake News</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_author}
                onChange={(e) => handleChange("show_author", e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-amber-400 focus:ring-amber-400/30"
              />
              <div>
                <p className="text-white text-sm">แสดงชื่อผู้เขียน</p>
                <p className="text-white/40 text-xs">แสดงชื่อผู้เขียนในบทความของ microsite นี้</p>
              </div>
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">SEO (ไม่บังคับ)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Meta Title</label>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => handleChange("meta_title", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
                placeholder="Thai Defend - ข่าวสารและข้อมูล"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Meta Description</label>
              <input
                type="text"
                value={form.meta_description}
                onChange={(e) => handleChange("meta_description", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
                placeholder="คำอธิบายสำหรับ SEO"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-400 text-[#0a1628] font-semibold hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <Save size={18} />
                สร้าง Microsite
              </>
            )}
          </button>
          <Link
            href="/admin/microsites"
            className="px-6 py-3 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}