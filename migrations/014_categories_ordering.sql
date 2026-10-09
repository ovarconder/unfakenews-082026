-- ============================================================
-- 014: Categories Ordering + Translation Support
-- ============================================================
-- Adds sort_order to categories table for UI ordering
-- ============================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Optional: seed default categories if none exist
-- ============================================================
-- 014: Categories Ordering + Translation Support
-- ============================================================
-- Adds sort_order to categories table for UI ordering
-- ============================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Optional: seed default categories if none exist
-- ★ ใช้คอลัมน์ show_on_public / show_at_footer ตรงกับ schema ล่าสุด (022)
--   หมวด "link" ถูกตั้งเป็นซ่อนจาก public แต่แสดงที่ footer เพื่อใช้เป็นหมวดลิงก์
INSERT INTO categories (slug, name_th, name_en, description_th, description_en, sort_order, show_on_public, show_at_footer)
SELECT * FROM (VALUES
  ('heritage', 'มรดกไทย', 'Thai Heritage', 'มรดกทางวัฒนธรรมและประวัติศาสตร์ของไทย', 'Cultural and historical heritage of Thailand', 1, true, true),
  ('tradition', 'ประเพณีไทย', 'Thai Traditions', 'ประเพณีและเทศกาลสำคัญของไทย', 'Important traditions and festivals of Thailand', 2, true, true),
  ('wisdom', 'ภูมิปัญญาไทย', 'Thai Wisdom', 'ภูมิปัญญาท้องถิ่นและองค์ความรู้ดั้งเดิม', 'Local wisdom and traditional knowledge', 3, true, true),
  ('food', 'อาหารไทย', 'Thai Cuisine', 'อาหารและวัฒนธรรมการกินของไทย', 'Thai food and culinary culture', 4, true, true),
  ('language', 'ภาษาไทย', 'Thai Language', 'ภาษาและวรรณกรรมไทย', 'Thai language and literature', 5, true, true),
  ('crafts', 'ศิลปหัตถกรรม', 'Arts & Crafts', 'ศิลปหัตถกรรมและงานฝีมือไทย', 'Thai arts, crafts and handicrafts', 6, true, true),
  ('travel', 'ท่องเที่ยว', 'Travel', 'แหล่งท่องเที่ยวและสถานที่สำคัญ', 'Tourist attractions and important sites', 7, true, true),
  ('link', 'ลิงก์', 'Link', 'ลิงก์และแหล่งข้อมูลอ้างอิงที่น่าสนใจ', 'Useful links and reference resources', 8, false, true)
) AS v(slug, name_th, name_en, description_th, description_en, sort_order, show_on_public, show_at_footer)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
ON CONFLICT (slug) DO NOTHING;
