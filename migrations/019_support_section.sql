-- ============================================================
-- Migration 019: Add Support section columns to site_settings
-- ============================================================
-- รองรับหน้า "สนับสนุนผู้ทำเว็บ" (ช่วยค่ากาแฟ/ค่าแปลข้อมูล)
-- โดยหลีกเลี่ยงคำว่า "บริจาค" เพื่อลดความสับสนเรื่องภาษี
-- Admin เปลี่ยนรูป QR code, หัวข้อ, คำอธิบาย และข้อมูลบัญชีได้
-- ============================================================

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS support_qr TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS support_title TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS support_description TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS support_account_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS support_account_number TEXT DEFAULT NULL;
