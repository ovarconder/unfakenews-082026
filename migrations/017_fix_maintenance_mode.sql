-- ============================================================
-- Migration 017: Fix maintenance_mode column
-- ============================================================
-- ตรวจสอบและเพิ่ม maintenance_mode column ถ้ายังไม่มี
-- ============================================================

-- Ensure maintenance_mode column exists
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;

-- Update existing row to FALSE if NULL
UPDATE site_settings SET maintenance_mode = FALSE WHERE maintenance_mode IS NULL;

-- Verify
SELECT id, name, maintenance_mode FROM site_settings WHERE id = 'default';