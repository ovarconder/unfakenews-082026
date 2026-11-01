-- ============================================================
-- 029: Article source locale — ภาษาต้นฉบับรายบทความ
-- ============================================================
-- เดิมระบบ fix ว่าต้นฉบับใน `articles` (original_*) เป็นภาษาไทยเสมอ
-- migration นี้ทำให้แต่ละบทความเลือกภาษาต้นฉบับได้:
--   articles.source_locale           = ภาษาของ original_title/excerpt/content
--   site_settings.default_source_locale = ค่าเริ่มต้นตอนสร้างโพสต์ใหม่
--                                      (เว็บเครือข่ายภาษาอังกฤษตั้งเป็น 'en')
--
-- บทความเดิมทั้งหมดได้ค่า 'th' → พฤติกรรมเดิมไม่เปลี่ยน
-- ⚠️ ต้องรันบน Supabase ทุกเว็บ "ก่อน" deploy โค้ดเวอร์ชันนี้
-- ============================================================

ALTER TABLE articles      ADD COLUMN IF NOT EXISTS source_locale         TEXT NOT NULL DEFAULT 'th';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS default_source_locale TEXT NOT NULL DEFAULT 'th';

-- ---- Force PostgREST to reload its schema cache ----
NOTIFY pgrst, 'reload schema';
