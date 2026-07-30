-- ============================================================
-- 014: Categories Ordering + Translation Support
-- ============================================================
-- Adds sort_order to categories table for UI ordering
-- ============================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Optional: seed default categories if none exist
INSERT INTO categories (slug, name_th, name_en, description_th, description_en, sort_order)
SELECT * FROM (VALUES
  ('heritage', 'มรดกไทย', 'Thai Heritage', 'มรดกทางวัฒนธรรมและประวัติศาสตร์ของไทย', 'Cultural and historical heritage of Thailand', 1),
  ('tradition', 'ประเพณีไทย', 'Thai Traditions', 'ประเพณีและเทศกาลสำคัญของไทย', 'Important traditions and festivals of Thailand', 2),
  ('wisdom', 'ภูมิปัญญาไทย', 'Thai Wisdom', 'ภูมิปัญญาท้องถิ่นและองค์ความรู้ดั้งเดิม', 'Local wisdom and traditional knowledge', 3),
  ('food', 'อาหารไทย', 'Thai Cuisine', 'อาหารและวัฒนธรรมการกินของไทย', 'Thai food and culinary culture', 4),
  ('language', 'ภาษาไทย', 'Thai Language', 'ภาษาและวรรณกรรมไทย', 'Thai language and literature', 5),
  ('crafts', 'ศิลปหัตถกรรม', 'Arts & Crafts', 'ศิลปหัตถกรรมและงานฝีมือไทย', 'Thai arts, crafts and handicrafts', 6),
  ('travel', 'ท่องเที่ยว', 'Travel', 'แหล่งท่องเที่ยวและสถานที่สำคัญ', 'Tourist attractions and important sites', 7)
) AS v(slug, name_th, name_en, description_th, description_en, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
ON CONFLICT (slug) DO NOTHING;
