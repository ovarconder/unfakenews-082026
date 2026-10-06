-- ============================================================
-- 022: Categories Visibility Flags
-- ============================================================
-- Adds two boolean flags to categories:
--   show_on_public  → แสดงในหน้า public (home, [slug] เป็นต้น)
--   show_at_footer  → แสดงที่ footer
-- ทั้งคู่ default = true (รวมถึง categories ที่มีอยู่เดิมด้วย)
-- ใช้สำหรับทำ categories พิเศษ (เช่น หมวดที่ซ่อนจาก public แต่ยังใช้ได้)
-- ============================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_public BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_at_footer BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_categories_show_on_public ON categories(show_on_public);
CREATE INDEX IF NOT EXISTS idx_categories_show_at_footer ON categories(show_at_footer);
