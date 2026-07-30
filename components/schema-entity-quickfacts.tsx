// ============================================================
// Schema.org Entity Quick Facts JSON-LD
// ============================================================
// - ใช้สำหรับบทความที่เป็นเอนทิตีเฉพาะ เช่น โขนไทย, วัดพระแก้ว
// - แทรกไว้ใน <head> เพื่อให้ Google / AI อ่านได้โดยตรง
// - สร้าง PropertyValue[] + Thing + Intangible schema
// ============================================================
// Example:
// <SchemaEntityQuickFacts
//   entityName="โขนไทย"
//   entityNameEn="Khon - Thai Masked Dance Drama"
//   entityType="tradition"
//   facts={[
//     { key: "รากเหง้าวัฒนธรรม", value: "ชักนาคดึกดำบรรพ์, กระบี่กระบอง, หนังใหญ่" },
//     { key: "ปีที่ขึ้นทะเบียน UNESCO", value: "พ.ศ. 2561 (ค.ศ. 2018)" },
//     { key: "ประเภททะเบียน", value: "Representative List of the Intangible Cultural Heritage of Humanity" },
//     { key: "วรรณกรรมหลัก", value: "รามเกียรติ์ (Ramakien)" },
//     { key: "วงดนตรีประกอบ", value: "วงปี่พาทย์ (เครื่องห้า, เครื่องคู่, หรือเครื่องใหญ่)" },
//   ]}
// />
// ============================================================

import { SITE_URL } from "@/lib/constants";
import type { EntityQuickFacts } from "@/lib/wiki-types";

interface EntityFactItem {
  key: string;
  value: string;
  keyEn?: string;
}

interface SchemaEntityQuickFactsProps {
  entityName: string;
  entityNameEn?: string;
  entityType: "person" | "place" | "tradition" | "object" | "event" | "concept" | "other";
  facts: EntityFactItem[];
  imageUrl?: string;
  articleSlug?: string;
  wikidataId?: string;
}

/**
 * Entity type → Schema.org @type mapping
 */
const ENTITY_TYPE_MAP: Record<string, string> = {
  person: "Person",
  place: "Place",
  tradition: "CulturalProperty",     // Custom schema.org extension
  object: "CreativeWork",
  event: "Event",
  concept: "DefinedTerm",
  other: "Thing",
};

export function SchemaEntityQuickFacts({
  entityName,
  entityNameEn,
  entityType,
  facts,
  imageUrl,
  articleSlug,
  wikidataId,
}: SchemaEntityQuickFactsProps) {
  // ========== Build main entity ==========
  const schemaType = ENTITY_TYPE_MAP[entityType] || "Thing";
  const entityId = wikidataId
    ? `https://www.wikidata.org/wiki/${wikidataId}`
    : articleSlug
      ? `${SITE_URL}/th/articles/${articleSlug}`
      : undefined;

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: entityNameEn || entityName,
    ...(entityNameEn ? { alternateName: entityName } : {}),
    ...(entityId ? { "@id": entityId } : {}),
    ...(wikidataId ? { sameAs: `https://www.wikidata.org/wiki/${wikidataId}` } : {}),
  };

  // ========== Image ==========
  if (imageUrl) {
    schema.image = imageUrl;
  }

  // ========== Facts → PropertyValue ==========
  if (facts.length > 0) {
    schema.additionalProperty = facts.map((fact) => ({
      "@type": "PropertyValue",
      name: fact.keyEn || fact.key,
      value: fact.value,
      ...(fact.keyEn ? { alternateName: fact.key } : {}),
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
      data-wiki="entity-quickfacts"
    />
  );
}

// ============================================================
// Utility: Convert EntityQuickFacts → SchemaEntityQuickFacts props
// ============================================================

export function entityFactsToSchemaProps(
  entityFacts: EntityQuickFacts,
  articleSlug?: string,
): SchemaEntityQuickFactsProps {
  return {
    entityName: entityFacts.entityName,
    entityNameEn: entityFacts.entityNameEn,
    entityType: entityFacts.entityType,
    facts: entityFacts.facts.map((f) => ({
      key: f.label,
      value: f.value,
      keyEn: f.labelEn,
    })),
    imageUrl: entityFacts.imageUrl,
    articleSlug,
    wikidataId: entityFacts.wikidataId,
  };
}
