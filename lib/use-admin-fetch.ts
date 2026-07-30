// ============================================================
// Admin API Fetch Hook
// ============================================================
// แนบ session header ไปกับทุก request โดยอัตโนมัติ
// รองรับทั้ง sessionStorage-based auth (admin client)
// ============================================================

"use client";

import { useCallback } from "react";

const SESSION_KEY = "siam_admin_session";

/**
 * ดึง session data จาก sessionStorage และ encode เป็น base64
 * เพื่อส่งใน header x-session-data
 *
 * ใช้ btoa() พร้อม encodeURIComponent เพื่อกัน Unicode ปัญหา
 */
function getSessionHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};

    // encodeURIComponent ก่อน btoa เพื่อกัน Unicode character
    const encoded = btoa(encodeURIComponent(raw));
    return { "x-session-data": encoded };
  } catch {
    return {};
  }
}

/**
 * useAdminFetch — wrapper รอบ fetch ที่แนบ session header
 *
 * ใช้แทน fetch() ใน admin pages:
 *   const adminFetch = useAdminFetch();
 *   const res = await adminFetch("/api/admin/microsites");
 */
export function useAdminFetch() {
  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const sessionHeaders = getSessionHeader();
    
    const res = await fetch(url, {
      ...options,
      headers: {
        ...sessionHeaders,
        ...options.headers,
      },
    });

    return res;
  }, []);

  return adminFetch;
}

/**
 * adminFetch — standalone version สำหรับใช้ใน event handlers
 * (ไม่ต้องเรียก useAdminFetch())
 */
export function adminFetch(url: string, options: RequestInit = {}) {
  const sessionHeaders = getSessionHeader();
  
  return fetch(url, {
    ...options,
    headers: {
      ...sessionHeaders,
      ...options.headers,
    },
  });
}