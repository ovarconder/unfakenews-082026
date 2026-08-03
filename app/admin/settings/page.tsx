// ============================================================
// Admin: Settings Page - Branding, Meta, Security
// ============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Save,
  Shield,
  Globe,
  Database,
  Key,
  RefreshCw as RefreshCwIcon,
  Check,
  AlertCircle,
  Palette,
  Image,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Link,
  Hash,
  Server,
  HardDrive,
  Coffee,
  QrCode,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { adminFetch } from "@/lib/use-admin-fetch";
import { ALL_LOCALES, LOCALE_NAMES } from "@/lib/locales";

const SESSION_KEY = "siam_admin_session";

interface SiteSettings {
  name: string;
  tagline: string;
  url: string;
  logo: string;
  logoFull?: string;
  favicon: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundColorSecondary: string;
  cardColor: string;
  cardBorderColor: string;
  textColor: string;
  textColorMuted: string;
  sidebarColor: string;
  headerColor: string;
  successColor: string;
  errorColor: string;

  copyright: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterHandle?: string;
  googleAnalyticsId?: string;
  adsenseId?: string;
  adsenseSlotHomepage?: string;
  adsenseSlotSidebar?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  email?: string;
  showAuthor: boolean;
  enableSocialShare: boolean;
  maintenanceMode: boolean;
  localeTiers: Record<string, "0" | "1" | "2">;
  // OAuth Keys for login
  googleOAuthClientId?: string;
  googleOAuthClientSecret?: string;
  facebookOAuthClientId?: string;
  facebookOAuthClientSecret?: string;
  // Translation API Settings
  translationApiProvider?: string;
  claudeApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  // Support section
  supportEnabled: boolean;
  supportQr?: string;
  supportTitle?: string;
  supportDescription?: string;
  supportAccountName?: string;
  supportAccountNumber?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    // Get user from sessionStorage (consistent with admin layout)
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const userData = JSON.parse(raw);
        setUser(userData);
      } catch {
        // If session is invalid, redirect to login
        window.location.href = "/admin/login";
        return;
      }
    } else {
      setLoading(false);
      return;
    }

    // Fetch settings from API using adminFetch
    adminFetch("/api/admin/settings")
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`API ${r.status}: ${text}`);
        }
        return r.json();
      })
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
          setSources(data.sources || {});
        }
        else throw new Error("No settings in response");
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setError("Failed to load settings: " + err.message);
        setLoading(false);
      });
  }, []);

  // Use ref to always have the latest settings in handleSave
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const handleSave = useCallback(async () => {
    const currentSettings = settingsRef.current;
    if (!currentSettings) return;

    // Debug: log what we're about to save
    console.log("[Settings] Saving:", { maintenanceMode: currentSettings.maintenanceMode });

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentSettings),
      });
      const text = await res.text();

      // Debug: log raw response
      console.log("[Settings] Response:", res.status, text.substring(0, 500));

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`API ${res.status}: Response is not JSON (HTML page returned — check middleware or server error). First 200 chars: ${text.substring(0, 200)}`);
      }
      if (res.ok) {
        setSuccess("บันทึกการตั้งค่าเรียบร้อย");
      } else {
        setError(data.error || "Failed to save");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, []); // No dependency on settings now

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setPwSaving(true);
    try {
      const res = await adminFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("เปลี่ยนรหัสผ่านเรียบร้อย");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Failed to change password");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const updateField = (field: keyof SiteSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleResetTranslations = async () => {
    if (!confirm("แน่ใจว่าจะรีเซ็ตคำแปลทั้งหมด? บทความจะต้องแปลใหม่")) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/translate-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`กำลังแปลบทความทั้งหมดใหม่ (${data.count || 0} บทความ)`);
      } else {
        setError(data.error || "Failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show error state when settings failed to load
  if (!settings && error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-400" />
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">ตั้งค่า</h1>
          <p className="text-white/50 text-sm mt-1">จัดการการตั้งค่าระบบ การแสดงผล และความปลอดภัย</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
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
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm mb-4">
          <Check size={16} />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-300">✕</button>
        </div>
      )}

      <div className="space-y-6">
        {/* ===== Branding ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-300/10 text-amber-300">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">การปรับแต่งแบรนด์</h2>
              <p className="text-white/40 text-xs">เปลี่ยนโลโก้ สีสัน และสไตล์ของเว็บไซต์</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-xs mb-1">ชื่อเว็บไซต์</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1">คำอธิบายสั้น (Tagline)</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1">URL เว็บไซต์</label>
              <input
                type="text"
                value={settings.url}
                onChange={(e) => updateField("url", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1">Copyright</label>
              <input
                type="text"
                value={settings.copyright}
                onChange={(e) => updateField("copyright", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
          </div>

          <div className="border-t border-white/5 mt-5 pt-5">
            <p className="text-white/50 text-xs mb-3 flex items-center gap-1">
              <Image size={12} />
              โลโก้และรูปภาพ
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ImageUploader
                label="โลโก้หลัก"
                value={settings.logo}
                onChange={(v) => updateField("logo", v)}
                previewHeight={80}
                folder="site-settings"
              />
              <ImageUploader
                label="Favicon"
                value={settings.favicon}
                onChange={(v) => updateField("favicon", v)}
                previewHeight={80}
                folder="site-settings"
              />
              <ImageUploader
                label="OG Image"
                value={settings.ogImage}
                onChange={(v) => updateField("ogImage", v)}
                previewHeight={80}
                folder="site-settings"
              />
            </div>
          </div>

          <div className="border-t border-white/5 mt-5 pt-5">
            <p className="text-white/50 text-xs mb-3 flex items-center gap-1">
              <Palette size={12} />
              สีสัน
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorField label="สีหลัก" value={settings.primaryColor} onChange={(v) => updateField("primaryColor", v)} />
              <ColorField label="สีรอง" value={settings.secondaryColor} onChange={(v) => updateField("secondaryColor", v)} />
              <ColorField label="สีเน้น (Accent)" value={settings.accentColor} onChange={(v) => updateField("accentColor", v)} />
              <ColorField label="สีข้อความหลัก" value={settings.textColor} onChange={(v) => updateField("textColor", v)} />
              <ColorField label="สีข้อความรอง" value={settings.textColorMuted} onChange={(v) => updateField("textColorMuted", v)} />
              <ColorField label="สีพื้นหลังหลัก" value={settings.backgroundColor} onChange={(v) => updateField("backgroundColor", v)} />
              <ColorField label="สีพื้นหลังรอง" value={settings.backgroundColorSecondary} onChange={(v) => updateField("backgroundColorSecondary", v)} />
              <ColorField label="สีพื้นหลัง Card" value={settings.cardColor} onChange={(v) => updateField("cardColor", v)} />
              <ColorField label="สีเส้นขอบ Card" value={settings.cardBorderColor} onChange={(v) => updateField("cardBorderColor", v)} />
              <ColorField label="สีพื้นหลัง Sidebar" value={settings.sidebarColor} onChange={(v) => updateField("sidebarColor", v)} />
              <ColorField label="สีพื้นหลัง Header" value={settings.headerColor} onChange={(v) => updateField("headerColor", v)} />
              <ColorField label="สี Success" value={settings.successColor} onChange={(v) => updateField("successColor", v)} />
              <ColorField label="สี Error" value={settings.errorColor} onChange={(v) => updateField("errorColor", v)} />
            </div>
          </div>
        </div>

        {/* ===== SEO & Meta ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-300/10 text-blue-300">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">SEO และ Meta</h2>
              <p className="text-white/40 text-xs">จัดการข้อมูล SEO, Open Graph, Twitter Card</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-xs mb-1">Meta Title</label>
              <input
                type="text"
                value={settings.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1">Meta Description</label>
              <textarea
                value={settings.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-xs mb-1">OG Title</label>
                <input
                  type="text"
                  value={settings.ogTitle}
                  onChange={(e) => updateField("ogTitle", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-1">Twitter Handle</label>
                <input
                  type="text"
                  value={settings.twitterHandle || ""}
                  onChange={(e) => updateField("twitterHandle", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1">OG Description</label>
              <textarea
                value={settings.ogDescription}
                onChange={(e) => updateField("ogDescription", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ===== Features ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-300/10 text-green-300">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">ฟีเจอร์และการแสดงผล</h2>
              <p className="text-white/40 text-xs">ตั้งค่าการแสดงผลของเว็บไซต์</p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleRow
              label="แสดงชื่อผู้เขียนในบทความ"
              description="ซ่อนหรือแสดงชื่อผู้เขียนบนหน้า article detail"
              enabled={settings.showAuthor}
              onChange={(v) => updateField("showAuthor", v)}
            />
            <ToggleRow
              label="ปุ่มแชร์โซเชียล"
              description="แสดงปุ่มแชร์ Facebook, Twitter ในบทความ"
              enabled={settings.enableSocialShare}
              onChange={(v) => updateField("enableSocialShare", v)}
            />
            <ToggleRow
              label="โหมดปิดปรับปรุง"
              description="แสดงหน้า Maintenance แทนเนื้อหาปกติ"
              enabled={settings.maintenanceMode}
              onChange={(v) => updateField("maintenanceMode", v)}
            />
          </div>
        </div>

        {/* ===== Support: สนับสนุนผู้ทำเว็บ ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-300/10 text-amber-300">
              <Coffee size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">สนับสนุนผู้ทำเว็บ</h2>
              <p className="text-white/40 text-xs">ช่วยค่ากาแฟ / ค่าแปลข้อมูล ผ่าน QR Code (หน้าแสดงเฉพาะภาษาไทย)</p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleRow
              label="เปิดใช้งานการสนับสนุน"
              description="แสดงหน้า /support พร้อม QR Code ให้ผู้ใช้โอนเงินสนับสนุน"
              enabled={settings.supportEnabled}
              onChange={(v) => updateField("supportEnabled", v)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploader
                label="QR Code (ธนาคาร)"
                value={settings.supportQr || ""}
                onChange={(v) => updateField("supportQr", v)}
                previewHeight={120}
                folder="site-settings"
              />
              <div className="space-y-3">
                <div>
                  <label className="block text-white/70 text-xs mb-1">หัวข้อ (ภาษาไทย)</label>
                  <input
                    type="text"
                    value={settings.supportTitle || ""}
                    onChange={(e) => updateField("supportTitle", e.target.value)}
                    placeholder="สนับสนุนผู้ทำเว็บ"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">คำอธิบาย (ภาษาไทย)</label>
                  <textarea
                    value={settings.supportDescription || ""}
                    onChange={(e) => updateField("supportDescription", e.target.value)}
                    placeholder="ช่วยค่ากาแฟและค่าแปลข้อมูล..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-xs mb-1 flex items-center gap-1">
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  value={settings.supportAccountName || ""}
                  onChange={(e) => updateField("supportAccountName", e.target.value)}
                  placeholder="ชื่อบัญชีธนาคาร"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-1 flex items-center gap-1">
                  <QrCode size={12} /> เลขบัญชี (แสดงเป็นทางเลือก)
                </label>
                <input
                  type="text"
                  value={settings.supportAccountNumber || ""}
                  onChange={(e) => updateField("supportAccountNumber", e.target.value)}
                  placeholder="XXX-X-XXXXX-X"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50"
                />
              </div>
            </div>

            <p className="text-[11px] text-white/30 pt-1">
              หมายเหตุ: QR Code และข้อมูลการโอนเงินจะแสดงเฉพาะในเวอร์ชันภาษาไทย เพื่อเลี่ยงการเก็บภาษีจากคำว่า "บริจาค"
              คำกล่าวเขียนอธิบายให้เป็น "ค่าช่วยเหลือทีมผู้ทำเว็บ" (ค่าแรง/ค่ากาแฟ/ค่าแปลข้อมูล)
            </p>
          </div>
        </div>

        {/* ===== Social Links ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-sky-300/10 text-sky-300">
              <Link size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">ลิงก์โซเชียล</h2>
              <p className="text-white/40 text-xs">เชื่อมต่อเว็บไซต์กับโซเชียลมีเดีย</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-xs mb-1 flex items-center gap-1">
                <Facebook size={12} /> Facebook URL
              </label>
              <input
                type="text"
                value={settings.facebookUrl || ""}
                onChange={(e) => updateField("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1 flex items-center gap-1">
                <Twitter size={12} /> Twitter URL
              </label>
              <input
                type="text"
                value={settings.twitterUrl || ""}
                onChange={(e) => updateField("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1 flex items-center gap-1">
                <Instagram size={12} /> Instagram URL
              </label>
              <input
                type="text"
                value={settings.instagramUrl || ""}
                onChange={(e) => updateField("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1 flex items-center gap-1">
                <Youtube size={12} /> YouTube URL
              </label>
              <input
                type="text"
                value={settings.youtubeUrl || ""}
                onChange={(e) => updateField("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-white/70 text-xs mb-1">Google Analytics ID</label>
            <div className="relative">
              <input
                type="text"
                value={settings.googleAnalyticsId || ""}
                onChange={(e) => updateField("googleAnalyticsId", e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50 pr-28"
              />
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                sources.googleAnalyticsId === "env"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : sources.googleAnalyticsId === "db"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-white/5 text-white/30 border border-white/10"
              }`}>
                {sources.googleAnalyticsId === "env" ? (
                  <><Server size={10} /> ENV</>
                ) : sources.googleAnalyticsId === "db" ? (
                  <><HardDrive size={10} /> DB</>
                ) : (
                  <><Server size={10} /> —</>
                )}
              </span>
            </div>
            <p className="text-white/20 text-[10px] mt-0.5">
              {sources.googleAnalyticsId === "env"
                ? "กำลังใช้ค่าจาก Environment Variable (NEXT_PUBLIC_GA_ID) • ใส่ค่าในช่องนี้เพื่อบันทึกลงฐานข้อมูลและแทนที่ค่า ENV"
                : "ค่าใน Settings นี้บันทึกลงฐานข้อมูล • หากต้องการใช้ Environment Variable ให้ล้างช่องนี้แล้วตั้งค่า "
              }
              {sources.googleAnalyticsId !== "env" && <code className="text-amber-300/40">NEXT_PUBLIC_GA_ID</code>}
            </p>
          </div>
          {/* ===== AdSense ===== */}
          <div className="border-t border-white/5 mt-5 pt-5">
            <p className="text-white/50 text-xs mb-3 flex items-center gap-1">
              <Hash size={12} />
              Google AdSense
            </p>
            <div>
              <label className="block text-white/70 text-xs mb-1">Publisher ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.adsenseId || ""}
                  onChange={(e) => updateField("adsenseId", e.target.value)}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50 pr-28"
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                  sources.adsenseId === "env"
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : sources.adsenseId === "db"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/5 text-white/30 border border-white/10"
                }`}>
                  {sources.adsenseId === "env" ? (
                    <><Server size={10} /> ENV</>
                  ) : sources.adsenseId === "db" ? (
                    <><HardDrive size={10} /> DB</>
                  ) : (
                    <><Server size={10} /> —</>
                  )}
                </span>
              </div>
              <p className="text-white/20 text-[10px] mt-0.5">
                {sources.adsenseId === "env"
                  ? "กำลังใช้ค่าจาก Environment Variable (NEXT_PUBLIC_ADSENSE_ID) • ใส่ค่าในช่องนี้เพื่อบันทึกลงฐานข้อมูลและแทนที่ค่า ENV"
                  : "ได้จาก AdSense → Settings → Account Information • ค่านี้จะบันทึกลงฐานข้อมูล"
                }
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-white/70 text-xs mb-1">Ad Slot — หน้าแรก</label>
                <input
                  type="text"
                  value={settings.adsenseSlotHomepage || ""}
                  onChange={(e) => updateField("adsenseSlotHomepage", e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50"
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-1">Ad Slot — Sidebar</label>
                <input
                  type="text"
                  value={settings.adsenseSlotSidebar || ""}
                  onChange={(e) => updateField("adsenseSlotSidebar", e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50"
                />
              </div>
            </div>
            {sources.adsenseId !== "env" && (
              <p className="text-white/20 text-[10px] mt-2">
                หากต้องการใช้ Environment Variable ให้ล้างค่าในช่องด้านบน แล้วตั้งค่า <code className="text-amber-300/40">NEXT_PUBLIC_ADSENSE_ID</code>
              </p>
            )}
          </div>
        </div>

        {/* ===== Language Tiers ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-300/10 text-blue-300">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">ภาษา (Language Tiers)</h2>
              <p className="text-white/40 text-xs">
                Tier 1 = แสดงในแถบเปลี่ยนภาษา Header + แปลทันที
                <br />
                Tier 2 = แปลตามคำขอ (ผู้ใช้สามารถเลือกดูได้) — แสดงสีส้มเมื่อ active
                <br />
                <span className="text-white/30">ปิด (Off)</span> = ไม่แสดงภาษาให้ผู้ใช้เลือกเลย
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {ALL_LOCALES.map((locale) => {
              const tier = settings.localeTiers[locale] || "1";
              const label = LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES];
              return (
                <div
                  key={locale}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                    tier === "0"
                      ? "bg-white/[0.02] border border-white/5 opacity-50"
                      : "bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs text-white/40 uppercase font-mono w-6 shrink-0">{locale}</span>
                    <span className={`text-sm truncate ${
                      tier === "0" ? "text-white/30" : "text-white"
                    }`}>{label?.native || locale}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        const newTiers = { ...settings.localeTiers, [locale]: "1" as const };
                        updateField("localeTiers", newTiers);
                      }}
                      className={`px-2 py-1 text-[10px] rounded transition-all font-medium ${
                        tier === "1"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                          : "bg-white/5 text-white/30 border border-transparent hover:bg-white/10 hover:text-white/60"
                      }`}
                      title="แสดงใน Header + แปลทันที"
                    >
                      Tier 1
                    </button>
                    <button
                      onClick={() => {
                        const newTiers = { ...settings.localeTiers, [locale]: "2" as const };
                        updateField("localeTiers", newTiers);
                      }}
                      className={`px-2 py-1 text-[10px] rounded transition-all font-medium ${
                        tier === "2"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.15)]"
                          : "bg-white/5 text-white/30 border border-transparent hover:bg-white/10 hover:text-white/60"
                      }`}
                      title="แปลตามคำขอ (JIT)"
                    >
                      Tier 2
                    </button>
                    <button
                      onClick={() => {
                        const newTiers = { ...settings.localeTiers, [locale]: "0" as const };
                        updateField("localeTiers", newTiers);
                      }}
                      className={`px-2 py-1 text-[10px] rounded transition-all font-medium ${
                        !tier || tier === "0"
                          ? "bg-red-500/15 text-red-300 border border-red-400/30"
                          : "bg-white/5 text-white/30 border border-transparent hover:bg-white/10 hover:text-white/60"
                      }`}
                      title="ปิดภาษา — ไม่แสดงให้ผู้ใช้เลือก"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== System ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-300/10 text-amber-300">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">ข้อมูลระบบ</h2>
              <p className="text-white/40 text-xs">เวอร์ชันและสถานะของระบบ</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-white/40 text-xs">เวอร์ชัน</p>
              <p className="text-white font-medium">1.0.0</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-white/40 text-xs">สีหลัก</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
                <p className="text-white font-medium">{settings.primaryColor}</p>
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-white/40 text-xs">GA ID</p>
              <p className="text-white font-medium text-xs">{settings.googleAnalyticsId || "—"}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-white/40 text-xs">ระบบภาษา</p>
              <p className="text-white font-medium">15 ภาษา</p>
            </div>
          </div>
        </div>

        {/* ===== Translation ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-300/10 text-emerald-300">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">การแปลภาษา</h2>
              <p className="text-white/40 text-xs">จัดการการแปลบทความทั้งหมด</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-white/5">
            <div>
              <p className="text-white text-sm">แปลบทความทั้งหมดอีกครั้ง</p>
              <p className="text-white/40 text-xs">จะล้างแคชเก่าและแปลใหม่ทั้งหมด 15 ภาษา</p>
            </div>
            <button
              onClick={handleResetTranslations}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
              ) : (
                <RefreshCwIcon size={14} />
              )}
              {saving ? "กำลังแปล..." : "แปลใหม่"}
            </button>
          </div>
        </div>

        {/* ===== Security & Password ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-300/10 text-purple-300">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">ความปลอดภัย</h2>
              <p className="text-white/40 text-xs">จัดการรหัสผ่านและความปลอดภัยของบัญชี</p>
            </div>
          </div>

          <div className="px-3 py-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">เปลี่ยนรหัสผ่าน</p>
                <p className="text-white/40 text-xs">คุณ {user.name}</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all text-sm"
              >
                <Lock size={14} />
                {showPasswordForm ? "ยกเลิก" : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-white/5 space-y-4">
                <div>
                  <label className="block text-white/70 text-xs mb-1">รหัสผ่านปัจจุบัน</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                  />
                </div>
                <div className="relative">
                  <label className="block text-white/70 text-xs mb-1">รหัสผ่านใหม่</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-7 text-white/40 hover:text-white/70"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm disabled:opacity-50"
                >
                  {pwSaving ? "กำลังเปลี่ยน..." : "ยืนยันเปลี่ยนรหัสผ่าน"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ===== API Keys ===== */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-300/10 text-cyan-300">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold">API Keys</h2>
              <p className="text-white/40 text-xs">คีย์สำหรับบริการต่างๆ (ตั้งค่าใน Environment Variables)</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-sm">
              <span className="text-white/70">Google AI (Gemini)</span>
              <span className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Configured
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-sm">
              <span className="text-white/70">Claude API</span>
              <span className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Configured
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-sm">
              <span className="text-white/70">Google Analytics</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs flex items-center gap-1 ${
                  settings.googleAnalyticsId ? "text-green-400" : "text-white/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    settings.googleAnalyticsId ? "bg-green-400" : "bg-white/30"
                  }`} />
                  {settings.googleAnalyticsId ? settings.googleAnalyticsId : "Not set"}
                </span>
                {sources.googleAnalyticsId === "env" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                    <Server size={10} /> ENV
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ===== OAuth Keys Subsection ===== */}
          <div className="border-t border-white/5 mt-5 pt-5">
            <p className="text-white/50 text-xs mb-3 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              OAuth สำหรับ Login (Google / Facebook)
            </p>
            <div className="space-y-3">
              {/* Google OAuth */}
              <div className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-white/70 text-xs font-medium">Google OAuth</span>
                  {sources.googleOAuthClientId === "env" ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 ml-auto">
                      <Server size={10} /> ENV
                    </span>
                  ) : sources.googleOAuthClientId === "db" ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 ml-auto">
                      <HardDrive size={10} /> DB
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Client ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settings.googleOAuthClientId || ""}
                        onChange={(e) => updateField("googleOAuthClientId", e.target.value)}
                        placeholder="123456789-xxxxx.apps.googleusercontent.com"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50 pr-20"
                      />
                      <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded ${
                        (settings.googleOAuthClientId || process.env.NEXT_PUBLIC_AUTH_GOOGLE_CLIENT_ID) ? "bg-green-500/10 text-green-300" : "bg-white/5 text-white/20"
                      }`}>
                        {settings.googleOAuthClientId ? "✓" : "—"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Client Secret</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.googleOAuthClientSecret || ""}
                        onChange={(e) => updateField("googleOAuthClientSecret", e.target.value)}
                        placeholder="GOCSPX-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50 pr-20"
                      />
                      <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded ${
                        (settings.googleOAuthClientSecret) ? "bg-green-500/10 text-green-300" : "bg-white/5 text-white/20"
                      }`}>
                        {settings.googleOAuthClientSecret ? "✓" : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-white/20 text-[10px] mt-1">
                  {sources.googleOAuthClientId === "env"
                    ? "กำลังใช้ค่าจาก Environment Variable (AUTH_GOOGLE_CLIENT_ID / AUTH_GOOGLE_CLIENT_SECRET)"
                    : "ใส่ค่าเพื่อบันทึกลงฐานข้อมูล หรือใช้ Environment Variable"}
                </p>
              </div>

              {/* Facebook OAuth */}
              <div className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-white/70 text-xs font-medium">Facebook OAuth</span>
                  {sources.facebookOAuthClientId === "env" ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 ml-auto">
                      <Server size={10} /> ENV
                    </span>
                  ) : sources.facebookOAuthClientId === "db" ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 ml-auto">
                      <HardDrive size={10} /> DB
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">App ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settings.facebookOAuthClientId || ""}
                        onChange={(e) => updateField("facebookOAuthClientId", e.target.value)}
                        placeholder="123456789012345"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50 pr-20"
                      />
                      <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded ${
                        (settings.facebookOAuthClientId) ? "bg-green-500/10 text-green-300" : "bg-white/5 text-white/20"
                      }`}>
                        {settings.facebookOAuthClientId ? "✓" : "—"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">App Secret</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.facebookOAuthClientSecret || ""}
                        onChange={(e) => updateField("facebookOAuthClientSecret", e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50 pr-20"
                      />
                      <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded ${
                        (settings.facebookOAuthClientSecret) ? "bg-green-500/10 text-green-300" : "bg-white/5 text-white/20"
                      }`}>
                        {settings.facebookOAuthClientSecret ? "✓" : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-white/20 text-[10px] mt-1">
                  {sources.facebookOAuthClientId === "env"
                    ? "กำลังใช้ค่าจาก Environment Variable (AUTH_FACEBOOK_CLIENT_ID / AUTH_FACEBOOK_CLIENT_SECRET)"
                    : "ใส่ค่าเพื่อบันทึกลงฐานข้อมูล หรือใช้ Environment Variable"}
                </p>
              </div>
            </div>
          </div>

          {/* ===== Translation API Provider Subsection ===== */}
          <div className="border-t border-white/5 mt-5 pt-5">
            <p className="text-white/50 text-xs mb-3 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              API Provider สำหรับแปลภาษา
            </p>
            <div className="space-y-3">
              {/* Provider Selector */}
              <div className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={14} className="text-emerald-300" />
                  <span className="text-white/70 text-xs font-medium">Translation API Provider</span>
                </div>
                <select
                  value={settings.translationApiProvider || "gemini"}
                  onChange={(e) => updateField("translationApiProvider", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-300/50"
                >
                  <option value="gemini">🌿 Gemini (Google DeepMind) — ปัจจุบัน</option>
                  <option value="claude">🤖 Claude (Anthropic) — แนะนำ (คุณภาพสูงสุด)</option>
                  <option value="openai">🧠 OpenAI (GPT-4o) — สำรอง</option>
                </select>
                <p className="text-white/20 text-[10px] mt-1">
                  เลือก API Provider สำหรับการแปลภาษาในระบบ
                </p>
              </div>

              {/* Claude API Key */}
              <div className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/70 text-xs font-medium">🔑 Claude API Key</span>
                  {settings.claudeApiKey ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">✓ มีค่า</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/20">—</span>
                  )}
                </div>
                <input
                  type="password"
                  value={settings.claudeApiKey || ""}
                  onChange={(e) => updateField("claudeApiKey", e.target.value)}
                  placeholder="sk-ant-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50"
                />
              </div>

              {/* OpenAI API Key */}
              <div className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/70 text-xs font-medium">🔑 OpenAI API Key</span>
                  {settings.openaiApiKey ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">✓ มีค่า</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/20">—</span>
                  )}
                </div>
                <input
                  type="password"
                  value={settings.openaiApiKey || ""}
                  onChange={(e) => updateField("openaiApiKey", e.target.value)}
                  placeholder="sk-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50"
                />
              </div>

              {/* Gemini API Key */}
              <div className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/70 text-xs font-medium">🔑 Gemini API Key</span>
                  {settings.geminiApiKey ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">✓ มีค่า</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/20">—</span>
                  )}
                </div>
                <input
                  type="password"
                  value={settings.geminiApiKey || ""}
                  onChange={(e) => updateField("geminiApiKey", e.target.value)}
                  placeholder="AIzaSyxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-300/50"
                />
              </div>

              <p className="text-white/20 text-[10px]">
                API Keys จะถูกบันทึกลงฐานข้อมูล หากต้องการใช้ Environment Variable ให้ตั้งค่าในไฟล์ .env.local
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-white/70 text-xs mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer bg-transparent border border-white/10 flex-shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-white/5">
      <div>
        <p className="text-white text-sm">{label}</p>
        <p className="text-white/40 text-xs">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? "bg-amber-400" : "bg-white/20"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
