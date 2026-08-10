"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";

const SESSION_KEY = "siam_admin_session";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      // No session — redirect to login
      if (!pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
        return;
      }
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(raw);
      setUser(userData);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      if (!pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
        return;
      }
    }
      setLoading(false);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060e1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#060e1a]">
      <AdminSidebar user={user} onLogout={handleLogout} />
      <div className="lg:pl-64">
        <main className="min-h-screen pt-4 px-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
