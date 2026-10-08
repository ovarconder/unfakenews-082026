-- ============================================================
-- 024: Logo text (ชื่อเว็บข้างโลโก้) ใน Header
-- ============================================================
-- เพิ่มความสามารถแสดง "ข้อความชื่อเว็บ" ต่อจากรูปโลโก้ใน Header
-- โดยแสดงเฉพาะจอใหญ่ (desktop) — จอ mobile ไม่แสดง
-- และผู้ดูแลสามารถกำหนด ฟอนต์ + สี ของข้อความนี้ได้
--
-- ใช้ ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotent)
-- ⚠️ หลังรันใน Supabase SQL Editor หากยังเจอ "schema cache"
--    ให้ไปที่ Dashboard > Settings > API > "Reload schema cache"
--    (หรือรอ ~1 นาที จะ refresh เอง) — migration นี้ NOTIFY ให้แล้ว
-- ============================================================

-- ---- Logo text (ชื่อเว็บข้างโลโก้) ----
-- ค่าที่แสดงต่อจากรูปโลโก้ (เว้นว่าง = ไม่แสดงข้อความ, แสดงแค่รูปโลโก้)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text TEXT DEFAULT '';
-- ฟอนต์ (CSS font-family) ของข้อความ เช่น 'Inter, sans-serif'
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text_font TEXT DEFAULT '';
-- สีของข้อความ (hex / rgb / css color)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text_color TEXT DEFAULT '';

-- ---- Force PostgREST to reload its schema cache ----
NOTIFY pgrst, 'reload schema';
