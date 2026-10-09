-- ============================================================
-- 026: Add google_schema_markup column to translations table
-- ============================================================
-- ปัญหา: กดปุ่ม "แปลอัตโนมัติ" แล้วเจอ error
--   PGRST204: Could not find the 'google_schema_markup' column
--             of 'translations' in the schema cache
--
-- สาเหตุ:
--   โค้ดเขียนค่า JSON-LD ที่แปลแล้วลงคอลัมน์ translations.google_schema_markup
--   (ดู app/api/translate-new/route.ts, app/api/admin/translations/route.ts)
--   แต่ migration 018 เพิ่มคอลัมน์นี้ให้เฉพาะตาราง articles เท่านั้น
--   → ตาราง translations ไม่มีคอลัมน์นี้ จึงได้ PGRST204
--
-- ★ Migration นี้เพิ่มคอลัมน์ให้ตาราง translations (idempotent)
--   ใช้ JSONB เหมือน articles เพื่อเก็บ JSON-LD ที่แปลต่อ locale
--
-- ⚠️ หลังรันใน Supabase SQL Editor หากยังเจอ "schema cache"
--    ให้ไปที่ Dashboard > Settings > API > "Reload schema cache"
--    (หรือรอ ~1 นาที จะ refresh เอง) — migration นี้ NOTIFY ให้แล้ว
-- ============================================================

ALTER TABLE translations
ADD COLUMN IF NOT EXISTS google_schema_markup JSONB DEFAULT NULL;

-- ---- Force PostgREST to reload its schema cache ----
NOTIFY pgrst, 'reload schema';
