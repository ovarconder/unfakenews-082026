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
