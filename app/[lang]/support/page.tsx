import type { Locale } from "@/lib/locales";
import { getSettings } from "@/lib/site-settings";
import { SupportCard } from "@/components/support/support-card";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function SupportPage({ params }: Props) {
  const { lang } = await params;
  const settings = await getSettings();

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-prompt font-bold text-white mb-3 text-center">
          ☕ สนับสนุนผู้ทำเว็บ
        </h1>
        <p className="text-white/50 text-sm text-center mb-10 max-w-xl mx-auto">
          ช่วยค่ากาแฟ / ค่าแปลข้อมูลให้ทีม เพื่อให้เว็บเดินหน้าต่อไป
        </p>

        {/* Support card — แสดง QR + ข้อมูลบัญชี (จาก admin settings) */}
        <SupportCard
          locale={lang as Locale}
          enabled={settings.supportEnabled}
          qrUrl={settings.supportQr || ""}
          title={settings.supportTitle || ""}
          description={settings.supportDescription || ""}
          accountName={settings.supportAccountName || ""}
          accountNumber={settings.supportAccountNumber || ""}
          siteName={settings.name}
        />
      </div>
    </div>
  );
}
