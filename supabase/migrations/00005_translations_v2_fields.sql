-- ============================================================
-- Siam Heritage — Migration 00005
-- เพิ่ม Translation v2 fields ใน translations table
-- ============================================================
-- Translation v2 system รองรับ:
--   - short_excerpt / long_excerpt (แทน excerpt เดิม)
--   - tags (JSONB)
--   - image_alt_texts (JSONB)
--   - entity_name (TEXT)
--   - quick_facts (JSONB)
--   - glossary (JSONB)
--   - social_caption (TEXT)
--
-- ต้องรันก่อนใช้ /api/translate-new หรือ /api/translate-all
--
-- ⚠️ NOTE สำหรับ Unfakenews-082026:
--   Migration นี้เดิมขาดหายไปจาก repo (มีแต่ 00001-00004, 00006)
--   ทำให้ตาราง translations ไม่มีคอลัมน์ v2 → กด "แปลอัตโนมัติ"
--   (ใช้ /api/translate-new) แล้วเกิด database error
-- ============================================================

ALTER TABLE translations
  ADD COLUMN IF NOT EXISTS short_excerpt TEXT,
  ADD COLUMN IF NOT EXISTS long_excerpt TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_alt_texts JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS entity_name TEXT,
  ADD COLUMN IF NOT EXISTS quick_facts JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS glossary JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_caption TEXT;

-- ============================================================
-- เพิ่มเติม: ปลด `excerpt NOT NULL`
-- route translate-new (ปุ่ม "แปลอัตโนมัติ") upsert แบบ INSERT
-- โดยไม่เขียน column `excerpt` → เดิม `excerpt TEXT NOT NULL` (ไม่มี default)
-- ทำให้ PostgreSQL ปฏิเสธเพราะ NOT NULL → database error
-- วิธีแก้: ให้ excerpt เป็น NULL ได้
-- ============================================================
ALTER TABLE translations ALTER COLUMN excerpt DROP NOT NULL;
