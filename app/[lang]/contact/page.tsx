import { ContactPage } from "@/components/contact/contact-page";
import type { Locale } from "@/lib/locales";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LangContactPage({ params }: Props) {
  const { lang } = await params;

  return <ContactPage locale={lang as Locale} />;
}
