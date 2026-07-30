import { AboutPage } from "@/components/about/about-page";
import type { Locale } from "@/lib/locales";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LangAboutPage({ params }: Props) {
  const { lang } = await params;

  return <AboutPage locale={lang as Locale} />;
}
