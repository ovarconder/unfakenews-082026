"use client";

import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { useState } from "react";
import { Send, Mail, MapPin, Phone } from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

interface ContactPageProps {
  locale: Locale;
}

export function ContactPage({ locale }: ContactPageProps) {
  const settings = useSettings();
  const contactEmail = settings?.email || "info@unfakenews.asia";
  const contactPhone = settings?.phone || "";
  const contactAddress = settings?.address || "";
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending
    setTimeout(() => {
      setSent(true);
      setFormData({ name: "", email: "", message: "" });
    }, 500);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-primary/40" />
            <span className="text-brand-primary/60 text-xs uppercase tracking-[0.2em] font-medium">
              {t("contact.eyebrow", locale)}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-primary/40" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-prompt font-bold text-white mb-6">
            {t("contact.title", locale)}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            {t("contact.description", locale)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {sent ? (
              <div className="p-8 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#0f1f3a] border border-green-500/20 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-lg font-medium">
                  {t("contact.sent", locale)}
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 text-brand-primary text-sm hover:text-brand-primary transition-colors"
                >
                  {t("contact.sendAnother", locale)}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {t("contact.name", locale)}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/20 transition-colors"
                    placeholder={t("contact.namePlaceholder", locale)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {t("contact.email", locale)}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/20 transition-colors"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {t("contact.message", locale)}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/20 transition-colors resize-none"
                    placeholder={t("contact.messagePlaceholder", locale)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg font-semibold bg-brand-gradient-hover transition-all duration-300 shadow-lg shadow-brand-primary/20"
                >
                  <Send size={16} />
                  {t("contact.send", locale)}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-brand-bg-secondary to-brand-card border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{t("contact.emailLabel", locale)}</h3>
                  <p className="text-white/50 text-sm">{contactEmail}</p>
                </div>
              </div>
            </div>
            {contactAddress && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-brand-bg-secondary to-brand-card border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {t("contact.addressLabel", locale)}
                    </h3>
                    <p className="text-white/50 text-sm">
                      {contactAddress}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {contactPhone && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-brand-bg-secondary to-brand-card border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {t("contact.phoneLabel", locale)}
                    </h3>
                    <p className="text-white/50 text-sm">
                      {contactPhone}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="p-8 rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 border border-brand-primary/10">
              <p className="text-white/60 text-sm leading-relaxed italic">
                &ldquo;{t("contact.quote", locale)}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
