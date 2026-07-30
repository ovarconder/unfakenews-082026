-- ============================================================
-- Siam Heritage — Migration 00006
-- เพิ่ม translation API key columns ใน site_settings table
-- ============================================================
-- หน้า admin/settings มีฟอร์มให้เลือก API provider และใส่ key
-- แต่ column ใน DB ยังไม่มี ต้องเพิ่มก่อน
-- ============================================================

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS translation_api_provider TEXT DEFAULT 'gemini',
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
  ADD COLUMN IF NOT EXISTS claude_api_key TEXT;
