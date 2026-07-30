
import type { ArticleMaster } from "@/lib/types";
import type { WikiMetadata } from "@/lib/wiki-types";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface SchemaArticleProps {
  article: ArticleMaster;
  imageUrl?: string;
  dateModified?: string;
  wikiMetadata?: WikiMetadata;
  localeUrl?: string;
  alternateLocales?: Record<string, string>;
}

export function SchemaArticle({
  article,
  imageUrl,
  dateModified,
  wikiMetadata,
  localeUrl,
  alternateLocales,
}: SchemaArticleProps) {
    // ============================================================
    // Image Metadata — สำหรับ Google Images
    // ทำให้ Google Images รู้ที่มา / Credit / ช่างภาพของรูปภาพ
    // ป้องกันการถูกอ้างว่าเป็นของผู้อื่น
    // ============================================================
    const imageSchema = imageUrl
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          ...(article.imageAlt ? { caption: article.imageAlt } : {}),
          ...(article.imageCredit ? { creditText: article.imageCredit } : {}),
          ...(article.imagePhotographer ? { photographer: article.imagePhotographer } : {}),
          ...(article.imageYear ? { dateCreated: article.imageYear } : {}),
          ...(article.imageSourceUrl
            ? { associatedArticle: { "@type": "Article", url: article.imageSourceUrl } }
            : {}),
          representativeOfPage: true,
        }
      : imageUrl || `${SITE_URL}/og-default.jpg`;

    const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.originalTitle,
    description: wikiMetadata?.abstract?.short || article.originalExcerpt,
    url: localeUrl || `${SITE_URL}/th/articles/${article.slug}`,
    image: imageSchema,
    datePublished: article.publishedAt,
    dateModified: dateModified || article.publishedAt,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": localeUrl || `${SITE_URL}/th/articles/${article.slug}`,
    },
  };

  // Abstract / Speakable (AI Overview)
  if (wikiMetadata?.abstract?.short) {
    schema.description = wikiMetadata.abstract.short;
    schema.abstract = wikiMetadata.abstract.full || wikiMetadata.abstract.short;
    schema.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-wiki='abstract-short']", "[data-wiki='abstract-full']"],
    };
  }

  // Keywords (tags + category + subcategories)
  const kw: string[] = [];
  if (article.tags) kw.push(...article.tags);
  if (article.category) kw.push(article.category);
  if (wikiMetadata?.subcategories) kw.push(...wikiMetadata.subcategories);
  if (kw.length > 0) schema.keywords = [...new Set(kw)].join(", ");
  if (article.category) schema.articleSection = article.category;

  // Quick Facts → PropertyValue
  if (wikiMetadata?.quickFacts?.length) {
    schema.about = wikiMetadata.quickFacts.map((f) => ({
      "@type": "PropertyValue",
      name: f.labelEn || f.label,
      value: f.value,
      ...(f.labelEn ? { alternateName: f.label } : {}),
    }));
  }

  // Glossary → DefinedTerm
  if (wikiMetadata?.glossary?.length) {
    const terms = wikiMetadata.glossary
      .filter((e) => e.definition)
      .map((e) => ({
        "@type": "DefinedTerm",
        name: e.term,
        ...(e.termEn ? { alternateName: e.termEn } : {}),
        description: e.definition,
        ...(e.slug ? { url: `${SITE_URL}${e.slug}` } : {}),
      }));
    if (terms.length) schema.mentions = terms;
  }

  // Sections → hasPart
  if (wikiMetadata?.sections?.length) {
    schema.hasPart = wikiMetadata.sections.map((s) => ({
      "@type": "WebPageElement",
      name: s.title,
      description: s.content.substring(0, 200).replace(/\n/g, " ").trim(),
    }));
  }

  // Time to read
  if (article.originalContent) {
    const mins = Math.max(1, Math.ceil(article.originalContent.split(/\s+/).length / 200));
    schema.timeRequired = `PT${mins}M`;
  }

  // ============================================================
  // Entity Facts JSON-LD — Schema.org Thing
  // สร้าง block แยกสำหรับ Entity Name + PropertyValue
  // ทำให้ Google / AI อ่าน Entity Name ของบทความได้ชัดเจน
  // ============================================================
  const entityFacts = wikiMetadata?.entityFacts;
  let entityFactsSchema: Record<string, any> | null = null;

  if (entityFacts && entityFacts.facts.length > 0) {
    // Map entity type to Schema.org type
    const typeMap: Record<string, string> = {
      person: "Person",
      place: "Place",
      tradition: "CreativeWork",
      object: "Thing",
      event: "Event",
      concept: "CreativeWork",
      other: "Thing",
    };

    const schemaType = typeMap[entityFacts.entityType] || "Thing";

    entityFactsSchema = {
      "@context": "https://schema.org",
      "@type": schemaType,
      name: entityFacts.entityNameEn || entityFacts.entityName,
      ...(entityFacts.entityNameEn ? { alternateName: entityFacts.entityName } : {}),
      description: wikiMetadata?.abstract?.short || article.originalExcerpt,
      ...(entityFacts.imageUrl ? { image: entityFacts.imageUrl } : {}),
      ...(entityFacts.wikidataId
        ? { identifier: { "@type": "PropertyValue", propertyID: "Wikidata", value: entityFacts.wikidataId } }
        : {}),
      subjectOf: {
        "@type": "Article",
        url: localeUrl || `${SITE_URL}/th/articles/${article.slug}`,
      },
      additionalProperty: entityFacts.facts.map((f) => ({
        "@type": "PropertyValue",
        name: f.labelEn || f.label,
        value: f.value,
        ...(f.labelEn ? { alternateName: f.label } : {}),
      })),
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
        data-wiki="schema-jsonld"
      />
      {entityFactsSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entityFactsSchema, null, 2) }}
          data-wiki="entity-facts-jsonld"
        />
      )}
    </>
  );
}
