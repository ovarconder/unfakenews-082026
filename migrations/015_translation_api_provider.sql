-- ============================================================
-- 015: Translation API Provider Settings
-- ============================================================
-- เพิ่มฟิลด์เลือก API Provider สำหรับการแปลภาษา
-- ============================================================

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS translation_api_provider TEXT DEFAULT 'gemini';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS claude_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT '';
