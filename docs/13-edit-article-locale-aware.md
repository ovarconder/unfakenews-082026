# Edit Article — Locale-Aware Editor

> อัปเดตล่าสุด: มิถุนายน 2025

## 🎯 จุดประสงค์

หน้าแก้ไขบทความ (`/admin/articles/edit/[slug]`) รองรับการแก้ไขเนื้อหาบทความ **ตาม locale ที่เลือก** โดย:

- **เลือกภาษาไทย (TH)** → แก้ต้นฉบับภาษาไทย → บันทึกที่ `articles` table
- **เลือกภาษาอังกฤษ (EN)** → แก้คำแปลอังกฤษ → บันทึกที่ `translations` table
- **เลือกภาษาอื่น (JA, ZH, ...)** → แก้คำแปล → บันทึกที่ `translations` table
- **ไม่กระทบกัน** — การแก้ไขภาษาแปลจะไม่ไปรบกวนต้นฉบับภาษาไทย

---

## 🔄 Fallback Chain

| ภาษาที่เลือก | Fallback ลำดับ 1 | Fallback ลำดับ 2 |
|-------------|:---------------:|:---------------:|
| 🇹🇭 ไทย | — (เป็นต้นฉบับ) | — |
| 🇬🇧 EN | ภาษาไทย (original) | — |
| 🇯🇵 JA | 🇬🇧 อังกฤษ | ภาษาไทย |
| 🇨🇳 ZH | 🇬🇧 อังกฤษ | ภาษาไทย |
| อื่นๆ | 🇬🇧 อังกฤษ | ภาษาไทย |

> **การทำงาน:** ถ้าฟิลด์ใดไม่มีค่าในภาษา JA → ไปดู EN → ถ้า EN ก็ไม่มี → ใช้ของภาษาไทย

### ฟังก์ชัน `findBestTranslation()`

```typescript
function findBestTranslation(
  translations: TranslationRow[],
  locale: string
): TranslationRow | undefined {
  // 1. locale ที่เลือก
  const direct = translations.find((t) => t.locale === locale);
  if (direct) return direct;

  // 2. fallback ภาษาอังกฤษ (ทุกภาษาที่ไม่ใช่ EN)
  if (locale !== "en") {
    const en = translations.find((t) => t.locale === "en");
    if (en) return en;
  }

  // 3. ไม่มี fallback → ใช้ original (ภาษาไทย)
  return undefined;
}
```

---

## 🤖 Auto-Translate English on Save

เมื่อบันทึกต้นฉบับภาษาไทย (TH) ระบบจะ **เรียก Gemini แปลภาษาอังกฤษให้อัตโนมัติ** ทันที โดยไม่ต้องกดเอง

```
กด "บันทึก" (ภาษาไทย)
       │
       ├── PUT /api/admin/articles/[slug]  (save ต้นฉบับ)
       │
       └── POST /api/translate-new { locale: "en" }  (auto-translate)
              │
              └── upsert translations table (locale = "en")
```

### การแสดงผลขณะ translate
ขณะที่กำลังแปล จะมีข้อความแสดงด้านล่างของปุ่มบันทึก:
```
📝 ฟิลด์ทั้งหมดของบทความ (ต้นฉบับภาษาไทย — บันทึกที่ articles table)
🔄 กำลังแปลภาษาอังกฤษอัตโนมัติ...
```

ถ้า auto-translate ล้มเหลว **จะไม่กระทบการบันทึกต้นฉบับ** — แค่ console warning

---

## 🌍 แปลทีละภาษา (Per-Locale Translate)

แต่ละภาษาใน Locale Selector มีปุ่ม **"แปลอัตโนมัติ"** ข้างๆ (เฉพาะภาษาที่เลือกอยู่)

```
[🇯🇵 日本語 JA] [🌐 แปลอัตโนมัติ]
```

เมื่อกด:
1. เรียก `POST /api/translate-new { slug, locale }`
2. Gemini แปลจากภาษาไทย → ภาษาที่เลือก (title, excerpt, content, tags, entity, glossary, quickFacts, imageAlts)
3. บันทึกที่ `translations` table

### เงื่อนไข
- **Tier 1** (EN, ZH, JA, ES, PT) → แปลทุกอย่างรวม content
- **Tier 2** (FR, KO, DE, ...) → แปลเฉพาะ SEO fields + summary ส่วน content เป็น JIT (Just-in-Time)

---

## 🧠 หลักการทำงาน

### Locale Selector (ด้านบนของหน้า)

```
┌──────────────────────────────────────────────────────────────┐
│  เลือกภาษา  [🇹🇭 TH]  [✓ EN]  [— JA 🌐 แปลอัตโนมัติ]  [○ ZH] │
│  🟢 กำลังแก้ไข日本語 — Fallback: JA → EN → ไทย              │
└──────────────────────────────────────────────────────────────┘
```

- **TH** = ต้นฉบับภาษาไทย (แก้ articles table)
- สถานะ: ✓ = complete, ○ = summary_only, — = pending
- ปุ่ม **🌐 แปลอัตโนมัติ** แสดงเฉพาะภาษาที่กำลังเลือกอยู่

### Data Flow

```
เลือก locale "ja"
       │
       ▼
findBestTranslation(translations, "ja")
       │
       ├── found "ja" → ใช้ของ JA
       ├── not found → fallback EN
       └── EN not found → fallback ภาษาไทย (original)
              │
              ▼
buildLocaleArticle(article, translations, "ja")
       │
       ▼
ArticleEditor (key={selectedLocale})
       │
       └── onSave()
              │
              ├── locale === "th" → PUT /api/admin/articles/[slug]
              │                       └── POST /api/translate-new (EN auto)
              │
                    └── locale !== "th" → PUT /api/admin/translations
```

---

## 📁 ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|--------|
| `app/admin/articles/edit/[slug]/page.tsx` | Server Component — fetch article + translations |
| `app/admin/articles/edit/[slug]/edit-client.tsx` | Client Component — locale selector + editor wrapper |
| `components/admin/article-editor.tsx` | Editor component |
| `app/api/translate-new/route.ts` | POST — แปลบทความเดียว (เรียกจาก auto-translate + per-locale) |
| `app/api/admin/translations/route.ts` | PUT — บันทึกคำแปลด้วยตนเอง |
| `app/api/admin/articles/[slug]/route.ts` | PUT — บันทึกต้นฉบับไทย |

---

## 💾 การบันทึก

### กรณีเลือกภาษาไทย (TH) → articles table + auto-translate EN

```typescript
// 1. Save ต้นฉบับ
PUT /api/admin/articles/[slug]
Body: { originalTitle, originalExcerpt, ... }

// 2. Auto-translate EN (background, ไม่ block UI)
POST /api/translate-new { slug, locale: "en" }
```

### กรณีเลือกภาษาอื่น (EN, JA, ...) → translations table

```typescript
PUT /api/admin/translations
Body: {
  article_id: "<uuid>",
  locale: "ja",
  title: "日本語のタイトル",
  content: "...",
  short_excerpt: "...",
  long_excerpt: "...",
  tags: [...],
  entity_name: "...",
  quick_facts: { ... },
  glossary: { ... },
  google_schema_markup: { ... },
  translation_status: "complete"
}
```

### ฟิลด์ที่รองรับ

| ฟิลด์ | TH | EN | อื่นๆ |
|-------|:--:|:--:|:----:|
| ✅ originalTitle | articles | translations | translations |
| ✅ originalExcerpt | articles | translations | translations |
| ✅ originalContent | articles | translations | translations |
| ✅ tags | articles | translations | translations |
| ✅ entityName | articles | translations | translations |
| ✅ quickFacts | articles | translations | translations |
| ✅ glossary | articles | translations | translations |
| ✅ googleSchemaMarkup | articles | translations | translations |
| ✅ shortExcerpt | articles | translations | translations |
| ✅ longExcerpt | articles | translations | translations |
| ❌ slug | ห้ามแก้ | ห้ามแก้ | ห้ามแก้ |

---

## ⚠️ ข้อควรระวัง

### 1. Slug ห้ามแก้
Slug ใช้เป็น URL path ร่วมกันทุกภาษา
- `/th/articles/wat-phra-kaew`
- `/en/articles/wat-phra-kaew`
- `/ja/articles/wat-phra-kaew`

**โค้ดบังคับ slug เดิมทุก locale:**
```typescript
slug: original.slug,  // ★ ไม่เอาค่าจาก translations
```

### 2. key={selectedLocale}
```tsx
<ArticleEditor key={selectedLocale} ... />
```
เมื่อเปลี่ยน locale component จะ **re-mount** ใหม่ เพื่อให้ `initialData` ถูกต้อง

### 3. Auto-Translate EN ไม่ block การ save
ถ้า auto-translate EN ล้มเหลว (API error, timeout) การบันทึกต้นฉบับจะสำเร็จอยู่ดี

### 4. Per-Locale Translate — manual
กดปุ่ม "แปลอัตโนมัติ" ข้างภาษาเพื่อ trigger Gemini  
ระบบจะแสดง success/error message ชัดเจน

### 5. Manual Translation Manager
ส่วน Manual Translation Manager (แปล title, excerpt, content ด้วยตนเอง) จะแสดงเฉพาะเมื่อเลือก locale ที่ไม่ใช่ไทยเท่านั้น

---

## 🔗 ทรัพยากรเพิ่มเติม

- [Translation Architecture](./translation-architecture.md) — ระบบการแปลทั้งหมด
- [Google Schema Markup](./12-google-schema-markup-structured-data.md) — JSON-LD Schema
