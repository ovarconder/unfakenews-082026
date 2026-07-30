import { ArticlesPage } from "@/components/articles/articles-page";
import type { Locale } from "@/lib/locales";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LangArticlesPage({ params }: Props) {
  const { lang } = await params;

  return <ArticlesPage locale={lang as Locale} />;
}
