+-- ============================================================================
-- UnFakeNews — ALL-IN-ONE SCHEMA
-- ============================================================================
-- ไฟล์เดียวรวบ schema ทั้งหมดของโปรเจกต์ (สำหรับตั้ง DB ใหม่)
-- รวบรวมจาก: supabase/migrations/00001-00006 + migrations/011-022
--
-- ✅ Idempotent — รันซ้ำได้ปลอดภัย (CREATE ... IF NOT EXISTS / DROP POLICY IF EXISTS)
-- ✅ รันบน Supabase SQL Editor หรือ psql ได้เลย
-- ⚠️ ข้าม seed admin (ต้องมี auth.users ก่อน) — ดูหมายเหตุท้ายไฟล์
--
-- ลำดับ:
--   [1] Extensions & Enums
--   [2] Tables หลัก (profiles, categories, articles, translations, hero_slides)
--   [3] Microsites (012) + FK
--   [4] site_settings (013, 015, 017, 019, 021, 024)
--   [5] Triggers (auto-create profile)
--   [6] ALTER เพิ่มคอลัมน์ (014, 016, 018, 022)
--   [7] RLS Policies (ทุกตาราง)
--   [8] Storage bucket "images" (020)
--   [9] Seed data (categories, hero_slides)
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- [1] EXTENSIONS & ENUMS
-- ════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- user_role: 3 ค่า (ตรงกับ lib/auth-types.ts) — ไม่มี 'unassigned'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('writer', 'editor', 'admin');
  END IF;
END $$;

-- translation_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'translation_status') THEN
    CREATE TYPE translation_status AS ENUM ('complete', 'summary_only', 'pending');
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- [2] TABLES หลัก
-- ════════════════════════════════════════════════════════════════════════════

-- ---- profiles (extends auth.users) ----
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       user_role NOT NULL DEFAULT 'writer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- categories ----
CREATE TABLE IF NOT EXISTS categories (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           TEXT UNIQUE NOT NULL,
  name_th        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- articles ----
CREATE TABLE IF NOT EXISTS articles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             TEXT UNIQUE NOT NULL,
  original_title   TEXT NOT NULL,
  original_excerpt TEXT NOT NULL,
  original_content TEXT NOT NULL,
  category_id      UUID NOT NULL REFERENCES categories(id),
  author_id        UUID NOT NULL REFERENCES profiles(id),
  author_name      TEXT NOT NULL,
  published_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url        TEXT,
  image_alt        TEXT,
  featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug         ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_featured     ON articles(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- ---- translations ----
CREATE TABLE IF NOT EXISTS translations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id         UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale             TEXT NOT NULL,
  title              TEXT NOT NULL,
  excerpt            TEXT,
  content            TEXT NOT NULL DEFAULT '',
  seo_title          TEXT,
  seo_description    TEXT,
  translation_status translation_status NOT NULL DEFAULT 'pending',
  is_full_translated BOOLEAN NOT NULL DEFAULT FALSE,
  translated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_translations_article ON translations(article_id);
CREATE INDEX IF NOT EXISTS idx_translations_locale  ON translations(locale);

-- ---- hero_slides ----
CREATE TABLE IF NOT EXISTS hero_slides (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_th     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  subtitle_th  TEXT,
  subtitle_en  TEXT,
  image_url    TEXT NOT NULL,
  image_alt_th TEXT,
  image_alt_en TEXT,
  cta_text_th  TEXT,
  cta_text_en  TEXT,
  cta_link     TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(sort_order) WHERE is_active = TRUE;


-- ════════════════════════════════════════════════════════════════════════════
-- [3] MICROSITES (012)  — microsite เลิกใช้แล้ว แต่คง schema ไว้เพื่อ compatibility
--     กับ FK (articles.microsite_id, hero_slides.microsite_id)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS microsites (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  description          TEXT,
  is_active            BOOLEAN DEFAULT true,
  primary_color        TEXT DEFAULT '#fbbf24',
  background_color     TEXT DEFAULT '#060e1a',
  background_secondary TEXT DEFAULT '#0a1628',
  card_color           TEXT DEFAULT '#0f1f3a',
  logo_url             TEXT,
  favicon_url          TEXT,
  inherit_from_main    BOOLEAN DEFAULT true,
  locale_tiers         JSONB DEFAULT NULL,
  show_in_main_nav     BOOLEAN DEFAULT false,
  main_site_visible    BOOLEAN DEFAULT false,
  show_main_site_link  BOOLEAN DEFAULT true,
  custom_nav_links     JSONB DEFAULT '[]'::jsonb,
  meta_title           TEXT,
  meta_description     TEXT,
  about_content_th     TEXT,
  about_content_en     TEXT,
  contact_email        TEXT,
  show_author          BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_microsites (
  profile_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  microsite_id UUID REFERENCES microsites(id) ON DELETE CASCADE,
  role         TEXT DEFAULT 'microsite_admin'
               CHECK (role IN ('microsite_admin', 'microsite_editor', 'microsite_writer')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (profile_id, microsite_id)
);

-- FK: microsite_id (เพิ่มหลังสร้าง microsites)
ALTER TABLE articles     ADD COLUMN IF NOT EXISTS microsite_id UUID REFERENCES microsites(id) NULL;
ALTER TABLE hero_slides  ADD COLUMN IF NOT EXISTS microsite_id UUID REFERENCES microsites(id) NULL;

CREATE INDEX IF NOT EXISTS idx_articles_microsite_id           ON articles(microsite_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_microsite_id        ON hero_slides(microsite_id);
CREATE INDEX IF NOT EXISTS idx_profile_microsites_profile_id   ON profile_microsites(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_microsites_microsite_id ON profile_microsites(microsite_id);


-- ════════════════════════════════════════════════════════════════════════════
-- [4] SITE_SETTINGS (013 + 015 + 017 + 019 + 021 + 024)
--     ★ ใช้ CREATE TABLE IF NOT EXISTS แล้วตามด้วย ALTER ทุกคอลัมน์
--       ครอบคลุมทั้ง DB ใหม่ และ DB เก่าที่ตารางมีอยู่แล้ว
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default'
);

-- ---- Core / Branding ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS name        TEXT DEFAULT 'UnFake News';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tagline     TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS url         TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo        TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_full   TEXT DEFAULT '';
-- ข้อความชื่อเว็บข้างโลโก้ (แสดงเฉพาะจอใหญ่) + ฟอนต์/สี
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text       TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text_font  TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text_color TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS favicon     TEXT DEFAULT '';

-- ---- Colors ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS primary_color             TEXT DEFAULT '#fbbf24';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS secondary_color           TEXT DEFAULT '#f59e0b';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS accent_color              TEXT DEFAULT '#d97706';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS background_color          TEXT DEFAULT '#060e1a';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS background_color_secondary TEXT DEFAULT '#0a1628';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS card_color                TEXT DEFAULT '#0f1f3a';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS card_border_color         TEXT DEFAULT 'rgba(255,255,255,0.1)';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS text_color                TEXT DEFAULT '#ffffff';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS text_color_muted          TEXT DEFAULT 'rgba(255,255,255,0.5)';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sidebar_color             TEXT DEFAULT '#0a1628';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS header_color              TEXT DEFAULT '#060e1a';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS success_color             TEXT DEFAULT '#10b981';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS error_color               TEXT DEFAULT '#ef4444';

-- ---- Content / Meta ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS copyright TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS locale    TEXT DEFAULT 'both';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS timezone  TEXT DEFAULT 'Asia/Bangkok';

-- ---- SEO ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS meta_title       TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_title         TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_description   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_image         TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitter_handle   TEXT DEFAULT '';

-- ---- Analytics & Ads ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_analytics_id   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS adsense_id            TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS adsense_slot_homepage TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS adsense_slot_sidebar  TEXT DEFAULT '';

-- ---- Social links ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_url  TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitter_url   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_url   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_url    TEXT DEFAULT '';

-- ---- Contact ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS email   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS phone   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';

-- ---- Features ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS show_author         BOOLEAN DEFAULT TRUE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS enable_comments     BOOLEAN DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS enable_social_share BOOLEAN DEFAULT TRUE;

-- ---- Maintenance ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_mode    BOOLEAN DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT '';

-- ---- Language tiers ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS locale_tiers JSONB DEFAULT
  '{"en":"1","th":"1","zh":"1","ja":"1","es":"1","pt":"1","fr":"2","ko":"2","de":"2","ru":"2","ar":"2","hi":"2","it":"2","vi":"2","ms":"2"}';

-- ---- OAuth Keys ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_oauth_client_id       TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_oauth_client_secret   TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_oauth_client_id     TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_oauth_client_secret TEXT DEFAULT '';

-- ---- Translation API Settings ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS translation_api_provider TEXT DEFAULT 'gemini';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS claude_api_key            TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS openai_api_key            TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS gemini_api_key            TEXT DEFAULT '';

-- ---- Support section ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_enabled        BOOLEAN DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_qr             TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_title          TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_description    TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_account_name   TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_account_number TEXT DEFAULT NULL;

-- ---- Metadata ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT '';

-- ---- Ensure default row ----
INSERT INTO site_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- [5] TRIGGERS — auto-create profile เมื่อมี user ใหม่ใน auth.users
--     (safety net — สร้าง role เริ่มต้น = 'writer')
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'writer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ════════════════════════════════════════════════════════════════════════════
-- [6] ALTER เพิ่มคอลัมน์ (014, 016, 018, 022, 00005)
-- ════════════════════════════════════════════════════════════════════════════

-- ---- categories (014 + 022) ----
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_public BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_at_footer BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_categories_sort_order     ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_show_on_public ON categories(show_on_public);
CREATE INDEX IF NOT EXISTS idx_categories_show_at_footer ON categories(show_at_footer);

-- ---- articles (016 + 018) ----
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags               JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit       TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_photographer TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_source_url   TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_year         TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS entity_name        TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS entity_type        TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS wikidata_id        TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quick_facts        JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS glossary           JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS short_excerpt      TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS long_excerpt       TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_caption     TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS google_schema_markup JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_entity_type ON articles(entity_type);
CREATE INDEX IF NOT EXISTS idx_articles_wikidata_id ON articles(wikidata_id);

-- ---- translations (00005) — Translation v2 fields ----
ALTER TABLE translations ADD COLUMN IF NOT EXISTS short_excerpt   TEXT;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS long_excerpt    TEXT;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS tags            JSONB DEFAULT '[]'::jsonb;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS image_alt_texts JSONB DEFAULT '{}'::jsonb;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS entity_name     TEXT;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS quick_facts     JSONB DEFAULT '{}'::jsonb;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS glossary        JSONB DEFAULT '[]'::jsonb;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS social_caption  TEXT;
-- ปลด NOT NULL ให้ excerpt (route translate-new upsert โดยไม่เขียน excerpt)
ALTER TABLE translations ALTER COLUMN excerpt DROP NOT NULL;

-- ---- articles (023) — Translation staleness detection ----
-- เวลาที่ "เนื้อหาที่ต้องแปล" ถูกแก้ไขล่าสุด (เทียบกับ translations.translated_at เพื่อหา stale)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE articles
SET content_updated_at = COALESCE(updated_at, published_at::timestamptz, created_at, NOW())
WHERE content_updated_at IS NULL;
ALTER TABLE articles ALTER COLUMN content_updated_at SET DEFAULT NOW();
ALTER TABLE articles ALTER COLUMN content_updated_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_content_updated_at ON articles(content_updated_at DESC);


-- ════════════════════════════════════════════════════════════════════════════
-- [7] ROW LEVEL SECURITY (RLS) + POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- ---- เปิด RLS ทุกตาราง ----
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE microsites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings      ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- categories ----
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---- articles ----
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
CREATE POLICY "Public can view published articles"
  ON articles FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Staff can view all articles" ON articles;
CREATE POLICY "Staff can view all articles"
  ON articles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'writer')));

DROP POLICY IF EXISTS "Writers can create articles" ON articles;
CREATE POLICY "Writers can create articles"
  ON articles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'writer')));

DROP POLICY IF EXISTS "Writers can edit own articles" ON articles;
CREATE POLICY "Writers can edit own articles"
  ON articles FOR UPDATE
  USING (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('writer'))
  )
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('writer'))
  );

DROP POLICY IF EXISTS "Editors and admins can edit any article" ON articles;
CREATE POLICY "Editors and admins can edit any article"
  ON articles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Editors and admins can delete articles" ON articles;
CREATE POLICY "Editors and admins can delete articles"
  ON articles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- ---- translations ----
DROP POLICY IF EXISTS "Public can view translations" ON translations;
CREATE POLICY "Public can view translations"
  ON translations FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Service role can manage translations" ON translations;
CREATE POLICY "Service role can manage translations"
  ON translations FOR ALL
  USING (auth.role() = 'service_role');

-- ---- hero_slides ----
DROP POLICY IF EXISTS "Public can view active hero slides" ON hero_slides;
CREATE POLICY "Public can view active hero slides"
  ON hero_slides FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage hero slides" ON hero_slides;
CREATE POLICY "Admins can manage hero slides"
  ON hero_slides FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---- microsites (012) ----
DROP POLICY IF EXISTS "Anyone can view active microsites" ON microsites;
CREATE POLICY "Anyone can view active microsites"
  ON microsites FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage microsites" ON microsites;
CREATE POLICY "Admins can manage microsites"
  ON microsites FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can see own microsite assignments" ON profile_microsites;
CREATE POLICY "Users can see own microsite assignments"
  ON profile_microsites FOR SELECT USING (profile_id = auth.uid());

-- ---- site_settings ----
DROP POLICY IF EXISTS "Admins can read site_settings" ON site_settings;
CREATE POLICY "Admins can read site_settings"
  ON site_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can upsert site_settings" ON site_settings;
CREATE POLICY "Admins can upsert site_settings"
  ON site_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ---- trigger updated_at ของ microsites ----
CREATE OR REPLACE FUNCTION update_microsite_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS microsites_updated_at ON microsites;
CREATE TRIGGER microsites_updated_at
  BEFORE UPDATE ON microsites
  FOR EACH ROW
  EXECUTE FUNCTION update_microsite_timestamp();


-- ════════════════════════════════════════════════════════════════════════════
-- [8] STORAGE BUCKET: images (020)
--     ★ bucket หลัก = 'images' (ไม่ใช่ 'article-images')
--       ภายในแบ่ง folder: article-images/, site-settings/, hero-slides/, categories/
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB (จำกัดจริงที่ API = 1MB)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- RLS Policies สำหรับ storage bucket "images"
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "images_admin_insert" ON storage.objects;
CREATE POLICY "images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "images_admin_update" ON storage.objects;
CREATE POLICY "images_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "images_admin_delete" ON storage.objects;
CREATE POLICY "images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- [9] SEED DATA (categories, hero_slides)
--     ⚠️ Seed จะรันเฉพาะเมื่อ "ตารางยังว่าง" — กันข้อมูลซ้ำสำหรับ DB เก่า
-- ════════════════════════════════════════════════════════════════════════════

-- ---- categories (เฉพาะเมื่อยังไม่มีข้อมูล) ----
INSERT INTO categories (slug, name_th, name_en, description_th, description_en, sort_order)
SELECT * FROM (VALUES
  ('heritage',   'มรดกไทย',        'Thai Heritage',   'มรดกและโบราณสถานสำคัญของประเทศไทย',       'Important heritage sites and ancient places of Thailand', 1),
  ('tradition',  'ประเพณีไทย',      'Thai Traditions', 'ประเพณีและวัฒนธรรมไทยที่สืบทอดกันมา',      'Thai traditions and inherited culture', 2),
  ('wisdom',     'ภูมิปัญญาไทย',    'Thai Wisdom',     'ภูมิปัญญาท้องถิ่นและองค์ความรู้ดั้งเดิม',    'Local wisdom and traditional knowledge', 3),
  ('cuisine',    'อาหารไทย',        'Thai Cuisine',    'อาหารไทยและมรดกทางการกิน',                'Thai food and culinary heritage', 4),
  ('language',   'ภาษาไทย',         'Thai Language',   'ภาษาและวรรณกรรมไทย',                      'Thai language and literature', 5),
  ('handicraft', 'ศิลปหัตถกรรม',    'Arts & Crafts',   'ศิลปหัตถกรรมและงานฝีมือไทย',              'Thai arts, crafts and handiwork', 6)
) AS v(slug, name_th, name_en, description_th, description_en, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
ON CONFLICT (slug) DO NOTHING;

-- ---- hero_slides (เฉพาะเมื่อยังไม่มีข้อมูล) ----
INSERT INTO hero_slides (title_th, title_en, subtitle_th, subtitle_en, image_url, image_alt_th, image_alt_en, cta_text_th, cta_text_en, cta_link, sort_order)
SELECT * FROM (VALUES
  ('มรดกไทย: วัดพระแก้ว','Thai Heritage: Wat Phra Kaew','มรดกแห่งศรัทธาและศิลปกรรมอันวิจิตรงดงาม','A magnificent heritage of faith and art','/images/hero/wat-phra-kaew.jpg','วัดพระศรีรัตนศาสดาราม พระบรมมหาราชวัง กรุงเทพมหานคร','Temple of the Emerald Buddha, Grand Palace, Bangkok','อ่านเพิ่มเติม','Read More','/th/articles/wat-phra-kaew-temple',1),
  ('ประเพณีลอยกระทง','Loy Krathong Festival','ประเพณีไทยที่งดงาม สะท้อนความผูกพันกับสายน้ำ','A beautiful Thai tradition reflecting connection to water','/images/hero/loy-krathong.jpg','ประเพณีลอยกระทง งานเทศกาลทางน้ำของไทย','Loy Krathong festival, Thai water festival','เรียนรู้เพิ่มเติม','Learn More','/th/articles/loy-krathong-festival',2),
  ('การแพทย์แผนไทย','Thai Traditional Medicine','ภูมิปัญญาการดูแลสุขภาพแบบองค์รวม','Holistic healthcare wisdom passed down generations','/images/hero/thai-medicine.jpg','สมุนไพรไทยและการนวดแผนไทย','Thai herbs and traditional Thai massage','ศึกษาต่อ','Explore','/th/articles/thai-traditional-medicine',3),
  ('อาหารไทยรสเลิศ','Exquisite Thai Cuisine','รสชาติแห่งมรดกทางวัฒนธรรมที่ได้รับการยอมรับทั่วโลก','The taste of cultural heritage recognized worldwide','/images/hero/thai-cuisine.jpg','อาหารไทยหลากหลายเมนู','Various Thai dishes','ชมบทความ','View Article','/th/articles/thai-cuisine-heritage',4),
  ('ภาษาไทยมรดกทางภาษา','Thai Language Heritage','ภาษาไทย: ภาษาที่มีเอกลักษณ์ด้วยระบบวรรณยุกต์','Thai: a unique language with tonal system','/images/hero/thai-language.jpg','อักษรไทยและภาษาไทย','Thai alphabet and language','อ่านต่อ','Read More','/th/articles/thai-language-heritage',5),
  ('ศิลปหัตถกรรมไทย','Thai Handicrafts','มรดกแห่งภูมิปัญญาที่ควรค่าแก่การอนุรักษ์','A wisdom heritage worth preserving','/images/hero/thai-handicraft.jpg','งานศิลปหัตถกรรมไทย','Thai handicrafts and artisan works','ชมผลงาน','View Gallery','/th/articles/thai-handicraft-heritage',6)
) AS v(title_th, title_en, subtitle_th, subtitle_en, image_url, image_alt_th, image_alt_en, cta_text_th, cta_text_en, cta_link, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1);


-- ════════════════════════════════════════════════════════════════════════════
-- [10] FORCE PostgREST reload schema cache
-- ════════════════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';


-- ════════════════════════════════════════════════════════════════════════════
-- ✅ DONE — ตรวจสอบผลลัพธ์ได้ที่ "schema-audit.sql"
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ ขั้นตอนถัดไป — สร้าง Admin คนแรก (ทำแยก เพราะต้องมี auth.users ก่อน)
--   1. Supabase Dashboard → Authentication → Users → Add User (ติ๊ก Auto Confirm)
--      หรือใช้ Admin UI ในเว็บหลัง deploy
--   2. คัดลอก User UID แล้วรัน SQL นี้ (แทน <USER_UID>):
--
--      INSERT INTO profiles (id, name, role)
--      VALUES ('<USER_UID>', 'Admin', 'admin')
--      ON CONFLICT (id) DO UPDATE SET role = 'admin';
--
--   หรือค้นหาด้วย email:
--
--      UPDATE profiles SET role = 'admin', name = 'ผู้ดูแลระบบ'
--      WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com' LIMIT 1);
--
--   (ไฟล์ต้นฉบับ: supabase/migrations/00003_seed_admin.sql)
-- ============================================================================
