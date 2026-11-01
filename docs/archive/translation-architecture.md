# Translation Architecture

> อัปเดตล่าสุด: มิถุนายน 2025

## สารบัญ

1. [ภาพรวม](#1-ภาพรวม)
2. [Tier System (Dynamic)](#2-tier-system-dynamic)
3. [API Routes](#3-api-routes)
4. [Dirty Field Logic (Re-translate on Edit)](#4-dirty-field-logic-re-translate-on-edit)
5. [JIT (Just-in-Time) Content Translation](#5-jit-just-in-time-content-translation)
6. [ฟังก์ชันใน translate-service.ts](#6-ฟังก์ชันใน-translate-servicets)
7. [Social Caption Policy](#7-social-caption-policy)
8. [Tags/Keywords Translation](#8-tagskeywords-translation)
9. [Image Alt Texts Translation](#9-image-alt-texts-translation)
10. [Title Tag จาก Database](#10-title-tag-จาก-database)
11. [Admin Settings → Translation](#11-admin-settings--translation)
12. [การ Fork ไปงานอื่น](#12-การ-fork-ไปงานอื่น)

---

## 1. ภาพรวม

ระบบแปลภาษาของ Siam Heritage ใช้ **Gemini API** (Google AI Studio) เป็น provider หลัก โดยออกแบบให้สามารถเปลี่ยน API provider ได้ในภายหลังผ่านหน้า Admin

**ไฟล์หลัก:** `lib/translate-service.ts` (rename จาก `lib/gemini-service.ts`)

```
lib/translate-service.ts        ← Logic หลักทั้งหมด
app/api/translate-new/route.ts   ← แปลบทความเดียว (trigger on publish/edit)
app/api/translate-all/route.ts   ← Batch แปลทุกบทความ
app/api/translate-content/[slug]/route.ts  ← JIT แปล content (Tier 2)
```

### Model Selection

| Task | Model | Cost |
|------|-------|------|
| Tier 1 Full Content | Gemini 2.0 Flash | ~$0.001/article |
| Tier 2 Summary (SEO) | Gemini 2.0 Flash | ~$0.0003/article |
| Tier 2 JIT Content | Gemini 2.0 Pro | ~$0.003/article |

---

## 2. Tier System (Dynamic)

Tier ของแต่ละภาษา **ไม่ได้ hardcode** แต่อ่านจาก **Database** (`site_settings.locale_tiers`) ซึ่ง Admin สามารถปรับได้จากหน้า `/admin/settings`

### Default Tiers (เมื่อ DB ยังไม่มีค่า)

| Tier | ภาษา | พฤติกรรม |
|------|------|----------|
| **Tier 0** (Disabled) | — | ไม่แสดง, ไม่แปล |
| **Tier 1** (Full) | `en`, `zh`, `ja`, `es`, `pt` | แสดงใน Header, แปลเต็มเมื่อ publish/edit |
| **Tier 2** (Summary+JIT) | `fr`, `ko`, `de`, `ru`, `ar`, `hi`, `it`, `vi`, `ms` | ไม่แสดงใน Header, แปลเฉพาะ SEO, content แบบ JIT |

### Behavior ตาม Tier

| Component | Tier 1 | Tier 2 |
|-----------|--------|--------|
| **Title** | ✅ แปลทันที | ✅ แปลทันที |
| **shortExcerpt** | ✅ แปลทันที | ✅ แปลทันที |
| **longExcerpt** | ✅ แปลทันที | ✅ แปลทันที |
| **Content** | ✅ แปลทันที | ❌ **JIT** (แปลเมื่ออ่าน) |
| **Tags** | ✅ แปลทันที | ✅ แปลทันที |
| **Image Alt Texts** | ✅ แปลทันที | ✅ แปลทันที |
| **Entity Name** | ✅ แปลทันที | ✅ แปลทันที |
| **Quick Facts** | ✅ แปลทันที | ✅ แปลทันที |
| **Glossary** | ✅ แปลทันที | ✅ แปลทันที |
| **Social Caption** | ❌ **ไม่แปล** | ❌ **ไม่แปล** |

### การตรวจสอบ Tier ในโค้ด

```typescript
import { isDisabled, isTier2, isTier1 } from "@/lib/locales";

const isTier2Locale = isTier2(targetLocale); // true/false
const isDisabledLocale = isDisabled(targetLocale); // true/false
```

Tier อ่านจาก `lib/locales.ts` ซึ่ง sync ค่าจาก `lib/site-settings.ts` (Database) ทุกครั้งที่มีการเรียก `getSettings()`

---

## 3. API Routes

### `POST /api/translate-new`

แปล/แปลใหม่ บทความเดียว

**Request:**
```json
{
  "slug": "khon-thai-masked-dance",
  "locale": "en",
  "dirtyFields": ["title", "content"]   // optional: ถ้าไม่มี = แปลทั้งหมด
}
```

**Response:**
```json
{
  "success": true,
  "slug": "khon-thai-masked-dance",
  "locale": "en",
  "tier": "1",
  "dirtyFields": ["title", "content"],
  "title": "Khon: Thai Masked Dance Drama",
  "isFullTranslated": true
}
```

### `POST /api/translate-all`

Batch แปลทุกบทความที่ตีพิมพ์แล้ว สำหรับ 1 ภาษา

**Request:**
```json
{
  "locale": "en"
}
```

**Response:**
```json
{
  "success": true,
  "locale": "en",
  "tier": "1",
  "total": 25,
  "results": [
    { "slug": "khon", "status": "translated" },
    { "slug": "songkran", "status": "translated" }
  ]
}
```

### `GET /api/translate-content/[slug]?locale=en`

JIT — เรียกเมื่อ user เปิดอ่านบทความภาษา Tier 2

**Response (cached):**
```json
{
  "success": true,
  "content": "translated markdown content...",
  "cached": true
}
```

**Response (first time — ต้องแปล):**
```json
{
  "success": true,
  "content": "translated markdown content...",
  "cached": false,
  "fromTier2": true
}
```

---

## 4. Dirty Field Logic (Re-translate on Edit)

เมื่อ Admin แก้ไขบทความ ระบบจะตรวจจับว่า **ส่วนไหนถูกแก้ไข (dirty)** แล้วส่งเฉพาะส่วนนั้นไปแปลใหม่

### กลไก

1. **Frontend** (`article-editor.tsx`) ติดตามว่าฟิลด์ไหนถูกแก้ไข
2. ส่ง `dirtyFields` array ไปกับ `POST /api/translate-new`
3. Route จะแปลเฉพาะ dirty fields + อัปเดตเฉพาะ column ที่เกี่ยวข้องใน DB

### Dirty Fields ที่รองรับ

```typescript
type DirtyField =
  | "title"
  | "short_excerpt"
  | "long_excerpt"
  | "content"
  | "tags"
  | "image_alts"
  | "entity_name"
  | "quick_facts"
  | "glossary";
```

### Special Cases

| กรณี | พฤติกรรม |
|------|----------|
| **Publish ครั้งแรก** | ไม่มี `dirtyFields` → แปลทุกอย่าง |
| **Edit แก้ไข title** | `dirtyFields: ["title"]` → แปลเฉพาะ title |
| **Tier 2 + แก้ไข content** | `dirtyFields: ["content"]` → **Clear content ใน DB** (JIT จะแปลใหม่) |
| **Tier 1 + แก้ไข content** | `dirtyFields: ["content"]` → Re-translate content |
| **แก้ไขหลายส่วน** | `dirtyFields: ["title", "tags", "quick_facts"]` |

---

## 5. JIT (Just-in-Time) Content Translation

สำหรับ **Tier 2** บทความจะถูกแปลเฉพาะ SEO/Head fields เมื่อ publish ส่วน **content จะถูกแปลเมื่อมีคนเปิดอ่านครั้งแรก**

### Flow

```
User เปิดบทความภาษา Tier 2
        │
        ▼
Frontend → GET /api/translate-content/[slug]?locale=fr
        │
        ▼
Check translations table → content column
        │
        ├── มี content อยู่แล้ว → return cached
        │
        └── content === "" → เรียก Gemini Pro → แปล → เก็บ DB → return
```

### เงื่อนไข

1. **เมื่อ publish:** content ถูกเซตเป็น `""` (empty string) + `translation_status: "summary_only"`
2. **เมื่อ edit + content dirty:** content ถูก clear เป็น `""` (JIT จะแปลใหม่)
3. **เมื่อ JIT แปลเสร็จ:** `translation_status` อัปเดตเป็น `"complete"`, `is_full_translated` เป็น `true`

---

## 6. ฟังก์ชันใน translate-service.ts

| ฟังก์ชัน | Input | Output | ใช้ Gemini Model |
|----------|-------|--------|-----------------|
| `translateArticleContent()` | title, shortExcerpt, longExcerpt, content? | title, short_excerpt, long_excerpt, content | Flash (Tier 1) / Pro (Tier 2 JIT) |
| `translateStructuredData()` | glossary[], quick_facts{}, entity_values{} | glossary[], quick_facts{}, entity_values{} | Flash |
| `translateContentOnly()` | content string | { content } | Pro |
| `translateImageAlts()` | `Record<string, string>` (key=url, value=alt) | `Record<string, string>` | Flash |
| `translateTags()` | tags[], existingEnglishTags? | string[] (deduplicated) | Flash |

### การแปลแบบ Cultural Localization

**ไม่ใช่การแปลแบบ literal** — Gemini ใช้ **Structured Data Prompt** ที่บอกให้:

1. แปลคำทางวัฒนธรรมโดยใช้มาตรฐานสากล (Royal Institute of Thailand)
2. คำนึงถึงบริบททางประวัติศาสตร์
3. ไม่สร้างคำศัพท์ใหม่ (No Hallucinations)
4. รักษาความถูกต้องของข้อมูล

**ตัวอย่าง:** `"โขนไทย"` → `"Khon (Thai Masked Dance Drama)"` (ไม่ใช่ `"Thai Khon"`)

---

## 7. Social Caption Policy

**Social Caption ไม่ถูกแปล** ใช้เฉพาะภาษาไทยต้นฉบับเท่านั้น

ใน DB `translations` table → `social_caption` column จะถูกเซตเป็น `null` เสมอ

---

## 8. Tags/Keywords Translation

### กฎ

1. **Tag ที่เป็นภาษาอังกฤษ** → ใช้เลย ไม่ต้องแปล
2. **Tag ที่เป็นภาษาไทย** → ส่ง Gemini แปล → เทียบกับ tags อังกฤษ → **ตัดซ้ำ** (deduplicate)

### ตัวอย่าง

```typescript
// Input tags
["วัดพระแก้ว", "Bangkok", "ศิลปะ", "temple"]

// Step 1: English pass through → ["Bangkok", "temple"]
// Step 2: Thai → translate → ["Wat Phra Kaew", "Art"]
// Step 3: Merge + deduplicate → ["Bangkok", "temple", "Wat Phra Kaew", "Art"]
```

---

## 9. Image Alt Texts Translation

**แปล 100% ทุก locale** โดยไม่สน Tier — เพราะจำเป็นสำหรับ:
- Google Image Search (SEO)
- AI / Machine Learning indexing
- Accessibility (screen readers)

Prompt จะบอกให้ Gemini:
- คง key ของรูปภาพไว้ (URL/filename)
- เพิ่มคำอธิบายที่ keyword-rich
- เพิ่มบริบททางวัฒนธรรมถ้าต้นฉบับสั้นเกินไป

---

## 10. Title Tag จาก Database

### สถาปัตยกรรม

```
app/layout.tsx (Root)
  └── Metadata: title = SITE_NAME (จาก env var, fallback "Siam Heritage")
        └── (fallback เมื่อไม่มี locale-specific layout)

app/[lang]/layout.tsx (Locale-specific)
  └── generateMetadata() → getSettings() → settings.metaTitle
        └── Override ค่าจาก root layout อัตโนมัติ
```

### ลำดับการทำงาน

1. **Root layout** (`app/layout.tsx`) ใช้ `SITE_NAME` จาก `lib/constants.ts`
   - `NEXT_PUBLIC_SITE_NAME` env var → fallback `"Siam Heritage"`
2. **Locale layout** (`app/[lang]/layout.tsx`) ใช้ `generateMetadata` + `getSettings()`
   - ดึง `settings.metaTitle` จาก DB → ส่งเป็น metadata อัตโนมัติ
   - Override ค่าจาก root layout (Next.js metadata merge behavior)

### Admin Settings

Admin สามารถเปลี่ยน Title Tag ได้ที่ `/admin/settings` → ฟิลด์ `metaTitle`
ค่าจะถูกบันทึกลง `site_settings` table ใน Supabase

---

## 11. Admin Settings → Translation

### หน้า Admin ที่เกี่ยวข้อง

| หน้า | ฟังก์ชัน |
|------|----------|
| `/admin/settings` | เปลี่ยน Tier ของแต่ละภาษา (Locale Tiers) |
| `/admin/settings` | เปลี่ยน metaTitle, metaDescription (Title Tag) |
| `/admin/translations` | Trigger translate-all, ดูสถานะการแปล |
| `/admin/articles` | ปุ่ม "แปล" ต่อบทความ |

### การเปลี่ยน API Provider

ในอนาคตถ้าต้องการเปลี่ยนจาก Gemini เป็น API อื่น (OpenAI, Claude ฯลฯ):
1. สร้าง provider function ใหม่ใน `lib/translate-service.ts`
2. เพิ่ม dropdown ในหน้า `/admin/settings` → เลือก provider
3. Provider key เก็บใน env var หรือ DB

---

## 12. การ Fork ไปงานอื่น

### สิ่งที่ต้องปรับ

1. **Tier Configuration** — Admin สามารถปรับ Tier ของแต่ละภาษาได้จากหน้า `/admin/settings` โดยตรง
2. **จำนวนภาษา** — `lib/locales.ts` กำหนด `ALL_LOCALES` array สามารถเพิ่ม/ลดได้
3. **Default Tiers** — `lib/site-settings.ts` → `DEFAULT_SETTINGS.localeTiers`
4. **Model Selection** — `lib/translate-service.ts` → `GEMINI_FLASH_MODEL` / `GEMINI_PRO_MODEL`
5. **API Key** — `GEMINI_API_KEY` env var

### Key Files ที่ต้องแก้เมื่อ Fork

| ไฟล์ | ปรับอะไร |
|------|----------|
| `lib/locales.ts` | เพิ่ม/ลดภาษา, ชื่อภาษา |
| `lib/constants.ts` | SITE_NAME, SITE_URL, SITE_DESCRIPTION |
| `lib/translate-service.ts` | เปลี่ยน API key, model name, prompts |
| `.env.local` | GEMINI_API_KEY |

---
