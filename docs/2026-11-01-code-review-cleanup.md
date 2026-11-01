# ตรวจโครงสร้างโค้ด + ภาษาต้นฉบับ + จัด docs (บันทึกงาน)

> อัปเดตล่าสุด: 2026-11-01 — branch `feat/source-locale-cleanup`

## สิ่งที่ทำ

### 1. ภาษาต้นฉบับรายบทความ
- เพิ่ม `migrations/029_article_source_locale.sql` → `articles.source_locale`, `site_settings.default_source_locale` (default `'th'`) และอัปเดต `000_schema_all_in_one.sql` / `schema_all_in_one_no_seed.sql`
- `lib/locales.ts`: เพิ่ม `DEFAULT_SOURCE_LOCALE`, `normalizeSourceLocale()`, `sourceLocaleOf()`
- เลิกเขียน `locale === "th"` เพื่อเช็กต้นฉบับ ใน: article service (public), admin articles API (สร้าง/แก้/export/import), translate-new / translate-all, translation status, publish automation, seo-utils, sitemap, claims API, related articles, หน้า new/edit/list และ Translation Dashboard
- หน้า Settings: เพิ่ม dropdown "ภาษาต้นฉบับเริ่มต้นของโพสต์ใหม่"
- Editor: เพิ่ม dropdown ภาษาต้นฉบับข้างช่อง slug (เปลี่ยนได้ตอนสร้างเท่านั้น)

### 2. Prompt แปลภาษา
- เขียนใหม่ทุก prompt ใน `lib/translate-service.ts` เพราะเดิมยังเป็น prompt ของเว็บ "Siam Heritage" (สารานุกรมวัฒนธรรม) → เปลี่ยนเป็นแนว fact-check ที่เน้นความแม่นของข้อเท็จจริง
- ทุก prompt รับ `sourceLocale` แล้ว (เดิม fix "from Thai")
- ลบฟังก์ชันที่ไม่มีใครเรียก: `translateArticle`, `translateContentOnly`

### 3. ประสิทธิภาพ
- `getTranslatedSummaries` (หน้า home / รายการบทความ): จากเดิม 2 query ต่อบทความ (100 บทความ = 200 query) เหลือ 2 query รวม

### 4. ลบไฟล์ที่ไม่มีใคร import
`components/admin/article-editor-jsx.tsx`, `components/admin/markdown-preview.tsx`, `components/admin/tag-manager.tsx`,
`components/coming-soon.tsx`, `components/home/hero.tsx`, `components/schema-entity-quickfacts.tsx`, `components/ui/enhanced-image.tsx`,
`lib/article-service.ts`, `lib/articles.ts`, `lib/auth-service-supabase.ts`, `lib/use-settings.ts`, `lib/utils.ts`,
`data/users.json`, `workspaces/` และ dependency ที่ไม่ได้ใช้: `clsx`, `tailwind-merge`, `class-variance-authority`

### 5. Export / Import JSON (ระบบ clone บทความ 2026-10-16/17)
- ตรวจแล้วยังใช้ได้ และพก `source_locale` ไปด้วยแล้ว (ไฟล์เก่าที่ไม่มีฟิลด์นี้ = `th`)
- แก้บั๊กเดิม: คำแปลที่ import มาถูกขึ้นเตือนว่า "ล้าสมัย" ทันที เพราะ `translated_at` เป็นเวลาเดิมจากเว็บต้นทาง แต่ `content_updated_at` เป็นเวลาที่ import → ตอนนี้ใช้เวลา import เดียวกันทั้งคู่
- ข้าม `translations` ที่เป็นภาษาเดียวกับต้นฉบับ

### 6. เครื่องมือทำบทความ
- slash command `/draft-article` (ร่างจากหัวข้อ) และ `/clone-article` (เรียบเรียงลงเว็บเครือข่าย รับไฟล์หรือโฟลเดอร์) ใน `.claude/commands/`
- ปุ่ม Import JSON ในหน้าเขียนบทความใหม่เลือกได้หลายไฟล์ ตรวจ slug ซ้ำในรอบเดียวกัน และเตือนก่อนทับบทความที่มีอยู่แล้ว
- คู่มือ: `docs/2026-11-01-article-guide.md`

### 7. Docs
- เปลี่ยนชื่อเป็นแบบ `YYYY-MM-DD-หัวข้อ.md` (วันที่ = วันที่อัปเดตล่าสุด) และสร้าง `docs/README.md` เป็นสารบัญ
- ไฟล์เก่า 29 ไฟล์ย้ายไป `docs/archive/` (ไม่ได้ลบ)
- `README.md` (root) เขียนใหม่ และเปลี่ยนชื่อ package จาก `siamheritage` เป็น `unfakenews`

## ผลตรวจ
- `npx tsc --noEmit` ผ่าน
- `next build` ผ่าน (ใช้ env ปลอม)
- **ยังไม่ได้ทดสอบกับ DB จริง** และยังไม่ได้รัน migration 029

## ขั้นตอน deploy
1. รัน `migrations/029_article_source_locale.sql` บน Supabase **ทั้ง 5 เว็บ**
2. merge branch → `main` (Vercel deploy ทุกเว็บ)
3. เว็บ 2–5: Admin → Settings → การ์ดภาษา → ตั้ง "ภาษาต้นฉบับเริ่มต้น" = English → บันทึก
4. ทดสอบ: สร้างบทความภาษาอังกฤษ → publish → เปิด `/en/articles/<slug>` → กดแปลเป็นไทย → เปิด `/th/articles/<slug>`

## ข้อสังเกตที่ยังไม่ได้แก้ (ควรทำต่อ)
- **ระบบแปลใช้แค่ Gemini** — ช่องเลือก provider และ key ของ Claude/OpenAI ใน Settings ยังไม่มีผล ควรเลือกระหว่างทำให้ใช้ได้จริงหรือเอาออก
- **sitemap ซ้ำ 4 ชุด**: `app/sitemap.ts`, `app/sitemap/[lang]`, `app/sitemap-xml`, `app/api/sitemap` — ควรตรวจว่าตัวไหนถูกใช้จริง (robots.txt / Search Console) แล้วรวมให้เหลือชุดเดียว
- x-default ของหน้า static ใน sitemap ยังอิง `th` (บทความใช้ภาษาต้นฉบับแล้ว)
- ไฟล์ใหญ่ที่ควรแตก: `components/admin/article-editor.tsx` (~1,780 บรรทัด), `app/admin/settings/page.tsx` (~1,490), `components/articles/article-detail.tsx` (~1,080)
- migration 2 ชุด (`migrations/` กับ `supabase/migrations/`) — ชุด `supabase/` ถูก merge เข้า `000_schema_all_in_one.sql` แล้ว ย้ายไป archive ได้
