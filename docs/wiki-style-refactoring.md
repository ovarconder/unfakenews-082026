# Wiki-Style Refactoring — Siam Heritage

> ปรับปรุงหน้า Article Detail / Microsite Article Detail ให้มีรูปแบบสารานุกรม (Wiki-Style)
> เพิ่มโครงสร้างข้อมูลที่ AI / Search Engine อ่านเข้าใจง่าย
> บังคับใช้ Alt Text อย่างเข้มงวดเพื่อ Accessibility
> **v2.1:** รวม Wiki-Style Metadata ไว้ใน `ArticleMaster` โดยตรง (แก้ไขผ่าน Article Editor)

## สารบัญ

1. [Overview](#overview)
2. [Files Changed](#files-changed)
3. [Architecture](#architecture)
4. [Wiki Metadata System](#wiki-metadata-system)
5. [Entity Quick Facts](#entity-quick-facts)
6. [Excerpt Strategy](#excerpt-strategy)
7. [JSON-LD Schema Markup](#json-ld-schema-markup)
8. [Entity Facts Manager](#entity-facts-manager)
9. [Article Editor Integration (v2.1)](#article-editor-integration-v21)
10. [Components](#components)
11. [Conditional Rendering](#conditional-rendering)
12. [Usage](#usage)
13. [Future Improvements](#future-improvements)

---

## Overview

การ Refactoring ครั้งนี้มีเป้าหมาย 5 ด้าน:

1. **Wiki-Style UX** — ทำให้หน้า Article Detail มีรูปแบบการแสดงผลแบบสารานุกรม (Wikipedia-like) เช่น Quick Facts Box, Glossary, Abstract
2. **AI-Ready Structured Data** — เพิ่ม Schema.org JSON-LD ที่สมบูรณ์ขึ้น รองรับ AI Overview, Knowledge Graph, Voice Search
3. **Accessibility** — ใช้ EnhancedImage ที่บังคับใส่ Alt Text ทุกครั้ง
4. **Entity Knowledge** — เพิ่ม Entity Quick Facts สำหรับบทความที่เป็นเอนทิที (เช่น โขนไทย, วัดพระแก้ว)
5. **Excerpt Strategy** — รองรับ short_excerpt + long_excerpt + social caption

โดยระบบจะแสดงผล Wiki-Style Components **เฉพาะเมื่อมีข้อมูลจริงเท่านั้น** (Conditional Rendering) ทำให้บทความทั่วไปที่ไม่ได้เป็นสารานุกรมจะไม่มีส่วนเหล่านี้แสดง

---

## Files Changed

### New Files (9 files)

| # | File | คำอธิบาย |
|---|------|----------|
| 1 | `lib/wiki-types.ts` | Type definitions: `QuickFact`, `EntityQuickFacts`, `ExcerptStrategy`, `GlossaryEntry`, `WikiSection`, `ArticleAbstract`, `WikiMetadata`, `StrictImageAlt`, `WikiArticle` |
| 2 | `lib/wiki-data.ts` | Data helpers + entityFactsRegistry + excerptRegistry |
| 3 | `components/ui/enhanced-image.tsx` | Strict Alt Text enforcement component |
| 4 | `components/articles/wiki-hero-section.tsx` | Wiki Hero Section — full-width hero + semantic abstract |
| 5 | `components/articles/quick-facts-box.tsx` | Quick Facts Box — Key-Value sidebar box |
| 6 | `components/articles/glossary-section.tsx` | Glossary Section — searchable term-definition pairs |
| 7 | `components/articles/excerpt-section.tsx` | **NEW** — Lead Paragraph + Social Caption |
| 8 | `app/admin/entity-facts/page.tsx` | **NEW** — Entity Facts Manager admin page |
| 9 | `docs/wiki-style-refactoring.md` | เอกสารนี้ |

### Modified Files (3 files)

| # | File | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `components/schema-article.tsx` | Enhanced JSON-LD — เพิ่ม Entity Facts block (แยก schema `Thing`) |
| 2 | `components/articles/article-detail.tsx` |  Integrate ExcerptSection + Entity Facts |
| 3 | `components/microsite/microsite-article-detail.tsx` | Same for Microsite |

---

## Architecture

```
article-detail.tsx / microsite-article-detail.tsx
│
├── SchemaArticle ← enhanced JSON-LD (Article + Entity Thing)
│   ├── Article schema (speakable, PropertyValue, DefinedTerm, hasPart)
│   └── Entity Thing schema (name, description, additionalProperty[])
│
├── WikiHeroSection ← Semantic Hero section
│   ├── <img> → EnhancedImage (strict alt text)
│   └── Semantic abstract for AI Overview
│
├── ExcerptSection ← Lead Paragraph + Social Caption
│   ├── long_excerpt (Lead Paragraph style)
│   └── "Copy for Social Caption" button
│
├── Main Content (original - unchanged)
│   └── renderContent() markdown → JSX
│
└── Sidebar
    ├── QuickFactsBox (Entity Facts OR default facts)
    ├── GlossarySection (conditional)
    ├── Related Articles (original)
    └── Ad / Category (original)
```

### Data Flow (v2.1 — Master-First)

```
Article Editor (ArticleEditor.tsx)
    │
    ├── Entity Info: entityName, entityNameEn, entityType, wikidataId
    ├── Quick Facts: quickFacts[] (label, labelEn, value)
    ├── Glossary: glossary[] (term, termEn, definition, definitionEn)
    └── Excerpt Strategy: shortExcerpt, longExcerpt, socialCaption
    │
    ▼
API (PUT /api/admin/articles/[slug])
    │
    ▼
ArticleMaster (lib/types.ts)
    │  (entityName?, quickFacts?, glossary?, shortExcerpt?, longExcerpt?, ...)
    ▼
getWikiArticle(master) — lib/wiki-data.ts
    │
    ├── 1. ใช้ master.entityName → EntityQuickFacts (ถ้ามี)
    ├── 2. ใช้ master.quickFacts[] → QuickFact[]
    ├── 3. ใช้ master.glossary[] → GlossaryEntry[]
    ├── 4. ใช้ master.shortExcerpt/longExcerpt → ExcerptStrategy
    ├── 5. Fallback entityFactsRegistry / excerptRegistry (ถ้าไม่มีใน master)
    └── 6. Fallback auto-detect จาก content
    │
    ▼
WikiArticle (lib/wiki-types.ts)
    │
    ├── ▶ SchemaArticle (JSON-LD Article + Entity Thing)
    ├── ▶ WikiHeroSection (Hero + Abstract)
    ├── ▶ ExcerptSection (Lead Paragraph + Social Caption)
    ├── ▶ QuickFactsBox (Sidebar)
    └── ▶ GlossarySection (Sidebar)
```

---

## Wiki Metadata System

### WikiArticle Interface

```typescript
interface WikiArticle {
  slug: string;
  title: string;
  abstract: ArticleAbstract;       // short + full
  quickFacts: QuickFact[];         // Key-value pairs
  entityFacts?: EntityQuickFacts;  // Entity-specific facts (optional)
  excerpts?: ExcerptStrategy;      // Excerpt strategy (optional)
  glossary: GlossaryEntry[];       // Term-definition pairs
  sections: WikiSection[];         // Table of contents
  metadata: WikiMetadata;          // Full metadata wrapper
}
```

### How it's built (`lib/wiki-data.ts`) — v2.1 Priority Chain

`buildWikiMetadata()` ตอนนี้ใช้ **Master-First** approach:

```
1. ✅ ถ้า master.entityName มีค่า → สร้าง EntityQuickFacts จาก master โดยตรง
    └── facts จาก master.quickFacts[]

2. ❌ ถ้า master.entityName ไม่มีค่า → Fallback entityFactsRegistry (Map)

3. ✅ ถ้า master.shortExcerpt/longExcerpt มีค่า → สร้าง ExcerptStrategy จาก master

4. ❌ ถ้าไม่มี → Fallback excerptRegistry (Map)

5. ✅ ถ้า master.glossary[] มีค่า → ใช้ glossary จาก master

6. ❌ ถ้าไม่มี → Auto-detect จาก content + tags
```

| Source | Priority | ตัวอย่าง |
|--------|----------|----------|
| **ArticleMaster fields** (v2.1) | ⭐ สูงสุด | `master.entityName = "โขนไทย"`, `master.quickFacts = [...]`, `master.glossary = [...]` |
| **Registry (Map)** | รอง | `entityFactsRegistry.get(slug)` — ใช้เมื่อ master ไม่มีข้อมูล |
| **Auto-detect** | ต่ำสุด | Extract glossary จากเนื้อหา (เช่น "... คือ ...") |

---

## Entity Quick Facts

Entity Quick Facts คือข้อมูลเฉพาะของ **เอนทิที** ที่บทความนั้นพูดถึง เช่น บทความโขนไทย จะมี Entity Name = "โขนไทย" พร้อมข้อมูล:

### ตัวอย่างข้อมูล

```json
{
  "entityName": "โขนไทย (Khon - Thai Masked Dance Drama)",
  "entityType": "tradition",
  "facts": [
    { "label": "รากเหง้าวัฒนธรรม", "value": "ชักนาคดึกดำบรรพ์, กระบี่กระบอง, หนังใหญ่" },
    { "label": "ปีที่ขึ้นทะเบียน UNESCO", "value": "พ.ศ. 2561 (ค.ศ. 2018)" },
    { "label": "ประเภททะเบียน", "value": "Representative List of the Intangible Cultural Heritage of Humanity" },
    { "label": "วรรณกรรมหลัก", "value": "รามเกียรติ์ (Ramakien)" },
    { "label": "วงดนตรีประกอบ", "value": "วงปี่พาทย์ (เครื่องห้า, เครื่องคู่, หรือเครื่องใหญ่)" }
  ]
}
```

### Entity Type

| Type | Schema.org Type | ตัวอย่าง |
|------|----------------|----------|
| `person` | `Person` | พระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลก |
| `place` | `Place` | วัดพระศรีรัตนศาสดาราม |
| `tradition` | `CreativeWork` | โขนไทย, สงกรานต์, ลอยกระทง |
| `object` | `Thing` | พระพุทธรูป, เครื่องถ้วย |
| `event` | `Event` | กีฬาแหลม |
| `concept` | `CreativeWork` | ไตรภูมิ, ทศพิธราชธรรม |
| `other` | `Thing` | อื่นๆ |

### Registry API (Legacy — Fallback)

```typescript
import { registerEntityFacts, getRegisteredEntityFacts, removeRegisteredEntityFacts } from "@/lib/wiki-data";

// Register (fallback — เมื่อ master.entityName ไม่มีค่า)
registerEntityFacts("khon-thai-masked-dance", entityQuickFact);

// Get
const facts = getRegisteredEntityFacts("khon-thai-masked-dance");

// Remove
removeRegisteredEntityFacts("khon-thai-masked-dance");
```

> ⚠️ **v2.1:** Registry API ยังคงมีอยู่เพื่อ backward compatibility แต่ระบบหลักจะใช้ข้อมูลจาก ArticleMaster ซึ่งแก้ไขโดยตรงผ่าน Article Editor แล้ว

---

## Excerpt Strategy

ทุกบทความในระบบรองรับฟิลด์สำหรับสรุปเนื้อหา (Excerpt) 2 รูปแบบ:

### 1. `shortExcerpt`
- **ความยาว:** ไม่เกิน 120-150 ตัวอักษร
- **การใช้งาน:** แสดงผลใต้รูปภาพ Thumbnail ในหน้า Card List/Archive และใช้เป็น `og:description`
- **Schema:** `description` / `abstract`

### 2. `longExcerpt`
- **ความยาว:** 250-400 ตัวอักษร (ประมาณ 1 ย่อหน้าสั้น)
- **การใช้งาน:** แสดงผลด้านบนสุดของหน้าบทความ (Lead Paragraph Style) เป็นบทเกริ่นนำ
- **มีปุ่ม:** "Copy for Social Caption" — กดแล้วคัดลอกข้อความไปโพสต์ Facebook ได้ทันที

### Interface

```typescript
interface ExcerptStrategy {
  shortExcerpt: string;       // ≤150 chars สำหรับ card + meta
  longExcerpt: string;        // 250-400 chars สำหรับ lead paragraph
  seoTitle?: string;          // Override title tag (optional)
  seoDescription?: string;    // Override meta description (optional)
  socialCaption?: string;     // สำหรับ Copy to clipboard (auto = longExcerpt)
}
```

### การทำงาน

```
registerExcerpt(slug, excerptStrategy)
        │
        ▼
buildWikiMetadata()
        │
        ├── abstract.short = shortExcerpt || originalExcerpt
        ├── abstract.full  = longExcerpt || auto-generated from content
        └── excerpts       = excerptStrategy (full object)
                │
                ▼
        ExcerptSection (Lead Paragraph + Copy button)
```

---

## JSON-LD Schema Markup

SchemaArticle สร้าง **2 blocks** ใน `<head>`:

### Block 1: Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "โขนไทย มรดกภูมิปัญญาทางวัฒนธรรม",
  "description": "...",
  "abstract": "...",
  "speakable": { "@type": "SpeakableSpecification", "cssSelector": [...] },
  "about": [{ "@type": "PropertyValue", "name": "รากเหง้าวัฒนธรรม", "value": "..." }],
  "mentions": [{ "@type": "DefinedTerm", "name": "รามเกียรติ์", "description": "..." }],
  "hasPart": [...],
  "timeRequired": "PT5M",
  "keywords": "..."
}
```

### Block 2: Entity Thing Schema (เฉพาะเมื่อมี Entity Facts)

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "โขนไทย (Khon - Thai Masked Dance Drama)",
  "alternateName": "โขนไทย",
  "description": "...",
  "identifier": { "@type": "PropertyValue", "propertyID": "Wikidata", "value": "Q123456" },
  "subjectOf": { "@type": "Article", "url": "..." },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "รากเหง้าวัฒนธรรม", "value": "..." },
    { "@type": "PropertyValue", "name": "ปีที่ขึ้นทะเบียน UNESCO", "value": "พ.ศ. 2561" }
  ]
}
```

**ทำไมต้องแยก 2 blocks?**
- `Article` schema ใช้อธิบายตัวบทความ (บทความเรื่องโขนไทย)
- `Thing` schema ใช้อธิบาย Entity ที่บทความพูดถึง (ตัวโขนไทย)
- Google / AI จะเข้าใจความสัมพันธ์: "บทความนี้พูดถึงอะไร" "ข้อมูลของสิ่งนั้นคืออะไร"

---

## Entity Facts Manager

**URL:** `/admin/entity-facts`

หน้า UI สำหรับจัดการ Entity Facts โดยเฉพาะ:

### Features
1. **ค้นหาบทความ** — เลือกบทความจาก list ที่ filter ได้
2. **แก้ไข Entity Info** — Entity Name (TH/EN), Type, Image, Wikidata ID
3. **จัดการ Quick Facts** — เพิ่ม/ลบ/แก้ไข key-value pairs
4. **Preview JSON** — ดู JSON ที่จะถูกส่งไปยัง Schema.org
5. **บันทึก/ลบ** — ลงทะเบียน entity facts (in-memory → จะ Persist เมื่อมี Database)

### Screenshot Layout
```
┌─────────────────────────────────────────────────────┐
│  Entity Facts Manager                               │
│  จัดการ Entity Name และ Quick Facts                  │
│  บทความที่มี Entity Facts: 5 รายการ                   │
├─────────────┬───────────────────────────────────────┤
│ เลือกบทความ  │ Entity Information                    │
│ ┌─────────┐ │ ┌──────────┐ ┌──────────┐             │
│ │ ค้นหา... │ │ │Entity TH │ │Entity EN │            │
│ ├─────────┤ │ ├──────────┴─┴──────────┤             │
│ │ โขนไทย   │ │ │ Entity Type: 🎭 Tradition  │       │
│ │ วัดพระแก้ว│ │ ├──────────┬──────────┤             │
│ │ สงกรานต์  │ │ │Image URL │ Wikidata │             │
│ └─────────┘ │ └──────────┴──────────┘             │
│             │ Quick Facts                          │
│ Saved List  │ ┌─Label───────────┬─Value──────────┐ │
│ ┌─────────┐ │ │ รากเหง้าวัฒนธรรม │ ชักนาค...       │ │
│ │ โขนไทย   │ │ │ UNESCO ปี        │ พ.ศ. 2561     │ │
│ │ วัดพระแก้ว│ │ └────────────────┴────────────────┘ │
│ └─────────┘ │ [เพิ่มแถว]              [💾 บันทึก]   │
└─────────────┴───────────────────────────────────────┘
```

---

## ExcerptSection Component

`components/articles/excerpt-section.tsx`

### Features
1. **Lead Paragraph** — แสดง `longExcerpt` ด้วยขนาดตัวอักษรใหญ่กว่า, ตัวเอียง, มี border สีอำพันด้านซ้าย
2. **Copy for Social Caption** — ปุ่มคัดลอกข้อความสำหรับโพสต์ Facebook:
   ```
   [SEO Title]

   [socialCaption]

   🏛️  UnFake News
   ```
3. **Hidden SEO Metadata** — `itemProp`, `data-wiki` สำหรับ AI/crawler

### Usage

```tsx
<ExcerptSection
  excerpts={wikiData.excerpts}
  locale={locale}
  fallbackShort={article.excerpt}
  fallbackLong={wikiData.abstract.full}
/>
```

---

## All Components

| Component | File | แสดงเมื่อ |
|-----------|------|----------|
| **WikiHeroSection** | `wiki-hero-section.tsx` | Always (hero image + abstract) |
| **QuickFactsBox** | `quick-facts-box.tsx` | `facts.length > 0` (always have defaults) |
| **GlossarySection** | `glossary-section.tsx` | มี glossary entry ที่มี definition |
| **ExcerptSection** | `excerpt-section.tsx` | `wikiData.excerpts` ถูกตั้งค่า |
| **SchemaArticle** | `schema-article.tsx` | Always (2 JSON-LD blocks) |
| **EnhancedImage** | `ui/enhanced-image.tsx` | ใช้แทน `<img>` ปกติ |

---

## Conditional Rendering

> **สำคัญ:** Wiki-Style Components จะแสดง **เฉพาะเมื่อมีข้อมูลจริงเท่านั้น**

### GlossarySection
```tsx
{wikiData.glossary.some(e => e.definition && e.definition.length > 0) && (
  <GlossarySection entries={wikiData.glossary} ... />
)}
```

### ExcerptSection
```tsx
{wikiData.excerpts && (
  <ExcerptSection excerpts={wikiData.excerpts} ... />
)}
```

### Entity Facts JSON-LD
```tsx
if (entityFacts && entityFacts.facts.length > 0) {
  // สร้าง block แยกสำหรับ Entity Thing
}
```

---

## Usage

```tsx
// 1. Import
import WikiHeroSection from "@/components/articles/wiki-hero-section";
import QuickFactsBox from "@/components/articles/quick-facts-box";
import GlossarySection from "@/components/articles/glossary-section";
import ExcerptSection from "@/components/articles/excerpt-section";
import { getWikiArticle } from "@/lib/wiki-data";
import type { WikiArticle } from "@/lib/wiki-types";

// 2. Build wiki data
const wikiData: WikiArticle = getWikiArticle(master);

// 3. Render
<>
  <SchemaArticle article={master} wikiMetadata={wikiData.metadata} />
  <WikiHeroSection ... />
  
  {wikiData.excerpts && <ExcerptSection ... />}
  
  <QuickFactsBox facts={wikiData.quickFacts} ... />
  
  {wikiData.glossary.some(e => e.definition?.length) && (
    <GlossarySection entries={wikiData.glossary} ... />
  )}
</>
```

---

## Image Alt Translation (v2.2)

> alt text ของรูปภาพใน content (markdown `![alt](url)`) จะถูกแปลไปพร้อมกับ JIT content translation
> เมื่อมีคนอ่านบทความในภาษาที่ไม่ใช่ภาษาไทยครั้งแรก

### Flow

```
User reads article in English (first time)
    │
    ▼
POST /api/translate-content/khon-thai { locale: "en" }
    │
    ├── jitTranslateContent(slug, locale, originalContent)
    │   ├── callGemini(translateContent → translated markdown)
    │   ├── extractImageAltsFromContent(originalContent)
    │   │   └── ["รูปโขนไทยที่วัดพระแก้ว", "ท่าละครของโขน"]
    │   ├── localizeImageAlts(locale, alts)
    │   │   └── Gemini: {"url1": "Khon performance at Wat Phra Kaew", "url2": "Dance posture of Khon"}
    │   ├── replaceImageAltsInContent(translated, localizedAlts)
    │   └── saveTranslatedArticle(..., imageAltTexts, content-with-translated-alts)
    │
    ▼
Response: { content, imageAltTexts: { "url1": "...", "url2": "..." } }
    │
    ▼
renderContent(content, translatedAlts)
    └── applyTranslatedAltTexts(content, translatedAlts)
        └── ![Khon performance at Wat Phra Kaew](url1)
```

### Key Functions

| Function | File | หน้าที่ |
|----------|------|--------|
| `extractImageAltsFromContent()` | `lib/translation-manager.ts` | Extract `{ url → alt }` จาก markdown content |
| `replaceImageAltsInContent()` | `lib/translation-manager.ts` | Replace alt text ใน content ที่แปลแล้วด้วยเวอร์ชันที่ localize |
| `applyTranslatedAltTexts()` | `components/articles/article-detail.tsx` | Client-side: แทนที่ alt text ใน content ก่อน render |
| `localizeImageAlts()` | `lib/translation-manager.ts` | เรียก Gemini เพื่อแปล alt texts (ใช้ `buildImageAltLocalizationPrompt`) |
| `buildImageAltLocalizationPrompt()` | `lib/cultural-localization-prompt.ts` | สร้าง prompt ที่มีกฏ Cultural Localization |

### Cultural Localization Rules for Alt Text

Alt text ของรูปภาพเกี่ยวกับวัฒนธรรมไทยต้องแปลแบบมีบริบท:

```
✅ "รูปโขนไทยที่วัดพระแก้ว" → "Khon masked dance performance at Wat Phra Kaew (Temple of the Emerald Buddha)"
✅ "ท่าละครของโขน" → "Classical dance posture of Khon (Thai masked dance-drama)"
✅ "ลายกนกบนบานประตู" → "Lai Kanok (Thai traditional gold-leaf patterns) on door panels"

❌ "Khon at temple" → (ขาดบริบททางวัฒนธรรม)
❌ "Thai dance" → (ไม่เจาะจงพอ — โขนไม่ใช่ dance ทั่วไป)
```

### Data Flow for Alt Texts

```
Pre-translate (Tier 2):
    └── localizeImageAlts(locale, master) → แปล master.imageAlt (hero) → imageAltTexts["hero"]

JIT Translate (Tier 1+2):
    ├── extractImageAltsFromContent(originalContent) → imageAltTexts (ทุก url)
    ├── localizeImageAlts(locale, allAlts)
    ├── replaceImageAltsInContent(translatedContent, localizedAlts)
    └── save + return

Client Render:
    └── renderContent(content, translatedAlts) → img element พร้อม alt ที่แปลแล้ว
```

### API Response Format

```json
{
  "success": true,
  "cached": false,
  "content": "![Khon performance at Wat Phra Kaew](https://.../khon-1.jpg)\n\nKhon is a traditional Thai masked dance...",
  "imageAltTexts": {
    "https://.../khon-1.jpg": "Khon performance at Wat Phra Kaew (Temple of the Emerald Buddha)",
    "https://.../khon-2.jpg": "Dance posture of Khon (Thai masked dance-drama)"
  }
}
```

### Files Modified for Alt Translation (v2.2)

| # | File | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `lib/translation-manager.ts` | Add `extractImageAltsFromContent()`, `replaceImageAltsInContent()`, update `jitTranslateContent()` |
| 2 | `app/api/translate-content/[slug]/route.ts` | Return `imageAltTexts` ใน response |
| 3 | `lib/translation-client-store.ts` | Add `imageAltTexts` to return type |
| 4 | `components/articles/article-detail.tsx` | `renderContent()` receive `translatedAlts`, add `translatedAlts` state, update useEffect |
| 5 | `components/microsite/microsite-article-detail.tsx` | Same changes |
| 6 | `lib/wiki-data.ts` | Add `extractImageAltsFromContentFn()` |

---

## Future Improvements

1. **Database-backed registries** — เปลี่ยน entityFactsRegistry + excerptRegistry จาก in-memory Map เป็น Supabase/PostgreSQL
2. **Wiki-style Table of Contents** — sticky sidebar TOC จาก `WikiSection[]`
3. **Infobox templates** — customizable Quick Facts layouts per category
4. **AI-generated definitions** — ใช้ Gemini API auto-generate glossary definitions สำหรับ tags
5. **Knowledge Graph integration** — Auto-fill Wikidata Q-ID from Wikipedia API
6. **Social Media auto-poster** — เชื่อมต่อ Copy for Social Caption กับ Facebook API
7. **Entity Facts import/export** — JSON/CSV batch import
