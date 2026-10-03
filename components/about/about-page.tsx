import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { ShieldCheck, Search, HeartHandshake } from "lucide-react";

interface AboutPageProps {
  locale: Locale;
}

export function AboutPage({ locale }: AboutPageProps) {
  const values = [
    {
      icon: ShieldCheck,
      title: t("about.value1Title", locale),
      desc: t("about.value1Desc", locale),
    },
    {
      icon: Search,
      title: t("about.value2Title", locale),
      desc: t("about.value2Desc", locale),
    },
    {
      icon: HeartHandshake,
      title: t("about.value3Title", locale),
      desc: t("about.value3Desc", locale),
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-primary/40" />
            <span className="text-brand-primary/60 text-xs uppercase tracking-[0.2em] font-medium">
              {t("about.eyebrow", locale)}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-primary/40" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-prompt font-bold text-white mb-6">
            {t("about.title", locale)}
          </h1>
          <p className="text-white/60 text-lg max-w-3xl mx-auto leading-relaxed">
            {t("about.description", locale)}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-xl bg-gradient-to-br from-brand-bg-secondary to-brand-card border border-white/10">
            <h2 className="text-xl font-prompt font-bold text-brand-primary mb-4">
              {t("about.mission", locale)}
            </h2>
            <p className="text-white/70 leading-relaxed">
              {t("about.missionDesc", locale)}
            </p>
          </div>
          <div className="p-8 rounded-xl bg-gradient-to-br from-brand-bg-secondary to-brand-card border border-white/10">
            <h2 className="text-xl font-prompt font-bold text-brand-primary mb-4">
              {t("about.vision", locale)}
            </h2>
            <p className="text-white/70 leading-relaxed">
              {t("about.visionDesc", locale)}
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-prompt font-bold text-white text-center mb-10">
            {t("about.values", locale)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {values.map((value, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-xl bg-brand-bg-secondary/60 border border-white/5 hover:border-brand-primary/20 transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-primary/20 transition-colors">
                  <value.icon className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-lg font-prompt font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

