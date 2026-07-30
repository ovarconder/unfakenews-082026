// ============================================================
// Notification Store — Shared notification system
// ============================================================
// ใช้ sessionStorage เพื่อให้ notification อยู่ข้ามหน้า
// และ component ต่างๆ อ่าน/เขียนร่วมกันได้
// ============================================================

const STORAGE_KEY = "siam_notifications";

export interface AppNotification {
  id: string;
  timestamp: string;
  type: "translation_done" | "translation_error" | "translation_progress" | "article_published" | "system";
  title: string;
  message: string;
  slug?: string;
  read: boolean;
  /** หมวดหมู่ย่อยสำหรับ filter */
  category?: string;
}

// ================================================================
// Read all notifications
// ================================================================
export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ================================================================
// Add a new notification
// ================================================================
export function addNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    existing.unshift(newNotif);
    // Keep max 200
    const trimmed = existing.slice(0, 200);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    // Dispatch event for real-time update
    window.dispatchEvent(new CustomEvent("notification-update"));
  } catch {
    // sessionStorage may be full
  }
}

// ================================================================
// Mark as read
// ================================================================
export function markAsRead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getNotifications();
    const idx = existing.findIndex(n => n.id === id);
    if (idx === -1) return;
    existing[idx].read = true;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("notification-update"));
  } catch {}
}

// ================================================================
// Mark all as read
// ================================================================
export function markAllAsRead(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getNotifications();
    existing.forEach(n => n.read = true);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("notification-update"));
  } catch {}
}

// ================================================================
// Clear all
// ================================================================
export function clearNotifications(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("notification-update"));
  } catch {}
}

// ================================================================
// Get unread count
// ================================================================
export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

// ================================================================
// Get recent notifications (สำหรับ dropdown)
// ================================================================
export function getRecentNotifications(limit: number = 5): AppNotification[] {
  return getNotifications().slice(0, limit);
}
