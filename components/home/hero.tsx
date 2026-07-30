import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import Link from "next/link";

interface HeroProps {
  locale: Locale;
}

export function Hero({ locale }: HeroProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#0d1b2a]">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1b2a] to-[#0d1b2a] z-10" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Ornamental pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        {/* Decorative top */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/50" />
          <div className="w-2 h-2 rotate-45 bg-amber-400/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/50" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight">
          <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
            {t("hero.title", locale)}
          </span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
          {t("hero.subtitle", locale)}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/${locale}/articles`}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all duration-300 shadow-lg shadow-amber-400/20"
          >
            {t("hero.cta", locale)}
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/about`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 hover:text-amber-200 transition-all"
          >
            {t("hero.learnMore", locale)}
          </Link>
        </div>
      </div>

      {/* Decorative bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a1628] to-transparent z-10" />
    </section>
  );
}

