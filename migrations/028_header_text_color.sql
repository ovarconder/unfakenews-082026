-- ============================================================
-- 028: Header text color — สีข้อความ/เมนูใน Header
-- ============================================================
-- เดิม header มีแค่ header_color (พื้นหลัง) แต่สีข้อความ/ลิงก์เมนู
-- hardcode เป็น white/brand ไว้ใน header.tsx
-- migration นี้เพิ่ม column ให้ปรับสีข้อความ Header ได้แยกอิสระ:
--   header_text_color = สีข้อความ/ลิงก์หลักใน Header
--
-- ใช้ ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotent)
-- ⚠️ หลังรันใน Supabase SQL Editor หากยังเจอ "schema cache"
--    ให้ไปที่ Dashboard > Settings > API > "Reload schema cache"
--    (หรือรอ ~1 นาที จะ refresh เอง) — migration นี้ NOTIFY ให้แล้ว
-- ============================================================

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS header_text_color TEXT DEFAULT '#ffffff';

-- ---- Force PostgREST to reload its schema cache ----
NOTIFY pgrst, 'reload schema';
