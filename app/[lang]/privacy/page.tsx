import type { Locale } from "@/lib/locales";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-prompt font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-white/70 text-sm leading-relaxed space-y-4">
          <p>This website uses Google Analytics to collect anonymous usage data. We do not collect or store personal information beyond what is necessary for analytics purposes.</p>
          <p>By using this site, you consent to the use of cookies as described in our cookie consent banner. You can withdraw your consent at any time by clearing your browser cookies.</p>
          <p>For any privacy-related inquiries, please contact us through the contact page.</p>
        </div>
      </div>
    </div>
  );
}
