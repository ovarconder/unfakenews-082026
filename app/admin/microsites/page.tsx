// ============================================================
// Admin: List Microsites
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Globe, ExternalLink, Edit, Trash2, Eye, EyeOff, Settings } from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";
import { adminFetch } from "@/lib/use-admin-fetch";

interface MicrositeItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  logo_url: string | null;
  primary_color: string;
  created_at: string;
  updated_at: string;
}

export default function AdminMicrositesPage() {
  const [microsites, setMicrosites] = useState<MicrositeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchMicrosites();
  }, []);

  async function fetchMicrosites() {
    try {
      const res = await adminFetch("/api/admin/microsites");
      const data = await res.json();
      setMicrosites(data.microsites || []);
    } catch (err) {
      console.error("Failed to fetch microsites:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(slug: string, current: boolean) {
    try {
      await adminFetch(`/api/admin/microsites/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      });
      fetchMicrosites();
    } catch (err) {
      console.error("Failed to toggle microsite status:", err);
    }
  }

  async function handleDelete(slug: string) {
    try {
      await adminFetch(`/api/admin/microsites/${slug}`, {
        method: "DELETE",
      });
      setDeleteConfirm(null);
      fetchMicrosites();
    } catch (err) {
      console.error("Failed to delete microsite:", err);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">จัดการ Microsites</h1>
          <p className="text-white/50 mt-1">
            สร้างและจัดการไมโครไซต์ภายใต้ domain เดียวกัน
          </p>
        </div>
        <Link
          href="/admin/microsites/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 text-[#0a1628] font-semibold hover:bg-amber-300 transition-colors text-sm"
        >
          <Plus size={16} />
          สร้าง Microsite ใหม่
        </Link>
      </div>

      {/* Microsites List */}
      {microsites.length === 0 ? (
        <div className="text-center py-20 rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10">
          <Globe size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-lg mb-2">ยังไม่มี Microsite</p>
          <p className="text-white/40 text-sm mb-6">
            สร้าง microsite แรกของคุณเพื่อเริ่มต้น
          </p>
          <Link
            href="/admin/microsites/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-400 text-[#0a1628] font-semibold hover:bg-amber-300 transition-colors"
          >
            <Plus size={18} />
            สร้าง Microsite
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {microsites.map((ms) => (
            <div
              key={ms.id}
              className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 hover:border-amber-300/20 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${ms.primary_color}20` }}
                >
                  {ms.logo_url ? (
                    <img src={ms.logo_url} alt={ms.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <span style={{ color: ms.primary_color }}>
                      {ms.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-semibold">{ms.name}</h3>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: ms.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: ms.is_active ? '#10b981' : '#ef4444',
                      }}
                    >
                      {ms.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-white/30 text-[10px] font-mono">/{ms.slug}</span>
                  </div>
                  {ms.description && (
                    <p className="text-white/50 text-sm line-clamp-1">{ms.description}</p>
                  )}
                  <p className="text-white/30 text-xs mt-1">
                    สร้าง: {new Date(ms.created_at).toLocaleDateString("th-TH")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View Site */}
                  <Link
                    href={`/${ms.slug}/th`}
                    target="_blank"
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="ดูหน้าเว็บ"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(ms.slug, ms.is_active)}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title={ms.is_active ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                  >
                    {ms.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  {/* Edit */}
                  <Link
                    href={`/admin/microsites/${ms.slug}/edit`}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-amber-300 hover:bg-amber-300/10 transition-all"
                    title="แก้ไข"
                  >
                    <Edit size={16} />
                  </Link>

                  {/* Articles */}
                  <Link
                    href={`/admin/microsites/${ms.slug}/articles`}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-blue-300 hover:bg-blue-300/10 transition-all"
                    title="จัดการบทความ"
                  >
                    <Settings size={16} />
                  </Link>

                  {/* Delete */}
                  {deleteConfirm === ms.slug ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(ms.slug)}
                        className="px-2 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(ms.slug)}
                      className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}