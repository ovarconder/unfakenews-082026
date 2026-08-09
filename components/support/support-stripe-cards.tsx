"use client";

import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/locales";

interface StripeTier {
  amount: string;
  label: string;
  href: string;
}

const STRIPE_TIERS: StripeTier[] = [
  {
    amount: "$3",
    label: "Buy me a coffee ☕",
    href: "https://buy.stripe.com/3cI5kE7Enagd5Cq0nEg7e02",
  },
  {
    amount: "$5",
    label: "Translation support 🌐",
    href: "https://buy.stripe.com/fZu28s4sbewtc0O0nEg7e03",
  },
  {
    amount: "$10",
    label: "Support our website 🚀",
    href: "https://buy.stripe.com/00wbJ22k3ewt1magmCg7e04",
  },
  {
    amount: "$20",
    label: "Super supporter ⭐",
    href: "https://buy.stripe.com/bJe9AU6Aj2NL4ymc6mg7e05",
  },
];

interface SupportStripeCardsProps {
  locale: Locale;
  siteName?: string;
}

export function SupportStripeCards({ siteName }: SupportStripeCardsProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-8 text-center">
      {/* ============================================================
          Stripe donation cards — เปิดใช้งานแล้ว (active)
          แต่ละ tier เป็นลิงก์ตรงไปยัง checkout payment link ของ Stripe
      ============================================================ */}
      <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto mb-8 text-center">
        Thank you for considering supporting our work. Choose a tier below to help
        cover hosting costs, translation, and the time we invest in keeping this
        website alive.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STRIPE_TIERS.map((tier) => (
          <a
            key={tier.amount}
            href={tier.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-between gap-3 px-5 py-6 rounded-xl bg-white/5 border border-white/10 hover:border-amber-300/40 hover:bg-white/10 transition-all"
          >
            <div className="text-3xl font-bold text-amber-300 font-prompt">
              {tier.amount}
            </div>
            <div className="text-sm text-white/70 text-center flex-1">
              {tier.label}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-300/80 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Support via Stripe</span>
              <ArrowUpRight size={12} />
            </div>
          </a>
        ))}
      </div>

      {siteName && (
        <p className="text-white/30 text-xs mt-8 text-center">
          {siteName} Team · Thank you for your support 🙏
        </p>
      )}
    </div>
  );
}

