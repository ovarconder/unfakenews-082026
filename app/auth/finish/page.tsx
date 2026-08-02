"use client";

// ============================================================
// Auth Finish —หน้า bridge หลัง OAuth callback
// ============================================================
// Server callback (app/auth/callback) แลก code → session cookie แล้ว
// redirect มาที่หน้านี้ (client) เพื่อ:
//   1. อ่าน user จาก Supabase session (/api/auth/me)
//   2. เขียน sessionStorage ให้ตรงกับที่ Admin panel ตรวจ
//   3. redirect ไป /admin (ถ้าเป็น admin) หรือหน้า home (ถ้าไม่ใช่)
// ============================================================

import { useEffect, useState } from "react";

const SESSION_KEY = "siam_admin_session";

export default function AuthFinishPage() {
  const [status, setStatus] = useState<string>("กำลังตรวจสอบ...");

  useEffect(() => {
    async function finalize() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const user = data?.user;

        if (!user) {
          // ไม่มี session — ไปหน้า login
          window.location.href = "/admin/login";
          return;
        }

        // เขียน sessionStorage (ให้ admin layout เห็น) กับ user object
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));

        // ถ้าเป็น admin → ไป dashboard; ไม่ใช่ → ไปหน้า home
        const isAdmin = user.role === "admin";
        if (isAdmin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } catch (err: any) {
        setStatus("เกิดข้อผิดพลาด กำลังกลับไปหน้าเข้าสู่ระบบ...");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1200);
      }
    }

    finalize();
  }, []);

  return (
    <div className="min-h-screen bg-[#060e1a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-white/60 text-sm">{status}</p>
      </div>
    </div>
  );
}
