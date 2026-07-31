import type { Locale } from "@/lib/locales";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-prompt font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-white/70 text-sm leading-relaxed space-y-4">
          <p>By accessing or using this website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this site.</p>
          <p>All content published on this site is provided for informational purposes only. We reserve the right to modify, update, or remove content at any time without prior notice.</p>
          <p>You agree not to use this site for any unlawful purpose, to reproduce or redistribute our content without permission, or to interfere with the proper functioning of the website.</p>
          <p>For any questions regarding these terms, please contact us through the contact page.</p>
        </div>
      </div>
    </div>
  );
}
