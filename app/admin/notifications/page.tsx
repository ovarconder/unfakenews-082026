// ============================================================
// Admin: Notifications — ประวัติการแจ้งเตือนทั้งหมด
// ============================================================
// - แบบ read / unread
// - Filter ตามประเภท
// - Mark as read, Mark all as read, Clear
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, BellOff, Check, CheckCircle, AlertCircle, Globe,
  Filter, X, Clock, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  type AppNotification,
} from "@/lib/notification-store";

const SESSION_KEY = "siam_admin_session";

type FilterType = "all" | "unread" | "read" | "translation_done" | "translation_error" | "translation_progress";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "unread", label: "ยังไม่ได้อ่าน" },
  { value: "read", label: "อ่านแล้ว" },
  { value: "translation_done", label: "แปลสำเร็จ" },
  { value: "translation_error", label: "แปลผิดพลาด" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrentTime = (d: Date) => {
    return d.toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.push("/admin/login");
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      router.push("/admin/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const refresh = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("notification-update", handler);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("notification-update", handler);
      clearInterval(interval);
    };
  }, [refresh]);

  const filteredNotifications = notifications.filter(n => {
    switch (filter) {
      case "unread": return !n.read;
      case "read": return n.read;
      case "translation_done": return n.type === "translation_done";
      case "translation_error": return n.type === "translation_error";
      case "translation_progress": return n.type === "translation_progress";
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "เมื่อสักครู่";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชม.ที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return d.toLocaleDateString("th-TH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "translation_done": return <CheckCircle size={16} className="text-emerald-400" />;
      case "translation_error": return <AlertCircle size={16} className="text-red-400" />;
      case "translation_progress": return <Globe size={16} className="text-blue-400" />;
      case "article_published": return <Globe size={16} className="text-amber-400" />;
      default: return <Bell size={16} className="text-white/40" />;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={24} className="text-amber-400" />
            การแจ้งเตือน
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {notifications.length} รายการ
            {unreadCount > 0 && (
              <span className="ml-2 text-amber-300">({unreadCount} ยังไม่ได้อ่าน)</span>
            )}
            <span className="ml-3 text-[10px] text-white/20">
              <Clock size={10} className="inline mr-0.5" />
              {formatCurrentTime(now)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={() => { markAllAsRead(); refresh(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400/10 text-amber-300 text-xs hover:bg-amber-400/20 transition-colors border border-amber-400/20"
            >
              <Check size={12} />
              อ่านทั้งหมด
            </button>
          )}

          {/* Clear */}
          <button
            onClick={() => {
              if (confirm("ล้างประวัติการแจ้งเตือนทั้งหมด?")) {
                clearNotifications();
                refresh();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-300 text-xs hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <Trash2 size={12} />
            ล้างทั้งหมด
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter size={14} className="text-white/30" />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              filter === opt.value
                ? "bg-amber-300/20 text-amber-300 border border-amber-300/30"
                : "bg-white/5 text-white/50 hover:text-white border border-white/5 hover:border-white/20"
            }`}
          >
            {opt.label}
            {opt.value === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500/20 text-red-300 px-1 py-0.5 rounded text-[9px]">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10">
          <BellOff size={48} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/30 text-sm">ไม่พบการแจ้งเตือน</p>
          <p className="text-white/20 text-xs mt-1">
            {filter === "unread" ? "ไม่มีรายการที่ยังไม่ได้อ่าน" : "ยังไม่มีการแจ้งเตือน"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg border transition-all ${
                notif.read
                  ? "bg-gradient-to-br from-[#0f1f3a] to-[#162545] border-white/5 opacity-70"
                  : "bg-gradient-to-br from-[#122040] to-[#1a2d50] border-amber-400/20 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  <NotificationIcon type={notif.type} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm ${notif.read ? "text-white/60" : "text-white font-medium"}`}>
                        {notif.title}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{notif.message}</p>
                    </div>
                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/20 text-[10px] flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(notif.timestamp)}
                    </span>

                    {/* Type badge */}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                      notif.type === "translation_done" ? "bg-emerald-400/10 text-emerald-300"
                      : notif.type === "translation_error" ? "bg-red-400/10 text-red-300"
                      : notif.type === "translation_progress" ? "bg-blue-400/10 text-blue-300"
                      : "bg-white/10 text-white/40"
                    }`}>
                      {notif.type === "translation_done" ? "แปลสำเร็จ"
                      : notif.type === "translation_error" ? "ข้อผิดพลาด"
                      : notif.type === "translation_progress" ? "กำลังแปล"
                      : notif.type}
                    </span>

                    {/* Category */}
                    {notif.category && (
                      <span className="text-white/20 text-[10px]">{notif.category}</span>
                    )}
                  </div>

                  {/* Link to article */}
                  {notif.slug && (
                    <a
                      href={`/admin/articles/edit/${notif.slug}`}
                      className="inline-block mt-2 text-[10px] text-amber-400/60 hover:text-amber-300 transition-colors"
                      onClick={() => markAsRead(notif.id)}
                    >
                      ดูบทความ →
                    </a>
                  )}
                </div>

                {/* Mark as read button */}
                {!notif.read && (
                  <button
                    onClick={() => { markAsRead(notif.id); refresh(); }}
                    className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors flex-shrink-0"
                    title="ทำเครื่องหมายว่าอ่านแล้ว"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 text-white/20 text-xs flex items-center justify-between">
        <span>
          แสดง {filteredNotifications.length} จาก {notifications.length} รายการ
        </span>
        {unreadCount > 0 && (
          <button
            onClick={() => { markAllAsRead(); refresh(); }}
            className="text-amber-400/50 hover:text-amber-300 transition-colors"
          >
            ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
          </button>
        )}
      </div>
    </div>
  );
}
