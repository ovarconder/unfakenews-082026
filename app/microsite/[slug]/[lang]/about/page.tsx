// ============================================================
// Microsite About Page
// ============================================================

import { getMicrositeBySlug, getMergedMicrositeSettings } from "@/lib/microsite-service";
import { getLocale, type Locale } from "@/lib/locales";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function MicrositeAboutPage({ params }: PageProps) {
  const { slug, lang } = await params;
  const locale = getLocale(lang);
  
  const microsite = await getMicrositeBySlug(slug);
  if (!microsite || !microsite.is_active) {
    notFound();
  }


  const settings = await getMergedMicrositeSettings(microsite);
  const content = locale === "th" 
    ? microsite.about_content_th 
    : microsite.about_content_en;
  const primaryColor = settings?.primaryColor || "#fbbf24";

  return (
    <section 
      className="pt-28 pb-20 min-h-screen"
      style={{ backgroundColor: settings?.backgroundColor || '#060e1a' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${slug}/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={16} />
          {locale === "th" ? "กลับไปหน้าแรก" : "Back to home"}
        </Link>

        <div className="flex items-center gap-4 mb-8">
          {microsite.logo_url && (
            <img
              src={microsite.logo_url}
              alt={microsite.name}
              className="w-16 h-16 rounded-xl"
            />
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">
              {locale === "th" ? "เกี่ยวกับ" : "About"} {microsite.name}
            </h1>
          </div>
        </div>

        {content ? (
          <div className="prose prose-invert max-w-none">
            <p className="text-white/80 leading-relaxed text-lg whitespace-pre-line">
              {content}
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">
              {locale === "th" ? "ไม่มีข้อมูลในขณะนี้" : "No information available"}
            </p>
          </div>
        )}

        {microsite.contact_email && (
          <div className="mt-12 p-6 rounded-xl border border-white/10"
            style={{ backgroundColor: settings?.cardColor || '#0f1f3a' }}
          >
            <h2 className="text-white font-semibold mb-2">
              {locale === "th" ? "ติดต่อเรา" : "Contact Us"}
            </h2>
            <a 
              href={`mailto:${microsite.contact_email}`}
              className="transition-colors"
              style={{ color: primaryColor }}
            >
              {microsite.contact_email}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}