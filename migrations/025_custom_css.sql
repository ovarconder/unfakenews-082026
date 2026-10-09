-- ============================================================
-- 025: Custom CSS — ใส่ CSS กำหนดเองจากหน้า Admin Settings
-- ============================================================
-- ผู้ดูแลสามารถวาง CSS เองได้ เพื่อปรับแต่งหน้าตาเว็บ (public)
-- โดยไม่ต้องแก้โค้ด — ค่าจะถูก inject เป็น <style> ใน [lang]/layout.tsx
--
-- ใช้ ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotent)
-- ⚠️ หลังรันใน Supabase SQL Editor หากยังเจอ "schema cache"
--    ให้ไปที่ Dashboard > Settings > API > "Reload schema cache"
--    (หรือรอ ~1 นาที จะ refresh เอง) — migration นี้ NOTIFY ให้แล้ว
-- ============================================================

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_css TEXT DEFAULT '';

-- ---- Force PostgREST to reload its schema cache ----
NOTIFY pgrst, 'reload schema';
