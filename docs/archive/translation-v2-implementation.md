# Translation System v2 — Implementation Summary

> อัปเดตล่าสุด: มิถุนายน 2025

## ภาพรวม

การปรับปรุงระบบการแปลครั้งใหญ่ (v2) จากเดิมที่มีเฉพาะ **Blueprint/Concept** หรือ implementation บางส่วน ให้สมบูรณ์พร้อมใช้งานจริง

---

## 1. สิ่งที่มีแค่ Blueprint มาก่อน → ตอนนี้ implement แล้ว

| หัวข้อ | ก่อนหน้า | ปัจจุบัน |
|--------|---------|----------|
| **Tier System** | มีแค่ Concept ใน `lib/locales.ts` (isDisabled, isTier2) แต่ **route ไม่ได้ใช้** | Route ทั้ง 3 (`translate-new`, `translate-all`, `translate-content`) ใช้ Dynamic Tier จาก DB |
| **Dirty Field Tracking** | ไม่มี — ไม่มีระบบตรวจจับว่าส่วนไหนถูกแก้ไข | `article-editor.tsx` มี `initialRef` + `getDirtyFields()` |
| **Auto-re-translate on Edit** | ไม่มี — ต้องกด "แปลภาษา" ด้วยตัวเอง | Auto-fire `translate-new` หลังจาก save สำเร็จ พร้อม dirtyFields |
| **Tags Translation** | ไม่มี — ไม่เคยมีฟังก์ชันหรือ prompt | `translateTags()` พร้อม English pass-through + Thai translate + deduplicate |
| **Image Alt Texts Translation** | ไม่มี — ไม่เคยมีฟังก์ชันหรือ prompt | `translateImageAlts()` แปล 100% ทุก locale สำหรับ SEO |
| **Social Caption Policy** | ไม่มี — ไม่ได้กำหนดชัดเจน | กำหนดชัดเจน: **ไม่แปล** ใช้เฉพาะภาษาไทย, DB = null |
| **API `/api/settings/tiers`** | ไม่มี | GET endpoint สำหรับ Frontend รู้ locale tiers แบบ real-time |
| **Translation Docs** | ไม่มี | `docs/translation-architecture.md` — ครบถ้วน |

## 2. สิ่งที่มี Implementation บางส่วน → ปรับปรุง

| หัวข้อ | ก่อนหน้า | ปัจจุบัน |
|--------|---------|----------|
| **`translate-new/route.ts`** | แปลทุกภาษาเหมือนกัน (hardcoded full content) — ไม่สน Tier | Dynamic Tier + Dirty Fields + Tags + ImageAlts |
| **`translate-all/route.ts`** | เหมือน `translate-new` — batch แต่ไม่สน Tier | Dynamic Tier + Tags + ImageAlts |
| **`translate-content/[slug]/route.ts`** | JIT translate + cache แต่ไม่ update status | + `fromTier2` signal + update `is_full_translated` |
| **`lib/gemini-service.ts`** | ชื่อเฉพาะ Gemini, ไม่มี Tags/ImageAlt functions | Rename → `lib/translate-service.ts` + 2 ฟังก์ชันใหม่ |
| **`app/layout.tsx`** | Title hardcode `"Vibe - Overconda Space"` | ใช้ `SITE_NAME` จาก env var + DB |
| **Translate Button** | ส่งแค่ `{ slug }` ไม่มี locale | ส่ง `{ slug, locale, dirtyFields }` สำหรับทุก active locale |

## 3. Architecture Decisions

### 3.1 Dynamic Tier (ไม่ hardcode)

```
Tier ของแต่ละภาษา ถูกอ่านจาก DB (site_settings.locale_tiers)
ไม่ใช่ hardcode ใน lib/locales.ts

lib/locales.ts
  ↓  เรียก getSettings() ทุกครั้งที่มีการเรียก
lib/site-settings.ts (fetch จาก DB + cache)
  ↓
isDisabled(locale), isTier2(locale) → ใช้ใน routes
```

### 3.2 Translation Flow หลัง Edit

```
User แก้ไขบทความ → กด Save
       │
       ▼
handleSave():
  1. onSave(data) → PUT /api/admin/articles/[slug]
  2. setSuccess(true)
  3. getDirtyFields() → เปรียบเทียบ current vs initial
  4. fetch /api/settings/tiers → รู้ active locales
  5. for each locale ≠ "th":
       fetch POST /api/translate-new { slug, locale, dirtyFields }
       │
       ▼
translate-new/route.ts:
  - isTier2(locale) → content dirty = clear DB (JIT จะแปลใหม่)
  - isTier1(locale) → แปลเฉพาะ dirty fields
  - Social caption → ข้าม (null)
  - Tags → translateTags()
  - Image alts → translateImageAlts()
```

### 3.3 JIT Flow (Tier 2)

```
User เปิดบทความภาษา Tier 2
       │
       ▼
GET /api/translate-content/[slug]?locale=fr
       │
       ▼
Check DB → content === "" ?
       │
       ├── Yes → Gemini Pro แปล → เก็บ DB → return
       │
       └── No  → return cached content
```

## 4. ฟังก์ชันใหม่ใน `lib/translate-service.ts`

| ฟังก์ชัน | บรรทัด | วัตถุประสงค์ |
|----------|--------|-------------|
| `translateImageAlts()` | ~415 | แปล alt text — keyword-rich สำหรับ Google Images |
| `translateTags()` | ~452 | แปล Thai tags, English pass-through, deduplicate |

## 5. Files Changed Summary

```
ไฟล์ที่ถูกแก้ไข (Modified):
  app/api/translate-new/route.ts            ← Core: Dynamic Tier + Dirty Fields
  app/api/translate-all/route.ts            ← Batch: Dynamic Tier
  app/api/translate-content/[slug]/route.ts ← JIT: signal + status update
  components/admin/article-editor.tsx        ← Dirty Tracking + Auto Translate
  app/layout.tsx                             ← SITE_NAME env var

ไฟล์ที่ถูกเปลี่ยนชื่อ (Renamed):
  lib/gemini-service.ts → lib/translate-service.ts

ไฟล์ใหม่ (Created):
  app/api/settings/tiers/route.ts            ← Expose locale tiers
  docs/translation-architecture.md            ← ระบบการแปล
  docs/translation-v2-implementation.md       ← เอกสารนี้
```

## 6. คำสั่ง Git Commits

```
9c6245f feat: translation system v2 — dynamic tiers, dirty field tracking, cultural localization
7a39135 fix: auto-translate outside try-catch causing build error
c27d67c fix: add missing React import for React.ReactNode type
79e6da1 chore: trigger fresh deploy (clear build cache)
```
