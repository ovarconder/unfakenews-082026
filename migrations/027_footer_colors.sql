-- ============================================================
-- 027: Footer colors — สีพื้นหลัง + สีข้อความของ Footer
-- ============================================================
-- เดิม Footer ใช้สี background_color_secondary ปนกับส่วนอื่น
-- และไม่มีช่องให้ปรับสีข้อความ Footer เลย
-- migration นี้เพิ่ม column ใหม่ให้ปรับได้แยกอิสระ:
--   footer_color       = สีพื้นหลัง Footer
--   footer_text_color  = สีข้อความหลักใน Footer
--
-- ใช้ ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotent)
-- ⚠️ หลังรันใน Supabase SQL Editor หากยังเจอ "schema cache"
--    ให้ไปที่ Dashboard > Settings > API > "Reload schema cache"
--    (หรือรอ ~1 นาที จะ refresh เอง) — migration นี้ NOTIFY ให้แล้ว
-- ============================================================

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_color TEXT DEFAULT '#0a1628';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_text_color TEXT DEFAULT '#ffffff';

-- ---- Force PostgREST to reload its schema cache ----
NOTIFY pgrst, 'reload schema';
