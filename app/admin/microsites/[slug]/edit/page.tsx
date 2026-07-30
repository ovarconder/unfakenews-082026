// ============================================================
// Admin: Edit Microsite Settings
// ============================================================
// รองรับ inherit from main + language tier override
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Check } from "lucide-react";
import { adminFetch } from "@/lib/use-admin-fetch";
import { ALL_LOCALES, LOCALE_NAMES } from "@/lib/locales";

interface MicrositeForm {
  name: string;
  description: string;
  primary_color: string;
  background_color: string;
  background_secondary: string;
  card_color: string;
  logo_url: string;
  inherit_from_main: boolean;
  locale_tiers: Record<string, "0" | "1" | "2"> | null;
  show_in_main_nav: boolean;
  main_site_visible: boolean;
  show_main_site_link: boolean;
  show_author: boolean;
  meta_title: string;
  meta_description: string;
  about_content_th: string;
  about_content_en: string;
  contact_email: string;
}

export default function EditMicrositePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [slug, setSlug] = useState("");
  const [form, setForm] = useState<MicrositeForm>({
    name: "",
    description: "",
    primary_color: "#fbbf24",
    background_color: "#060e1a",
    background_secondary: "#0a1628",
    card_color: "#0f1f3a",
    logo_url: "",
    inherit_from_main: true,
    locale_tiers: null,
    show_in_main_nav: false,
    main_site_visible: false,
    show_main_site_link: true,
    show_author: true,
    meta_title: "",
    meta_description: "",
    about_content_th: "",
    about_content_en: "",
    contact_email: "",
  });

  useEffect(() => {
    async function init() {
      const { slug: slugParam } = await params;
      setSlug(slugParam);
      
      try {
        const res = await adminFetch(`/api/admin/microsites/${slugParam}`);
        const data = await res.json();
        
        if (!data.microsite) {
          setError("Microsite not found");
          return;
        }

        const ms = data.microsite;
        setForm({
          name: ms.name || "",
          description: ms.description || "",
          primary_color: ms.primary_color || "#fbbf24",
          background_color: ms.background_color || "#060e1a",
          background_secondary: ms.background_secondary || "#0a1628",
          card_color: ms.card_color || "#0f1f3a",
          logo_url: ms.logo_url || "",
          inherit_from_main: ms.inherit_from_main ?? true,
          locale_tiers: ms.locale_tiers || null,
          show_in_main_nav: ms.show_in_main_nav || false,
          main_site_visible: ms.main_site_visible || false,
          show_main_site_link: ms.show_main_site_link ?? true,
          show_author: ms.show_author ?? true,
          meta_title: ms.meta_title || "",
          meta_description: ms.meta_description || "",
          about_content_th: ms.about_content_th || "",
          about_content_en: ms.about_content_en || "",
          contact_email: ms.contact_email || "",
        });
      } catch (err) {
        setError("Failed to load microsite");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params]);

  function handleChange(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await adminFetch(`/api/admin/microsites/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          logo_url: form.logo_url || null,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          about_content_th: form.about_content_th || null,
          about_content_en: form.about_content_en || null,
          contact_email: form.contact_email || null,
          locale_tiers: form.inherit_from_main ? null : form.locale_tiers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update microsite");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

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
          <h1 className="text-base sm:text-2xl font-bold text-white">แก้ไข Microsite</h1>
          <p className="text-white/50 mt-1">
            <span className="font-mono text-amber-300/70">/{slug}</span> — {form.name}
          </p>
        </div>
        <Link
          href={`/${slug}/th`}
          target="_blank"
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 hover:text-amber-200 hover:bg-white/10 text-sm transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          ดูหน้าเว็บ
        </Link>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-300 text-sm">บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว</p>
        </div>
      )}

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
            <div>
              <label className="block text-white/70 text-sm mb-1.5">ชื่อ Microsite</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Slug</label>
              <input
                type="text"
                value={slug}
                disabled
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628]/50 border border-white/10 text-white/40 text-sm font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-1.5">คำอธิบาย</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
              rows={2}
            />
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">สีและธีม</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">สีหลัก</label>
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
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono"
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
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono"
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
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono"
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
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white/70 text-sm font-mono"
                />
              </div>
            </div>
          </div>

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

        {/* Inheritance */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">สืบทอดค่าจาก Main Site</h2>
          <p className="text-white/50 text-xs">
            ถ้าเปิดใช้งาน Microsite จะใช้ค่าสี โลโก้ SEO และภาษาเหมือน Main Site โดยอัตโนมัติ
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => handleChange("inherit_from_main", !form.inherit_from_main)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                form.inherit_from_main ? "bg-amber-400" : "bg-white/20"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.inherit_from_main ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
            <div>
              <span className="text-white text-sm">สืบทอดค่าจาก Main Site</span>
              <p className="text-white/40 text-xs">สี โลโก้ SEO ภาษา และการตั้งค่าอื่นๆ</p>
            </div>
          </label>

          {!form.inherit_from_main && (
            <>
              {/* Language Tiers Override */}
              <div className="border-t border-white/5 pt-5 mt-5">
                <p className="text-white/50 text-xs mb-3">ภาษา (Language Tiers)</p>
                <p className="text-white/30 text-[10px] mb-4">กำหนด Tier ภาษาเฉพาะของ Microsite นี้ (ถ้าไม่เลือกจะแสดงทั้งหมด)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {ALL_LOCALES.map((locale) => {
                    const tiers = form.locale_tiers || {};
                    const tier = tiers[locale] || "1";
                    const label = LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES];
                    return (
                      <div
                        key={locale}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${
                          tier === "0"
                            ? "bg-white/[0.02] border border-white/5 opacity-50"
                            : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/40 uppercase font-mono w-5">{locale}</span>
                          <span className={`text-xs ${tier === "0" ? "text-white/30" : "text-white"}`}>
                            {label?.native || locale}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => {
                              const newTiers = { ...tiers, [locale]: "1" as const };
                              handleChange("locale_tiers", newTiers);
                            }}
                            className={`px-1.5 py-0.5 text-[9px] rounded transition-all font-medium ${
                              tier === "1"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                                : "bg-white/5 text-white/30 border border-transparent hover:bg-white/10 hover:text-white/60"
                            }`}
                          >
                            T1
                          </button>
                          <button
                            onClick={() => {
                              const newTiers = { ...tiers, [locale]: "2" as const };
                              handleChange("locale_tiers", newTiers);
                            }}
                            className={`px-1.5 py-0.5 text-[9px] rounded transition-all font-medium ${
                              tier === "2"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                                : "bg-white/5 text-white/30 border border-transparent hover:bg-white/10 hover:text-white/60"
                            }`}
                          >
                            T2
                          </button>
                          <button
                            onClick={() => {
                              const newTiers = { ...tiers, [locale]: "0" as const };
                              handleChange("locale_tiers", newTiers);
                            }}
                            className={`px-1.5 py-0.5 text-[9px] rounded transition-all font-medium ${
                              !tier || tier === "0"
                                ? "bg-red-500/15 text-red-300 border border-red-400/30"
                                : "bg-white/5 text-white/30 border border-transparent hover:bg-white/10 hover:text-white/60"
                            }`}
                          >
                            ปิด
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* About & Contact */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">เกี่ยวกับ และติดต่อ</h2>

          <div>
            <label className="block text-white/70 text-sm mb-1.5">เนื้อหา "เกี่ยวกับ" (ภาษาไทย)</label>
            <textarea
              value={form.about_content_th}
              onChange={(e) => handleChange("about_content_th", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">เนื้อหา "เกี่ยวกับ" (ภาษาอังกฤษ)</label>
            <textarea
              value={form.about_content_en}
              onChange={(e) => handleChange("about_content_en", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">อีเมลติดต่อ</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => handleChange("contact_email", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm focus:border-amber-300/50 focus:outline-none transition-colors"
              placeholder="hello@example.com"
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
                className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-amber-400"
              />
              <span className="text-white text-sm">แสดงลิงก์ไป Main Site</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_in_main_nav}
                onChange={(e) => handleChange("show_in_main_nav", e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-amber-400"
              />
              <span className="text-white text-sm">แสดงใน Navigation ของ Main Site</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_author}
                onChange={(e) => handleChange("show_author", e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-amber-400"
              />
              <span className="text-white text-sm">แสดงชื่อผู้เขียน</span>
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg">SEO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Meta Title</label>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => handleChange("meta_title", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Meta Description</label>
              <input
                type="text"
                value={form.meta_description}
                onChange={(e) => handleChange("meta_description", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1628] border border-white/10 text-white text-sm"
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
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={18} />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
          <Link
            href="/admin/microsites"
            className="px-6 py-3 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm"
          >
            กลับไปรายการ
          </Link>
        </div>
      </form>
    </div>
  );
}
