# ปรับปรุง Entity Facts, Categories, Translation API Provider

> **วันที่:** 2025-07-12  
> **เวอร์ชัน:** 1.0  
> **ขอบเขต:** Entity Facts Manager (บันทึกลง DB), หน้าจัดการหมวดหมู่ใหม่, ตั้งค่า Translation API Provider

---

## สารบัญ

1. [ภาพรวม](#1-ภาพรวม)
2. [Entity Facts Manager — ย้ายจาก In-Memory สู่ Database](#2-entity-facts-manager--ย้ายจาก-in-memory-สู่-database)
3. [Categories Admin Page — หน้าใหม่](#3-categories-admin-page--หน้าใหม่)
4. [Translation API Provider Settings](#4-translation-api-provider-settings)
5. [Article Editor — ลบฟิลด์ภาษาอังกฤษที่ไม่จำเป็น](#5-article-editor--ลบฟิลด์ภาษาอังกฤษที่ไม่จำเป็น)
6. [Sidebar Menu](#6-sidebar-menu)
7. [ไฟล์ Migration](#7-ไฟล์-migration)
8. [ข้อควรระวัง](#8-ข้อควรระวัง)

---

## 1. ภาพรวม

การเปลี่ยนแปลงครั้งนี้มีเป้าหมายหลักสามประการ:

1. **Entity Facts Manager** — ย้ายจากระบบ In-Memory Registry (ที่ข้อมูลหายเมื่อรีเฟรช) ไปบันทึกลง Supabase articles table โดยตรง
2. **Categories Manager** — สร้างหน้าจัดการหมวดหมู่ใหม่เพื่อให้สามารถ CRUD หมวดหมู่บทความได้ (ก่อนหน้านี้ไม่มีหน้า Admin สำหรับ Categories)
3. **Translation API Provider** — เพิ่มความสามารถในการเลือก API Provider สำหรับแปลภาษา (Gemini, Claude, OpenAI) และกรอก API Key ผ่านหน้า Settings

นอกจากนี้ยังมีการลบฟิลด์ภาษาอังกฤษที่ไม่จำเป็นออกจากฟอร์มแก้ไขบทความ (`entityNameEn`, `labelEn`, `termEn`, `definitionEn`) เพื่อลดความซับซ้อน — ฟิลด์เหล่านี้จะถูกเติมโดย AI ตอนแปลเท่านั้น

---

## 2. Entity Facts Manager — ย้ายจาก In-Memory สู่ Database

### ก่อนการเปลี่ยนแปลง

Entity Facts Manager (`/admin/entity-facts`) ใช้ระบบ In-Memory Registry (`lib/wiki-data.ts`):
- `registerEntityFacts()`, `removeRegisteredEntityFacts()`, `entityFactsRegistry`
- ข้อมูลจะหายทุกครั้งที่รีโหลดหน้า หรือเมื่อเซิร์ฟเวอร์รีสตาร์ท
- อาศัย `getAllArticleMasters()` ซึ่งเป็นอาร์เรย์ในหน่วยความจำ

### หลังการเปลี่ยนแปลง

- **อ่านข้อมูล:** ใช้ `fetch("/api/admin/articles")` — ดึงจาก Supabase
- **บันทึกข้อมูล:** ใช้ `PUT /api/admin/articles/[slug]` — เขียน entityName, entityType, wikidataId, quickFacts ลง articles table
- **ลบข้อมูล:** ส่งค่า `null` ไปยัง API เพื่อล้างฟิลด์ entity facts

### ไฟล์ที่แก้ไข

| ไฟล์ | รายละเอียด |
|------|-----------|
| `app/admin/entity-facts/page.tsx` | เขียนใหม่ทั้งหมด — ลบการอ้างอิง In-Memory Registry |
| `app/api/admin/articles/[slug]/route.ts` | ลบ `entityNameEn` ออกจาก PUT handler |

### โครงสร้างข้อมูลที่บันทึกลง DB

```typescript
// ส่งไปยัง PUT /api/admin/articles/[slug]
{
  entityName: "โขนไทย",
  entityType: "tradition",
  wikidataId: "Q123456",
  quickFacts: [
    { label: "รากเหง้าวัฒนธรรม", value: "ชักนาคดึกดำบรรพ์, กระบี่กระบอง" },
    { label: "ปีที่ขึ้นทะเบียน UNESCO", value: "พ.ศ. 2561" }
  ]
}

// ลบ: ส่ง null
{
  entityName: null,
  entityType: null,
  wikidataId: null,
  quickFacts: null
}
```

---

## 3. Categories Admin Page — หน้าใหม่

### ภาพรวม

สร้างหน้าจัดการหมวดหมู่แบบ CRUD เต็มรูปแบบที่ `/admin/categories` พร้อม API endpoints

### ไฟล์ใหม่

| ไฟล์ | รายละเอียด |
|------|-----------|
| `app/admin/categories/page.tsx` | UI หน้า Admin |
| `app/api/admin/categories/route.ts` | GET (รายการ), POST (สร้าง) |
| `app/api/admin/categories/[id]/route.ts` | PUT (แก้ไข), DELETE (ลบ) |
| `migrations/014_categories_ordering.sql` | เพิ่ม `sort_order` + seed หมวดหมู่เริ่มต้น |

### ความสามารถ

- **แสดงรายการ:** หมวดหมู่ทั้งหมด พร้อมจำนวนบทความในแต่ละหมวด
- **เพิ่ม:** slug, ชื่อไทย, ชื่ออังกฤษ, คำอธิบายไทย/อังกฤษ, รูปภาพ, ลำดับ
- **แก้ไข:** ฟิลด์ทั้งหมดข้างต้น
- **ลบ:** ตรวจสอบก่อนว่ามีบทความในหมวดหรือไม่ (ป้องกันการลบถ้ายังมี)
- **แปล:** ปุ่มแปลชื่อหมวด + คำอธิบายเป็น 14 ภาษา (เรียก `/api/translate-all`)
- **ค้นหา:** ค้นหาตามชื่อไทย/อังกฤษ/slug
- **Auto-slug:** สร้าง slug อัตโนมัติจากชื่อไทย

### Seed หมวดหมู่เริ่มต้น (7 หมวด)

| ลำดับ | ชื่อไทย | ชื่ออังกฤษ |
|-------|---------|-----------|
| 1 | มรดกไทย | Thai Heritage |
| 2 | ประเพณีไทย | Thai Traditions |
| 3 | ภูมิปัญญาไทย | Thai Wisdom |
| 4 | อาหารไทย | Thai Cuisine |
| 5 | ภาษาไทย | Thai Language |
| 6 | ศิลปหัตถกรรม | Arts & Crafts |
| 7 | ท่องเที่ยว | Travel |

### โครงสร้าง API

**GET /api/admin/categories**
```json
{
  "categories": [{
    "id": "uuid",
    "slug": "heritage",
    "nameTH": "มรดกไทย",
    "nameEN": "Thai Heritage",
    "descriptionTH": "...",
    "descriptionEN": "...",
    "imageUrl": "...",
    "sortOrder": 1,
    "articleCount": 5
  }]
}
```

**POST /api/admin/categories**
```json
{ "slug": "new-category", "nameTH": "ชื่อไทย", "nameEN": "Name EN" }
```

**PUT /api/admin/categories/[id]**
```json
{ "nameTH": "ชื่อใหม่", "sortOrder": 3 }
```

**DELETE /api/admin/categories/[id]**
- ถ้ามีบทความ → `409 Conflict`
- ถ้าไม่มี → `200 OK`

---

## 4. Translation API Provider Settings

### ภาพรวม

เพิ่มความสามารถในการเลือก API Provider สำหรับระบบแปลภาษา และกรอก API Key ผ่านหน้า Settings

### ไฟล์ที่แก้ไข

| ไฟล์ | รายละเอียด |
|------|-----------|
| `lib/site-settings.ts` | เพิ่มฟิลด์ `translationApiProvider`, `claudeApiKey`, `openaiApiKey`, `geminiApiKey` |
| `app/admin/settings/page.tsx` | เพิ่ม UI Section "API Provider สำหรับแปลภาษา" |
| `migrations/015_translation_api_provider.sql` | เพิ่มคอลัมน์ใน `site_settings` |

### ฟิลด์ใหม่ใน SiteSettings

```typescript
interface SiteSettings {
  // ... ฟิลด์เดิม ...
  
  /** Translation API provider: "gemini" | "claude" | "openai" */
  translationApiProvider: string;
  
  /** API keys for translation providers */
  claudeApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
}
```

### UI ใน Settings Page

- **Provider Selector:** Dropdown ให้เลือก Gemini (ปัจจุบัน) / Claude (แนะนำ) / OpenAI (สำรอง)
- **API Key Inputs:** 3 ช่องรหัสผ่านสำหรับ Claude, OpenAI, Gemini
- แสดงสถานะ ✓ เมื่อมีค่า, — เมื่อไม่มีค่า
- API Key แต่ละตัวสามารถบันทึกลง DB หรือใช้ Environment Variable (`.env.local`) แทน

### Environment Variables Fallback

```bash
# .env.local
DEFAULT_TRANSLATION_PROVIDER=gemini
AUTH_CLAUDE_API_KEY=sk-ant-xxxxxxxxxx
AUTH_OPENAI_API_KEY=sk-xxxxxxxxxx
AUTH_GEMINI_API_KEY=AIzaSyxxxxxxxxxx
```

---

## 5. Article Editor — ลบฟิลด์ภาษาอังกฤษที่ไม่จำเป็น

### ฟิลด์ที่ถูกลบ

| ฟิลด์ | ตำแหน่งเดิม | เหตุผล |
|-------|------------|--------|
| `entityNameEn` | Entity Name (EN) input | AI จะเติมตอนแปล |
| `labelEn` | Quick Facts -> Label (EN) input | AI จะเติมตอนแปล |
| `termEn` | Glossary -> Term (EN) input | AI จะเติมตอนแปล |
| `definitionEn` | Glossary -> Definition (EN) input | AI จะเติมตอนแปล |

### ไฟล์ที่แก้ไข

| ไฟล์ | รายละเอียด |
|------|-----------|
| `components/admin/article-editor.tsx` | ลบ state, form fields, UI elements |
| `app/api/admin/articles/[slug]/route.ts` | ลบ `entityNameEn` จาก PUT handler |

### ผลกระทบ

- **ArticleFormData.quickFacts** เปลี่ยนจาก `{ label, labelEn, value }` → `{ label, value }`
- **ArticleFormData.glossary** เปลี่ยนจาก `{ term, termEn, definition, definitionEn }` → `{ term, definition }`
- **ArticleMaster type** ใน `lib/types.ts` ยังคงมี `labelEn?`, `termEn?`, `definitionEn?` เป็น **optional** — เพื่อคง backward compatibility กับข้อมูลเก่าใน DB
- **Wiki Metadata Builder** (`lib/wiki-data.ts`) ยังคงเติมค่า `labelEn` จากข้อมูลที่ translate แล้ว

---

## 6. Sidebar Menu

| ไฟล์ | รายละเอียด |
|------|-----------|
| `components/admin/admin-sidebar.tsx` | เพิ่มเมนู "หมวดหมู่" ระหว่าง "การแปลภาษา" กับ "Entity Facts" |

**รายการเมนูที่เพิ่ม:**
```typescript
{
  label: "หมวดหมู่",
  href: "/admin/categories",
  icon: BookMarked,
  permission: "article:edit_any" as const,
  roles: ["editor", "admin"] as UserRole[],
}
```

เปลี่ยน icon ของ Entity Facts จาก `BookMarked` → `Layers`

---

## 7. ไฟล์ Migration

### `migrations/014_categories_ordering.sql`

```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Seed default categories (7 categories)
INSERT INTO categories (slug, name_th, name_en, ...)
SELECT * FROM (VALUES
  ('heritage', 'มรดกไทย', 'Thai Heritage', ...),
  ...
) AS v(...)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
ON CONFLICT (slug) DO NOTHING;
```

### `migrations/015_translation_api_provider.sql`

```sql
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS translation_api_provider TEXT DEFAULT 'gemini';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS claude_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT '';
```

---

## 8. ข้อควรระวัง

### Entity Facts Manager
- ✅ ตอนนี้ Entity Facts ถูกบันทึกลง Supabase articles table โดยตรง
- ⚠️ Entity Facts Manager **ไม่แก้ไข** `image_url` หรือ `author_name` — แก้ได้จากหน้าแก้ไขบทความ
- ⚠️ หลังบันทึก Entity Facts แล้วต้องรอให้หน้าโหลดข้อมูลใหม่ (มีการ refresh รายการอัตโนมัติ)

### Categories
- ⚠️ **ไม่สามารถลบหมวดหมู่ที่มีบทความอยู่ได้** — ต้องย้ายบทความไปหมวดหมู่อื่นก่อน
- ⚠️ การแปลหมวดหมู่ครั้งแรกอาจใช้เวลานานเพราะต้องแปล 14 ภาษา
- ⚠️ หมวดหมู่ปัจจุบัน (heritage, tradition, wisdom, food, language, crafts, travel) จะถูก seed เมื่อไม่มีหมวดหมู่ใน DB

### Translation API Provider
- ⚠️ API Keys ที่กรอกใน Settings จะถูกบันทึกลงใน `site_settings` table
- ⚠️ Environment Variable จะถูกใช้แทนค่าจาก DB ถ้ามี (ตาม logic fallback ใน `dbRowToSettings`)
- ⚠️ ระบบแปลภาษาปัจจุบันใช้ Gemini เป็นค่าเริ่มต้น
- ⚠️ การเปลี่ยน Provider จะมีผลกับการแปลครั้งถัดไปเท่านั้น (คำแปลเก่าไม่หาย)

### Backward Compatibility
- ข้อมูล `entityNameEn`, `labelEn`, `termEn`, `definitionEn` ที่มีอยู่ใน DB อยู่แล้ว **จะไม่หายไป**
- ฟิลด์เหล่านี้ยังคงเป็น optional ใน `lib/types.ts` และ `lib/wiki-types.ts`
- ระบบ Wiki Metadata (`lib/wiki-data.ts`) ยังคงอ่านค่าภาษาอังกฤษจาก DB ได้ตามปกติ
