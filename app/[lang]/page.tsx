import { HomePage } from "@/components/home/home-page";
import type { Locale } from "@/lib/locales";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LangHomePage({ params }: Props) {
  const { lang } = await params;

  return <HomePage locale={lang as Locale} />;
}
