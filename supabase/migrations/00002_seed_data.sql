-- ============================================================
-- Siam Heritage - Seed Data
-- ============================================================

-- ============================================================
-- Categories
-- ============================================================

INSERT INTO categories (slug, name_th, name_en, description_th, description_en) VALUES
  ('heritage', 'มรดกไทย', 'Thai Heritage', 'มรดกและโบราณสถานสำคัญของประเทศไทย', 'Important heritage sites and ancient places of Thailand'),
  ('tradition', 'ประเพณีไทย', 'Thai Traditions', 'ประเพณีและวัฒนธรรมไทยที่สืบทอดกันมา', 'Thai traditions and inherited culture'),
  ('wisdom', 'ภูมิปัญญาไทย', 'Thai Wisdom', 'ภูมิปัญญาท้องถิ่นและองค์ความรู้ดั้งเดิม', 'Local wisdom and traditional knowledge'),
  ('cuisine', 'อาหารไทย', 'Thai Cuisine', 'อาหารไทยและมรดกทางการกิน', 'Thai food and culinary heritage'),
  ('language', 'ภาษาไทย', 'Thai Language', 'ภาษาและวรรณกรรมไทย', 'Thai language and literature'),
  ('handicraft', 'ศิลปหัตถกรรม', 'Arts & Crafts', 'ศิลปหัตถกรรมและงานฝีมือไทย', 'Thai arts, crafts and handiwork')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Hero Slides
-- ============================================================

INSERT INTO hero_slides (title_th, title_en, subtitle_th, subtitle_en, image_url, image_alt_th, image_alt_en, cta_text_th, cta_text_en, cta_link, sort_order) VALUES
  (
    'มรดกไทย: วัดพระแก้ว',
    'Thai Heritage: Wat Phra Kaew',
    'มรดกแห่งศรัทธาและศิลปกรรมอันวิจิตรงดงาม',
    'A magnificent heritage of faith and art',
    '/images/hero/wat-phra-kaew.jpg',
    'วัดพระศรีรัตนศาสดาราม พระบรมมหาราชวัง กรุงเทพมหานคร',
    'Temple of the Emerald Buddha, Grand Palace, Bangkok',
    'อ่านเพิ่มเติม',
    'Read More',
    '/th/articles/wat-phra-kaew-temple',
    1
  ),
  (
    'ประเพณีลอยกระทง',
    'Loy Krathong Festival',
    'ประเพณีไทยที่งดงาม สะท้อนความผูกพันกับสายน้ำ',
    'A beautiful Thai tradition reflecting connection to water',
    '/images/hero/loy-krathong.jpg',
    'ประเพณีลอยกระทง งานเทศกาลทางน้ำของไทย',
    'Loy Krathong festival, Thai water festival',
    'เรียนรู้เพิ่มเติม',
    'Learn More',
    '/th/articles/loy-krathong-festival',
    2
  ),
  (
    'การแพทย์แผนไทย',
    'Thai Traditional Medicine',
    'ภูมิปัญญาการดูแลสุขภาพแบบองค์รวม',
    'Holistic healthcare wisdom passed down generations',
    '/images/hero/thai-medicine.jpg',
    'สมุนไพรไทยและการนวดแผนไทย',
    'Thai herbs and traditional Thai massage',
    'ศึกษาต่อ',
    'Explore',
    '/th/articles/thai-traditional-medicine',
    3
  ),
  (
    'อาหารไทยรสเลิศ',
    'Exquisite Thai Cuisine',
    'รสชาติแห่งมรดกทางวัฒนธรรมที่ได้รับการยอมรับทั่วโลก',
    'The taste of cultural heritage recognized worldwide',
    '/images/hero/thai-cuisine.jpg',
    'อาหารไทยหลากหลายเมนู',
    'Various Thai dishes',
    'ชมบทความ',
    'View Article',
    '/th/articles/thai-cuisine-heritage',
    4
  ),
  (
    'ภาษาไทยมรดกทางภาษา',
    'Thai Language Heritage',
    'ภาษาไทย: ภาษาที่มีเอกลักษณ์ด้วยระบบวรรณยุกต์',
    'Thai: a unique language with tonal system',
    '/images/hero/thai-language.jpg',
    'อักษรไทยและภาษาไทย',
    'Thai alphabet and language',
    'อ่านต่อ',
    'Read More',
    '/th/articles/thai-language-heritage',
    5
  ),
  (
    'ศิลปหัตถกรรมไทย',
    'Thai Handicrafts',
    'มรดกแห่งภูมิปัญญาที่ควรค่าแก่การอนุรักษ์',
    'A wisdom heritage worth preserving',
    '/images/hero/thai-handicraft.jpg',
    'งานศิลปหัตถกรรมไทย',
    'Thai handicrafts and artisan works',
    'ชมผลงาน',
    'View Gallery',
    '/th/articles/thai-handicraft-heritage',
    6
  )
ON CONFLICT DO NOTHING;
