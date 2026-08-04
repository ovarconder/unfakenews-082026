import type { Locale } from "@/lib/locales";
import { getSettings } from "@/lib/site-settings";
import { SupportCard } from "@/components/support/support-card";
import { SupportStripeCards } from "@/components/support/support-stripe-cards";

// Must read fresh settings from DB on every request
// (otherwise Next.js prerenders/statically caches the page with stale support values)
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function SupportPage({ params }: Props) {
  const { lang } = await params;
  const settings = await getSettings();
  const locale = lang as Locale;
  const isThai = locale === "th";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-prompt font-bold text-white mb-3 text-center">
          {isThai ? "☕ สนับสนุนผู้ทำเว็บ" : "☕ Support Our Website"}
        </h1>
        <p className="text-white/50 text-sm text-center mb-10 max-w-xl mx-auto">
          {isThai
            ? "ช่วยค่ากาแฟ / ค่าแปลข้อมูลให้ทีม เพื่อให้เว็บเดินหน้าต่อไป"
            : "Help with a coffee / translation support so we can keep the website running."}
        </p>

        {isThai ? (
          /* Support card — แสดง QR + ข้อมูลบัญชี (จาก admin settings) */
          <SupportCard
            locale={locale}
            enabled={settings.supportEnabled}
            qrUrl={settings.supportQr || ""}
            title={settings.supportTitle || ""}
            description={settings.supportDescription || ""}
            accountName={settings.supportAccountName || ""}
            accountNumber={settings.supportAccountNumber || ""}
            siteName={settings.name}
          />
        ) : (
          /* Stripe donation cards — สำหรับทุก non-Thai locale */
          <SupportStripeCards locale={locale} siteName={settings.name} />
        )}
      </div>
    </div>
  );
}
