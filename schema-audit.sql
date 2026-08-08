-- ============================================================================
-- Schema Audit for UnFakeNews
-- ============================================================================
-- ตรวจสอบความพร้อมของ Database ก่อน deploy:
--   1) table ที่แอปต้องการ ครบหรือยัง
--   2) แต่ละ table ที่มีอยู่ มี field/column ที่แอปใช้ครบหรือยัง
--
-- วิธีใช้: เปิด Supabase Dashboard -> SQL Editor -> วางโค้ดนี้ -> Run
-- ผลลัพธ์เป็น 2 ชุดคำตอบ (rows ที่ SELECT ขึ้นมา) อ่านจากบนลงล่าง
-- ============================================================================


-- ───────────────────────────────────────────────────────────────────────────
-- [1] เช็ค TABLE ที่แอปต้องการ แต่อยู่ใน DB หรือยัง
-- ───────────────────────────────────────────────────────────────────────────
WITH required_tables(table_name) AS (
  VALUES
    ('articles'),
    ('categories'),
    ('translations'),
    ('hero_slides'),
    ('profiles'),
    ('microsites'),
    ('profile_microsites'),
    ('site_settings')
)
SELECT
  rt.table_name                                                    AS "table",
  CASE
    WHEN i.table_name IS NOT NULL THEN '✅ มี'
    ELSE '❌ ยังไม่มี'
  END                                                              AS "สถานะ"
FROM required_tables rt
LEFT JOIN information_schema.tables i
       ON i.table_schema = 'public'
      AND i.table_name = rt.table_name
ORDER BY rt.table_name;


-- ───────────────────────────────────────────────────────────────────────────
-- [2] เช็ค COLUMN ที่ขาดของแต่ละ table (เฉพาะ table ที่มีอยู่)
--     ไม่ SELECT คอลัมน์ที่ครบ -> เฉพาะ column ที่ขาดก่อนจึงจะขึ้นคำตอบ
-- ───────────────────────────────────────────────────────────────────────────

-- 2.1 articles
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'articles'
)
SELECT 'articles' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('slug'),('original_title'),('original_excerpt'),('original_content'),
    ('category_id'),('author_id'),('author_name'),('microsite_id'),('is_published'),
    ('published_at'),('image_url'),('image_alt'),('image_credit'),('image_photographer'),
    ('image_source_url'),('image_year'),('google_schema_markup'),('featured'),('tags'),
    ('status'),('entity_name'),('entity_type'),('wikidata_id'),('quick_facts'),
    ('glossary'),('short_excerpt'),('long_excerpt'),('social_caption'),
    ('created_at'),('updated_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.2 categories
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'categories'
)
SELECT 'categories' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('slug'),('name_th'),('name_en'),('description_th'),('description_en'),
    ('image_url'),('sort_order'),('created_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.3 translations
-- รวมทุกคอลัมน์ที่ code เขียนด้วย (translate-new / translate-all / translate-content)
-- รวมถึงคอลัมน์ v2: short_excerpt, long_excerpt, tags, image_alt_texts, social_caption
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'translations'
)
SELECT 'translations' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('article_id'),('locale'),('title'),('excerpt'),('content'),('seo_title'),
    ('seo_description'),('entity_name'),('quick_facts'),('glossary'),
    ('translation_status'),('is_full_translated'),('translated_at'),
    ('short_excerpt'),('long_excerpt'),('tags'),('image_alt_texts'),('social_caption'),
    ('created_at'),('updated_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.4 hero_slides
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'hero_slides'
)
SELECT 'hero_slides' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('title_th'),('title_en'),('subtitle_th'),('subtitle_en'),('image_url'),
    ('cta_text_th'),('cta_text_en'),('cta_link'),('sort_order'),('is_active'),
    ('created_at'),('updated_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.5 profiles
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'profiles'
)
SELECT 'profiles' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('name'),('role'),('avatar_url'),('created_at'),('updated_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.6 microsites
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'microsites'
)
SELECT 'microsites' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('slug'),('name'),('description'),('is_active'),('primary_color'),
    ('background_color'),('background_secondary'),('card_color'),('logo_url'),
    ('favicon_url'),('inherit_from_main'),('locale_tiers'),('show_in_main_nav'),
    ('main_site_visible'),('show_main_site_link'),('custom_nav_links'),('meta_title'),
    ('meta_description'),('about_content_th'),('about_content_en'),('contact_email'),
    ('show_author'),('created_at'),('updated_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.7 profile_microsites
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'profile_microsites'
)
SELECT 'profile_microsites' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('profile_id'),('microsite_id'),('role'),('created_at')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;

-- 2.8 site_settings
WITH t AS (
  SELECT s.column_name
  FROM information_schema.columns s
  WHERE s.table_schema = 'public' AND s.table_name = 'site_settings'
)
SELECT 'site_settings' AS "table", c.column_name AS "column ที่ขาด"
FROM (
  VALUES
    ('id'),('name'),('tagline'),('description'),('url'),('logo'),('logo_full'),
    ('favicon'),('primary_color'),('secondary_color'),('accent_color'),
    ('background_color'),('background_color_secondary'),('card_color'),
    ('card_border_color'),('text_color'),('text_color_muted'),('sidebar_color'),
    ('header_color'),('success_color'),('error_color'),('copyright'),('locale'),
    ('timezone'),('meta_title'),('meta_description'),('og_title'),('og_description'),
    ('og_image'),('twitter_handle'),('google_analytics_id'),('adsense_id'),
    ('adsense_slot_homepage'),('adsense_slot_sidebar'),('facebook_url'),('twitter_url'),
    ('instagram_url'),('youtube_url'),('tiktok_url'),('email'),('phone'),('address'),
    ('show_author'),('enable_comments'),('enable_social_share'),('maintenance_mode'),
    ('maintenance_message'),('locale_tiers'),('google_oauth_client_id'),
    ('google_oauth_client_secret'),('facebook_oauth_client_id'),
    ('facebook_oauth_client_secret'),('translation_api_provider'),('claude_api_key'),
    ('openai_api_key'),('gemini_api_key'),('support_enabled'),('support_qr'),
    ('support_title'),('support_description'),('support_account_name'),
    ('support_account_number'),('updated_at'),('updated_by')
) AS c(column_name)
LEFT JOIN t ON t.column_name = c.column_name
WHERE t.column_name IS NULL;


-- ───────────────────────────────────────────────────────────────────────────
-- [3] ตรวจสอบที่จำเป็นอื่น ๆ
-- ───────────────────────────────────────────────────────────────────────────

-- 3.1 Enums ที่ใช้ (check type exists ใน pg_type)
SELECT 'enum: user_role'          AS "item",
       CASE WHEN t1.oid IS NOT NULL THEN '✅ มี' ELSE '❌ ยังไม่มี' END AS "สถานะ"
FROM (SELECT null::oid) x
LEFT JOIN pg_type t1 ON t1.typname = 'user_role'
UNION ALL
SELECT 'enum: translation_status', CASE WHEN t2.oid IS NOT NULL THEN '✅ มี' ELSE '❌ ยังไม่มี' END
FROM (SELECT null::oid) x
LEFT JOIN pg_type t2 ON t2.typname = 'translation_status';

-- 3.2 Storage bucket: images (ตรวจผ่าน storage.buckets)
SELECT sb.name AS "bucket", sb.public AS "public"
FROM storage.buckets sb
WHERE sb.name = 'images';
