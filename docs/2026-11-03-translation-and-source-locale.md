# ระบบแปลภาษา + ภาษาต้นฉบับรายบทความ

> อัปเดตล่าสุด: 2026-11-03 — เพิ่ม `HUMAN_STYLE` (คำแปลต้องอ่านเหมือนคนเขียน) · 2026-11-01 — เพิ่ม `source_locale` (เลือกภาษาต้นฉบับได้), เขียน prompt แปลใหม่ให้เป็นแนว fact-check
> แทนเอกสารเก่า: `translation-architecture.md`, `translation-strategy-blueprint.md`, `translation-v2-implementation.md`,
> `07-locale-tier-0-disabled.md`, `10-…translation-provider…`, `11-auto-translate-batch…`, `13-edit-article-locale-aware.md`,
> `16-manual-translate-only-no-jit.md` (อยู่ใน `archive/`)

## 1. ภาษาต้นฉบับ (`source_locale`)

| ที่เก็บ | ความหมาย |
|---|---|
| `articles.source_locale` | ภาษาของ `original_*` ของบทความนั้น (default `'th'`) |
| `site_settings.default_source_locale` | ค่าเริ่มต้นตอนกด "เขียนบทความใหม่" — ตั้งที่ **Admin → Settings → การ์ดภาษา** |
| ENV `NEXT_PUBLIC_DEFAULT_SOURCE_LOCALE` | fallback ถ้ายังไม่ได้ตั้งใน Settings |

- เลือกภาษาต้นฉบับได้ **ตอนสร้างบทความเท่านั้น** (dropdown ข้างช่อง slug) — หลังสร้างแล้วล็อก เพราะคำแปลอ้างอิงจากต้นฉบับ
- บทความที่มีอยู่แล้วทั้งหมดเป็น `th` → พฤติกรรมเดิมไม่เปลี่ยน
- โค้ดใช้ helper `sourceLocaleOf(row)` จาก `lib/locales.ts` — **ห้ามเขียน `locale === "th"` เพื่อเช็กว่าเป็นต้นฉบับอีก**
- Export/Import JSON พก `source_locale` ไปด้วย (ไฟล์เก่าที่ไม่มีฟิลด์นี้ = `th`)

### ⚠️ ก่อน deploy เวอร์ชันนี้

รัน `migrations/029_article_source_locale.sql` บน **Supabase ทั้ง 5 เว็บ** ก่อน — ถ้าไม่รัน หน้าที่ select คอลัมน์ `source_locale` จะ error

## 2. ภาษาและ tier

15 ภาษา (`lib/locales.ts`) ตั้ง tier ต่อเว็บใน Settings:
`1` = แสดงในแถบเปลี่ยนภาษา · `2` = ไม่แสดงใน header แต่เข้าถึงได้ · `0` = ปิด

## 3. การแปล (manual เท่านั้น)

- บันทึกต้นฉบับแล้ว **ไม่แปลอัตโนมัติ** — กด "แปลอัตโนมัติ" ทีละภาษาในหน้า edit หรือ batch จากรายการบทความ / Translation Dashboard
- API: `POST /api/translate-new` (บทความเดียว, เลือกฟิลด์ที่ dirty ได้), `POST /api/translate-all` (ทุกบทความต่อ 1 ภาษา — ข้ามบทความที่ต้นฉบับเป็นภาษานั้นอยู่แล้ว)
- สิ่งที่แปล: title, short/long excerpt, content, tags, image alt, quick facts, glossary, entity name, Google Schema (JSON-LD), SEO title/description
- AI ที่ใช้แปลจริง: **Gemini เท่านั้น** — key จาก Settings (`gemini_api_key`) หรือ ENV `GEMINI_API_KEY`
  - ⚠️ หน้า Settings มีช่องเลือก provider + key ของ Claude/OpenAI (`translation_api_provider`, `claude_api_key`, …) แต่ **โค้ดแปลยังไม่ได้ใช้ค่าเหล่านี้** — ตั้งไปก็ไม่มีผล
- **คำแปลล้าสมัย (stale):** ถ้าแก้ต้นฉบับหลังแปล (`content_updated_at` > `translated_at`) หน้า edit จะเตือนให้แปลใหม่

## 4. Prompt

อยู่ใน `lib/translate-service.ts` — ใช้ `SITE_CONTEXT` + `ACCURACY_RULES` ร่วมกันทุก prompt:
- รักษาข้อเท็จจริง ตัวเลข วันที่ คำพูดและที่มาให้ตรงทุกตัว ห้ามเติม/ตัด/ลด/เพิ่มน้ำหนักข้อกล่าวอ้าง
- น้ำเสียงข่าวเป็นกลาง
- ชื่อเฉพาะใช้การสะกดสากล (Preah Vihear, Ta Muen Thom ฯลฯ)
- คำตัดสิน (False / Misleading / True) แปลตรงตัวและสม่ำเสมอ
- ไม่แตะ markdown, ลิงก์, URL, shortcode
- `HUMAN_STYLE` (ใช้ใน prompt เนื้อหาหลัก): อ่านเหมือนนักข่าวเจ้าของภาษาเขียนเอง ไม่ใช้คำติดปากของ AI — หลักเดียวกับ `.claude/writing-style.md` ที่ `/draft-article`, `/clone-article` ใช้

แก้ prompt ที่เดียวแล้วมีผลทุกเว็บ (เพราะโค้ดชุดเดียวกัน)

## 5. หน้า edit (หลังบ้าน)

- ปุ่มแรกในแถบเลือกภาษา = **ภาษาต้นฉบับ** → บันทึกลง `articles`
- ภาษาอื่น → บันทึกลง `translations` (fallback ไปต้นฉบับถ้าฟิลด์ไหนยังไม่มีคำแปล)
