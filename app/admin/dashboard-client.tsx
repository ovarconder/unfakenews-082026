"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  Globe,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

interface DashboardClientProps {
  user: { id: string; email: string; name: string; role: string };
  stats: {
    totalArticles: number;
    totalUsers: number;
    totalTranslations: number;
    totalLanguages: number;
  };
}

export default function DashboardClient({ user, stats }: DashboardClientProps) {
  const settings = useSettings();
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";
  const statCards = (() => {
    const isWriter = user.role === "writer";
    const cards: any[] = [
      {
        label: "บทความทั้งหมด",
        value: stats.totalArticles,
        icon: FileText,
        color: "from-amber-400 to-orange-500",
        href: "/admin/articles",
      },
    ];
    if (!isWriter) {
      cards.push({
        label: "การแปลทั้งหมด",
        value: stats.totalTranslations,
        icon: Globe,
        color: "from-emerald-400 to-teal-500",
        href: "/admin/translations",
      });
      cards.push({
        label: "ภาษา",
        value: stats.totalLanguages,
        icon: TrendingUp,
        color: "from-blue-400 to-indigo-500",
        href: "/admin/translations",
        suffix: "ภาษา",
      });
      cards.push({
        label: "ผู้ใช้งาน",
        value: stats.totalUsers,
        icon: Users,
        color: "from-purple-400 to-pink-500",
        href: "/admin/users",
      });
    }
    return cards;
  })();

  const quickActions = (() => {
    const isWriter = user.role === "writer";
    const isEditor = user.role === "editor" || user.role === "admin";
    const actions = [];

    actions.push({
      label: "เขียนบทความใหม่",
      href: "/admin/articles/new",
      icon: Plus,
      description: "สร้างบทความภาษาไทยใหม่",
    });

    actions.push({
      label: "จัดการบทความ",
      href: "/admin/articles",
      icon: FileText,
      description: "แก้ไข, ลบ, จัดการบทความ",
    });

    if (isEditor) {
      actions.push({
        label: "จัดการผู้ใช้งาน",
        href: "/admin/users",
        icon: Users,
        description: "เพิ่ม/แก้ไข ผู้เขียน, บรรณาธิการ",
      });
      actions.push({
        label: "Hero Slides",
        href: "/admin/hero-slides",
        icon: TrendingUp,
        description: "จัดการ Banner หน้าแรก",
      });
    }

    return actions;
  })();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-base sm:text-2xl font-bold text-white">
          สวัสดี, {user.name}
        </h1>
        <p className="text-white/50 mt-1">
          แดชบอร์ดผู้ดูแลระบบ {siteName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 hover:border-amber-300/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {stat.value}
                {stat.suffix && (
                  <span className="text-lg text-white/40 ml-1">{stat.suffix}</span>
                )}
              </p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={18} className="text-amber-300" />
          การดำเนินการด่วน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-5 hover:border-amber-300/30 transition-all"
              >
                <div className="p-2.5 rounded-lg bg-amber-300/10 text-amber-300">
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium group-hover:text-amber-200 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">{action.description}</p>
                </div>
                <ArrowRight size={16} className="text-white/30 group-hover:text-amber-300 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a]/50 to-[#162545]/50 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/70 mb-3">ข้อมูลระบบ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/40">Role ของคุณ</p>
            <p className="text-white font-medium">
              {user.role === "admin" ? "ผู้ดูแลระบบ" : user.role === "editor" ? "บรรณาธิการ" : "นักเขียน"}
            </p>
          </div>
          <div>
            <p className="text-white/40">อีเมล</p>
            <p className="text-white font-medium truncate">{user.email}</p>
          </div>
          <div>
            <p className="text-white/40">ระบบภาษา</p>
            <p className="text-white font-medium">15 ภาษา</p>
          </div>
          <div>
            <p className="text-white/40">API Status</p>
            <p className="text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              Claude API Ready
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
