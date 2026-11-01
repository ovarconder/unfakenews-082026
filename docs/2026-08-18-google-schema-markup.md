# Google Schema Markup (Structured Data) — ระบบจัดการ JSON-LD SEO

## 📋 จุดประสงค์

ระบบนี้ถูกพัฒนาเพื่อให้ **ผู้ดูแลเว็บไซต์สามารถกำหนด Structured Data (Schema.org JSON-LD) ที่กำหนดเองได้** สำหรับแต่ละบทความ โดยข้อมูลนี้จะถูกพ่นลงในหน้าแสดงผลบทความในรูปแบบ `<script type="application/ld+json">` เพื่อให้ Google Bot และ Search Engine อื่นๆ สามารถเก็บข้อมูล SEO ได้อย่างถูกต้อง

### ปัญหาที่แก้ไข

1. **ความยืดหยุ่นของ Schema —** แต่ละบทความอาจต้องการ Schema.org type ที่แตกต่างกัน (Article, NewsArticle, Recipe, Event, Product, ฯลฯ) ซึ่งระบบ Schema หลักของเว็บฯ อาจไม่ครอบคลุม
2. **SEO ที่แม่นยำขึ้น —** Admin สามารถกำหนด schema fields เพิ่มเติมที่ Google ใช้ในการแสดง Rich Results เช่น `speakable`, `video`, `faq`, `howTo`
3. **ควบคุมข้อมูลที่ Google Bot อ่าน —** สามารถ override หรือเพิ่ม property ที่ระบบ auto-generate ไม่ครอบคลุม

---

## 🧠 หลักการทำงาน

### ภาพรวม Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Admin Editor   │ ──→ │  Supabase DB      │ ──→ │  Frontend Article    │
│  (กรอก JSON-LD) │     │  (jsonb column)   │     │  Detail Page         │
└─────────────────┘     └──────────────────┘     └──────────────────────┘
                                                           │
                                                           ▼
                                                  <script type="application/ld+json">
                                                  { ... custom schema ... }
                                                  </script>
```

### ขั้นตอนการทำงาน

1. **Admin** กรอก JSON-LD Schema ในหน้าแก้ไขบทความ (Textarea พร้อม Validation)
2. **Validation ก่อนบันทึก —** ระบบเช็คว่า JSON valid และเป็น Object (ไม่ใช่ Array/String)
3. **บันทึกไปยัง Supabase —** เก็บในคอลัมน์ `google_schema_markup` (JSONB type)
4. **ดึงข้อมูลตอนแสดงผล —** `getFullArticle()` ใน `lib/article-service-supabase.ts` ดึง `google_schema_markup` พร้อมกับข้อมูลบทความ
5. **Render JSON-LD —** `ArticleDetail` component สร้าง `<script type="application/ld+json">` โดย:
   - ถ้า `@context` มีอยู่ใน custom schema แล้ว → ใช้ตรงๆ
   - ถ้าไม่มี → ใส่ `"@context": "https://schema.org"` ให้อัตโนมัติ
6. **Merge กับ Schema หลัก —** ระบบจะ render schema block แยก (`SchemaArticle` + Custom Schema) ซึ่ง Google จะอ่านทั้งคู่

---

## 🗄️ โครงสร้างฐานข้อมูล (Supabase)

### คอลัมน์ที่เพิ่มในตาราง `articles`

| คอลัมน์ | Type | คำอธิบาย |
|---------|------|----------|
| `google_schema_markup` | `JSONB` | เก็บ JSON-LD object ที่ Admin กรอก (nullable) |

**SQL Migration:**
```sql
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS google_schema_markup JSONB DEFAULT NULL;
```

### ข้อดีของ JSONB
- สามารถ query ด้วย operator ของ PostgreSQL (`->`, `->>`, `@>`, `?` ฯลฯ)
- รองรับ Index (GIN index) สำหรับการค้นหาใน JSON keys
- เก็บเป็น native binary → ประหยัดพื้นที่กว่า string/text
- ไม่ต้อง serialize/deserialize ใน application layer

---

## 🖥️ หลังบ้าน (Admin Editor)

### UI Components

#### 1. `components/admin/article-editor.tsx`
- **State:** `googleSchemaMarkup` (string) — เก็บข้อความ JSON ที่กรอกใน Textarea
- **Validation State:** `googleSchemaError` (string|null)
- **UI Section:** collapsible `<details>` element ที่อยู่ก่อนปุ่ม "บันทึก"
- **Validation function** ใน `handleSave()` ก่อนเรียก `onSave()`

#### 2. `components/admin/article-editor-jsx.tsx`
- Variant ของ UI editor ที่แยก JSX ไว้ (ใช้ในกรณี SWC parser issue)

### Validation Logic

```typescript
// ก่อนบันทึก — ใน handleSave():
let parsedSchema: Record<string, unknown> | null = null;
if (googleSchemaMarkup.trim()) {
  try {
    parsedSchema = JSON.parse(googleSchemaMarkup.trim());
    if (typeof parsedSchema !== "object" || parsedSchema === null || Array.isArray(parsedSchema)) {
      setError("❌ Google Schema Markup ต้องเป็น JSON Object {...} เท่านั้น");
      return;
    }
  } catch {
    setError("❌ Google Schema Markup เป็น JSON ที่ไม่ถูกต้อง");
    return;
  }
}

// ส่ง parsedSchema (JSON object) ไปยัง API
await onSave({ ...googleSchemaMarkup: parsedSchema });
```

### Validation Points
1. **OnBlur —** เช็ค syntax JSON (แสดง error สีแดงใน UI ทันที)
2. **Pre-save —** เช็คทั้ง syntax และ ensure เป็น Object (ไม่ใช่ Array หรือ string)
3. **ไม่บล็อกการบันทึกถ้าเว้นว่าง —** คอลัมน์เป็น optional (nullable)

### UI Features
- **ปุ่ม "📋 ใช้ Template"** — สร้าง Article schema พร้อมข้อมูลจากฟอร์ม (headline, description, publishedAt, author)
- **ปุ่ม "✨ จัดรูปแบบ JSON"** — Format JSON ด้วย `JSON.stringify(parsed, null, 2)`
- **Size indicator** — แสดงขนาดของ JSON ที่กรอก (bytes)
- **External links** — ลิงก์ไป Schema.org docs และ Google Rich Results Test
- **Status badge** — แสดง "✓ มีข้อมูล" เมื่อมีการกรอกค่า

---

## 🌐 หน้าบ้าน (Frontend)

### การ Render Schema

```tsx
// components/articles/article-detail.tsx

const customSchemaLD = article.googleSchemaMarkup;

return (
  <>
    {/* Schema หลักของระบบ — Article, ImageObject, Entity Facts */}
    <SchemaArticle
      article={masterLike}
      imageUrl={article.imageUrl}
      wikiMetadata={wikiData.metadata}
    />

    {/* Custom Schema จาก DB — merge/override เพิ่มเติม */}
    {customSchemaLD && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            customSchemaLD["@context"]
              ? customSchemaLD  // ถ้ามี @context อยู่แล้ว
              : { "@context": "https://schema.org", ...customSchemaLD },
            null,
            2
          ),
        }}
      />
    )}
  </>
);
```

### การทำงาน
1. **Server Component** (`app/[lang]/articles/[slug]/page.tsx`) fetch ข้อมูลรวมถึง `googleSchemaMarkup`
2. **Client Component** (`ArticleDetail`) render `<script type="application/ld+json">`
3. **JSON-LD** ถูก rendered ใน `<body>` (แต่ Google Bot อ่าน JSON-LD ได้ทั้ง head และ body)
4. **Auto-context** — ถ้า `@context` ไม่มีใน custom schema ระบบเติม `"@context": "https://schema.org"` ให้

---

## 🔄 API Routes

### `POST /api/admin/articles`
- เพิ่มการรับ `googleSchemaMarkup` field
- Save ไปยัง `google_schema_markup` column

### `PUT /api/admin/articles/[slug]`
- รับ `googleSchemaMarkup` ใน body
- Update ค่าใน Supabase

### `GET /api/admin/articles/[slug]`
- Return `googleSchemaMarkup` ใน response

---

## 📝 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: Article Schema ปกติ (Override headline)

```json
{
  "@type": "Article",
  "headline": "ตำนานสมเด็จพระนเรศวรมหาราช — ฉบับปรับปรุง 2568",
  "description": "เรื่องราวของสมเด็จพระนเรศวรมหาราชที่รวบรวมจากหลักฐานทางประวัติศาสตร์ล่าสุด",
  "dateModified": "2025-02-15",
  "author": {
    "@type": "Person",
    "name": "นักประวัติศาสตร์  UnFake News"
  },
  "image": "https://cdn.siamheritage.org/images/naresuan-hero.webp"
}
```

### ตัวอย่างที่ 2: NewsArticle (Rich Result ข่าว)

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "เปิดตัวโบราณสถานแห่งใหม่ที่อยุธยา",
  "datePublished": "2025-03-01T08:00:00+07:00",
  "dateModified": "2025-03-01T14:30:00+07:00",
  "dateline": "พระนครศรีอยุธยา, ประเทศไทย",
  "image": ["https://cdn.siamheritage.org/images/ayutthaya-1.jpg"]
}
```

### ตัวอย่างที่ 3: FAQ Schema (Rich Result คำถาม)

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "ต้มยำกุ้งมีที่มาอย่างไร?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ต้มยำกุ้งเป็นอาหารไทยที่มีมาตั้งแต่สมัยกรุงศรีอยุธยา..."
      }
    },
    {
      "@type": "Question",
      "name": "ต้มยำกุ้งกับต้มข่าต่างกันอย่างไร?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ความแตกต่างหลักคือเครื่องเทศที่ใช้..."
      }
    }
  ]
}
```

### ตัวอย่างที่ 4: Event Schema

```json
{
  "@type": "Event",
  "name": "เทศกาลสงกรานต์เชียงใหม่ 2568",
  "startDate": "2025-04-13",
  "endDate": "2025-04-15",
  "location": {
    "@type": "Place",
    "name": "ถนนข้าวเรียบ เมืองเชียงใหม่",
    "address": "จังหวัดเชียงใหม่ ประเทศไทย"
  },
  "image": "https://cdn.siamheritage.org/images/songkran-cm.jpg",
  "description": "งานสงกรานต์ที่ใหญ่ที่สุดในภาคเหนือ"
}
```

---

## 🧪 วิธีทดสอบ

1. **รัน SQL Migration** ใน Supabase SQL Editor:
   ```sql
   ALTER TABLE articles ADD COLUMN IF NOT EXISTS google_schema_markup JSONB DEFAULT NULL;
   ```

2. **เข้าสู่ระบบ Admin → แก้ไขบทความ**
   - เลื่อนลงไปเจอ section "Google Schema Markup (JSON-LD Structured Data)"
   - กด "📋 ใช้ Template" เพื่อทดสอบ
   - หรือกรอก JSON-LD เองแล้วกด "✨ จัดรูปแบบ JSON"

3. **กดบันทึก** → ตรวจสอบว่าไม่มี error

4. **ไปหน้าแสดงบทความ**
   - เปิด View Page Source (Ctrl+U หรือ Cmd+Option+U)
   - ค้นหา `application/ld+json` — ควรเจอ schema block ที่กรอก

5. **ทดสอบกับ Google Rich Results Test**
   - ไปที่ https://search.google.com/test/rich-results
   - ใส่ URL ของบทความ หรือ paste source code

---

## 📌 ข้อควรระวัง

1. **JSON-LD ที่กรอกต้อง valid เสมอ —** ระบบมี validation ก่อนบันทึก แต่ควรตรวจสอบอีกครั้ง
2. **ไม่ควรใช้ `@context` ซ้ำซ้อน —** ระบบ auto-fill ให้ แต่สามารถ override ได้
3. **Type ที่แนะนำสำหรับบทความทั่วไป —** `Article`, `NewsArticle`, `BlogPosting`
4. **หลีกเลี่ยง Schema type ที่ซับซ้อนเกินไป —** เช่น `MedicalWebPage` อาจถูกตีค่าว่าเป็น medical site
5. **JSON-LD ใน body เป็น Normal—** Google Bot อ่าน JSON-LD ได้ทั้งใน `<head>` และ `<body>`
6. **มี Schema หลักของระบบอยู่แล้ว —** Custom Schema นี้เป็น **ส่วนเพิ่มเติม** ไม่ได้ลบ Schema หลักของระบบ (Article, ImageObject, Entity Facts)

---

## 🔗 ทรัพยากรเพิ่มเติม

- [Schema.org Full Hierarchy](https://schema.org/docs/schemas.html)
- [Google Search Central — Structured Data](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
