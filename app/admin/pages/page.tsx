"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, File, Edit3, Globe, ExternalLink } from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

export default function AdminPagesPage() {
  const settings = useSettings();
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage";

  const DEFAULT_PAGES = [
    { slug: "about", title: "เกี่ยวกับเรา", description: `ประวัติและข้อมูลของ ${siteName}` },
    { slug: "contact", title: "ติดต่อเรา", description: "ช่องทางการติดต่อและแผนที่" },
    { slug: "privacy", title: "นโยบายความเป็นส่วนตัว", description: "นโยบายการเก็บข้อมูล" },
    { slug: "terms", title: "ข้อกำหนดการใช้งาน", description: "เงื่อนไขการให้บริการ" },
  ];

  const [pages, setPages] = useState(DEFAULT_PAGES);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">หน้า</h1>
          <p className="text-white/50 text-sm mt-1">จัดการหน้า static ของเว็บไซต์</p>
        </div>
        <Link
          href="/admin/pages/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all text-sm"
        >
          <Plus size={16} />
          สร้างหน้าใหม่
        </Link>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/admin/pages/${page.slug}`}
            className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 hover:border-amber-300/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-300/10 text-amber-300 mt-0.5">
                  <File size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-amber-300 transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-white/40 text-sm mt-1">{page.description}</p>
                  <p className="text-white/20 text-xs mt-1 font-mono">/{page.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  เผยแพร่แล้ว
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
              <span className="flex items-center gap-1 text-white/30 text-xs">
                <Edit3 size={12} />
                แก้ไขเนื้อหา
              </span>
              <span className="flex items-center gap-1 text-white/30 text-xs">
                <Globe size={12} />
                15 ภาษา
              </span>
              <span className="flex items-center gap-1 text-white/30 text-xs">
                <ExternalLink size={12} />
                ดูหน้านี้
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
