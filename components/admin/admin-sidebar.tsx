"use client";

// ============================================================
// Admin Sidebar
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  File,
  Users,
  Globe,
  Languages,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Layers,
  BookMarked,
  Bell,
  Star,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { UserRole } from "@/lib/auth-types";
import { ROLE_LABELS, hasPermission } from "@/lib/auth-types";
import { useSettings } from "@/components/admin/settings-context";
import { NotificationBell } from "@/components/admin/notification-bell";
import { adminFetch } from "@/lib/use-admin-fetch";

interface AdminSidebarProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  onLogout?: () => void;
}

// ============================================================
// Nav Items — visibility ควบคุมโดย permission เดียว (source of truth
// คือ ROLE_PERMISSIONS ใน lib/auth-types) ไม่ต้อง hard-code roles ซ้ำ
// เพราะ hard-code roles เคยทำให้ permission กับ roles ไม่ตรงกัน
// ============================================================
//
// สรุปว่า role ไหนเห็นเมนูไหน (ตาม ROLE_PERMISSIONS):
//   writer : แดชบอร์ด, บทความ, แจ้งเตือน          (article:create)
//   editor : + จัดการไฮไลต์, หน้า, Hero, ผู้ใช้งาน,
//            สถิติ, การแปล, หมวดหมู่, Entity Facts (article:edit_any / user:list / article:review)
//   admin  : + Microsites, ตั้งค่า                  (settings:edit / settings:view)
//
const navItems = [
  {
    label: "แดชบอร์ด",
    href: "/admin",
    icon: LayoutDashboard,
    permission: "article:create" as const, // writer/editor/admin
  },
  {
    label: "บทความ",
    href: "/admin/articles",
    icon: FileText,
    permission: "article:create" as const, // writer/editor/admin
  },
  {
    label: "จัดการไฮไลต์",
    href: "/admin/highlights",
    icon: Star,
    permission: "article:edit_any" as const, // editor/admin
  },
  {
    label: "หน้า",
    href: "/admin/pages",
    icon: File,
    permission: "article:edit_any" as const, // editor/admin
  },
  {
    label: "Hero Slides",
    href: "/admin/hero-slides",
    icon: LayoutDashboard,
    permission: "article:edit_any" as const, // editor/admin
  },
  {
    label: "ผู้ใช้งาน",
    href: "/admin/users",
    icon: Users,
    permission: "user:list" as const, // editor/admin
  },
  {
    label: "สถิติ",
    href: "/admin/stats",
    icon: BarChart3,
    permission: "user:list" as const, // editor/admin (ทั้งคู่มีสิทธิ์)
  },
  {
    label: "การแปลภาษา",
    href: "/admin/translations",
    icon: Languages,
    permission: "article:review" as const, // editor/admin
  },
  {
    label: "หมวดหมู่",
    href: "/admin/categories",
    icon: BookMarked,
    permission: "article:edit_any" as const, // editor/admin
  },
  {
    label: "Entity Facts",
    href: "/admin/entity-facts",
    icon: Layers,
    permission: "article:edit_any" as const, // editor/admin
  },
  // ★ Notifications
  {
    label: "แจ้งเตือน",
    href: "/admin/notifications",
    icon: Bell,
    permission: "article:create" as const, // writer/editor/admin
  },
  // ★ Microsites management
  {
    label: "Microsites",
    href: "/admin/microsites",
    icon: Layers,
    permission: "settings:edit" as const, // admin
  },
  {
    label: "ตั้งค่า",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings:view" as const, // admin
  },
];

export default function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const settings = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // ================================================================
  // Resync All — อัปเดต SEO ทั้งหมด (IndexNow + Google Indexing + revalidate)
  // แสดงเฉพาะ editor/admin
  // ================================================================
  const canResync = ["admin", "editor"].includes(user.role);
  const [resyncState, setResyncState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [resyncMessage, setResyncMessage] = useState<string | null>(null);

  const handleResync = async () => {
    if (!confirm(
      "🔄 อัปเดต SEO ทั้งหมด?\n\nจะแจ้ง Google/Bing ให้รู้ URL บทความที่เผยแพร่จริงทั้งหมดพร้อมทุกภาษา และรีเฟรช sitemap + หน้าแรก\n\nดำเนินการต่อ?"
    )) return;

    setResyncState("loading");
    setResyncMessage(null);
    try {
      const res = await adminFetch("/api/seo/resync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeGoogle: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Resync failed");
      }
      setResyncState("done");
      setResyncMessage(
        `✅ อัปเดต ${data.processedArticles || 0} บทความ / ${data.urls?.length || 0} URL`
      );
    } catch (err: any) {
      console.error("[Resync] Error:", err);
      setResyncState("error");
      setResyncMessage(`❌ ${err?.message || "อัปเดตล้มเหลว"}`);
    } finally {
      // reset message หลังแสดง ~5 วิ (ไม่ reset state เพื่อให้สีคงอยู่)
      setTimeout(() => setResyncMessage(null), 6000);
    }
  };

  // Real-time clock
  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }));
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";
  const logoUrl = settings?.logo || settings?.logoFull || "/images/logo/unfakenews-logo-360.png";

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // source of truth = ROLE_PERMISSIONS (ผ่าน hasPermission)
  // เมนูจะแสดงต่อเมื่อ role ของผู้ใช้มี permission ของเมนูนั้น
  const visibleItems = navItems.filter((item) => {
    try {
      return hasPermission(user.role, item.permission);
    } catch {
      return false;
    }
  });

  const sidebarContent = (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Logo + Notification Bell */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/admin" className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt={siteName}
              className="h-8 w-auto"
            />
          </div>
          <p className="text-white/60 text-[10px] tracking-wider pl-0">Admin Panel</p>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <NotificationBell />
          <span className="text-white/40 text-[10px]">การแจ้งเตือน</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 pt-4 pb-10 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive(item.href)
                  ? "bg-amber-300/10 text-amber-300"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive(item.href) && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </Link>
          );
        })}
        <div style={{ height: 30, minHeight: 30, maxHeight: 30, display: "block", clear: "both" }}></div>
      </nav>

      {/* Resync All SEO — อัปเดตทั้งหมด */}
      {canResync && (
        <div className="px-3 pb-4 pt-2 border-t border-white/10">
          <button
            onClick={handleResync}
            disabled={resyncState === "loading"}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10
              disabled:opacity-50 disabled:cursor-not-allowed
              ${resyncState === "done" ? "border-emerald-400/40 text-emerald-300" : ""}
              ${resyncState === "error" ? "border-red-400/40 text-red-300" : ""}`}
          >
            {resyncState === "loading" ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : resyncState === "done" ? (
              <CheckCircle2 size={16} />
            ) : resyncState === "error" ? (
              <AlertTriangle size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            <span>
              {resyncState === "loading"
                ? "กำลังอัปเดต SEO..."
                : resyncState === "done"
                ? "อัปเดตแล้ว"
                : resyncState === "error"
                ? "อัปเดตล้มเหลว"
                : "อัปเดต SEO ทั้งหมด"}
            </span>
          </button>
          {resyncMessage && (
            <p className={`mt-2 px-3 py-2 rounded-lg text-[11px] leading-snug ${
              resyncState === "error"
                ? "bg-red-500/10 text-red-300"
                : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {resyncMessage}
            </p>
          )}
        </div>
      )}

      {/* User info + Logout */}
      <div className="px-4 pt-6 pb-5 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-300/20 flex items-center justify-center text-amber-300 text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{user.name}</p>
            <p className="text-white/40 text-[10px]">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0f1f3a] border border-white/10 text-white/70 hover:text-white"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-[#0a1628] border-r border-white/10 transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-[#0a1628] border-r border-white/10">
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
