// ============================================================
// Notification Bell — แสดงไอคอนกระดิ่งใต้ Logo
// ============================================================
// - Hover → dropdown 5 รายการล่าสุด
// - Badge จำนวน unread
// - "ดูทั้งหมด" → ไปหน้า /admin/notifications
// ============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, BellOff, Check, ChevronRight, Globe, AlertCircle, CheckCircle, X } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  type AppNotification,
} from "@/lib/notification-store";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<AppNotification[]>([]);
  const [hovered, setHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Refresh on mount + listen for updates
  const refresh = () => {
    setUnreadCount(getUnreadCount());
    setRecent(getRecentNotifications(5));
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("notification-update", handler);
    // Poll every 3 seconds (for cross-tab sync)
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("notification-update", handler);
      clearInterval(interval);
    };
  }, []);

  // Hover logic — แสดง dropdown เมื่อ hover ค้าง
  const handleMouseEnter = () => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowDropdown(true);
      refresh();
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 500);
  };

  // Icon + badge ตามประเภท notification
  const NotificationIcon = ({ notif }: { notif: AppNotification }) => {
    switch (notif.type) {
      case "translation_done":
        return <CheckCircle size={14} className="text-emerald-400" />;
      case "translation_error":
        return <AlertCircle size={14} className="text-red-400" />;
      case "translation_progress":
        return <Globe size={14} className="text-blue-400" />;
      case "article_published":
        return <Globe size={14} className="text-amber-400" />;
      default:
        return <Bell size={14} className="text-white/40" />;
    }
  };

  // Time formatting
  const formatTime = (iso: string) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "เมื่อสักครู่";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชม.ที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(iso).toLocaleDateString("th-TH", { month: "short", day: "numeric" });
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bell Icon */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          refresh();
        }}
        className={`relative p-2 rounded-lg transition-all ${
          unreadCount > 0
            ? "text-amber-300 hover:bg-amber-300/10"
            : "text-white/40 hover:text-white hover:bg-white/5"
        }`}
        title="การแจ้งเตือน"
      >
        {unreadCount > 0 ? <Bell size={20} /> : <BellOff size={20} />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — anchored left to prevent overflow */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-2 z-50 w-80 animate-fadeIn"
          style={{ left: 0, transform: 'none' }}
          onMouseEnter={() => {
            clearTimeout(hoverTimerRef.current);
            setShowDropdown(true);
          }}
          onMouseLeave={() => {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = setTimeout(() => setShowDropdown(false), 300);
          }}
        >
          <div className="rounded-xl bg-[#0f1f3a] border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <Bell size={14} className="text-amber-400" />
                การแจ้งเตือน
                {unreadCount > 0 && (
                  <span className="bg-red-500/20 text-red-300 text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                    refresh();
                  }}
                  className="text-[10px] text-white/30 hover:text-amber-300 transition-colors"
                >
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[320px] overflow-y-auto">
              {recent.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <BellOff size={24} className="mx-auto mb-2 text-white/10" />
                  <p className="text-white/30 text-xs">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                recent.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      !notif.read ? "bg-amber-300/[0.02]" : ""
                    }`}
                    onClick={() => {
                      markAsRead(notif.id);
                      refresh();
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">
                        <NotificationIcon notif={notif} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs ${notif.read ? "text-white/60" : "text-white font-medium"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-white/40 text-[10px] mt-0.5 line-clamp-1">{notif.message}</p>
                        <p
                          className="text-white/20 text-[9px] mt-1"
                          title={new Date(notif.timestamp).toLocaleString("th-TH", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          })}
                        >
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <Link
              href="/admin/notifications"
              onClick={() => setShowDropdown(false)}
              className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 text-xs text-amber-400/70 hover:text-amber-300 hover:bg-white/[0.02] transition-colors"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
