"use client";

import type { Locale } from "@/lib/locales";
import { Coffee, Copy, Check } from "lucide-react";
import { useState } from "react";

interface SupportCardProps {
  locale: Locale;
  enabled: boolean;
  qrUrl?: string;
  title?: string;
  description?: string;
  accountName?: string;
  accountNumber?: string;
  siteName?: string;
}

export function SupportCard({
  locale,
  enabled,
  qrUrl,
  title,
  description,
  accountName,
  accountNumber,
  siteName,
}: SupportCardProps) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // ★ QR Code + ข้อมูลบัญชี (โอนเงินผ่าน QR) แสดงเฉพาะภาษาไทยเท่านั้น
  const isThai = locale === "th";
  // [DEBUG] ดูค่าจริงของ enabled
  console.log("[SupportCard] enabled:", enabled, "| typeof:", typeof enabled, "| isThai:", isThai, "| qrUrl:", qrUrl, "| accountNumber:", accountNumber);
  // Normalize enabled เป็น boolean จริง
  const isEnabled = Boolean(enabled);
  // ถ้าเปิดใช้งาน QQ ไว้ ให้แสดง QR; ถ้าไม่มี QR แต่มีเลขบัญชี แสดงบัญชีแทน
  const showQr = isThai && isEnabled && !!qrUrl;
  const showAccount = isThai && isEnabled && (!!accountNumber || !!accountName);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-8 text-center">
      {!isEnabled ? (
        <div className="py-8">
          <Coffee size={40} className="mx-auto mb-3 text-white/20" />
          {isThai ? (
            <p className="text-white/40 text-sm">ยังไม่เปิดรับการสนับสนุน</p>
          ) : (
            <p className="text-white/40 text-sm">Support is not available yet.</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee size={22} className="text-amber-300" />
            <h2 className="text-xl font-prompt font-bold text-white">
              {title || "สนับสนุนผู้ทำเว็บ"}
            </h2>
          </div>

          <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto mb-8">
            {description ||
              "ถ้าชอบใจเว็บของเรา ช่วยค่ากาแฟและค่าแปลข้อมูล เพื่อให้เราทำเว็บต่อไปได้ ยิ่งกว่าแค่ค่าเซิร์ฟเวอร์"}
          </p>

          {!isThai && (
            <p className="text-white/40 text-sm">
              Thank you for your interest in supporting this website. Payment details are
              available on the Thai version of this page.
            </p>
          )}

          {/* QR Code — เฉพาะภาษาไทย */}
          {showQr && (
            <div className="inline-block p-4 rounded-xl bg-white mb-6 shadow-lg">
              <img
                src={qrUrl}
                alt="QR Code สำหรับโอนเงิน"
                className="w-56 h-56 object-contain"
              />
            </div>
          )}

          {/* Account info — เฉพาะภาษาไทย */}
          {showAccount && (
            <div className="space-y-3 max-w-sm mx-auto">
              {accountName && (
                <div className="flex justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="text-white/50">ชื่อบัญชี</span>
                  <span className="text-white font-medium">{accountName}</span>
                </div>
              )}
              {accountNumber && (
                <button
                  onClick={copyNumber}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm hover:border-amber-300/40 transition-colors text-left"
                  title="กดเพื่อคัดลอกเลขบัญชี"
                >
                  <span className="text-white/50">เลขบัญชี</span>
                  <span className="text-white font-mono font-medium flex items-center gap-2">
                    {accountNumber}
                    {copied ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} className="text-white/30" />
                    )}
                  </span>
                </button>
              )}
              <p className="text-[11px] text-white/30 pt-1">
                ค่าตอบแทนนี้ถือเป็น "ค่าช่วยเหลือทีมผู้ทำเว็บ" (ค่าแรงคุณภาพงาน กาแฟ และค่าแปลข้อมูล)
                ซึ่งไม่เข้าข่ายการบริจาคเพื่อการกุศล
              </p>
            </div>
          )}

          {isThai && !showQr && !showAccount && (
            <p className="text-white/40 text-sm">
              ยังไม่ตั้งค่าข้อมูลการสนับสนุนจากหน้า Admin
            </p>
          )}

          {siteName && (
            <p className="text-white/30 text-xs mt-8">
              {isThai ? `${siteName} Team · ขอบคุณที่สนับสนุน 🙏` : `${siteName} Team · Thank you for your support 🙏`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
