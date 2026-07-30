-- ============================================================
-- Migration 012: Microsites Multi-Site Support
-- ============================================================
-- เพิ่มตาราง microsites, profile_microsites junction
-- และเพิ่ม microsite_id ใน articles/hero_slides
-- ============================================================

-- 1. สร้างตาราง microsites
CREATE TABLE IF NOT EXISTS microsites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Branding
  primary_color TEXT DEFAULT '#fbbf24',
  background_color TEXT DEFAULT '#060e1a',
  background_secondary TEXT DEFAULT '#0a1628',
  card_color TEXT DEFAULT '#0f1f3a',
  logo_url TEXT,
  favicon_url TEXT,
  
  -- Inherit from main site settings
  inherit_from_main BOOLEAN DEFAULT true,
  -- Override locale tiers (JSON: {"en":"1","th":"2",...})
  locale_tiers JSONB DEFAULT NULL,
  
  -- Navigation settings
  show_in_main_nav BOOLEAN DEFAULT false,
  main_site_visible BOOLEAN DEFAULT false,
  show_main_site_link BOOLEAN DEFAULT true,
  custom_nav_links JSONB DEFAULT '[]'::jsonb,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- About & Contact
  about_content_th TEXT,
  about_content_en TEXT,
  contact_email TEXT,
  show_author BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. สร้าง junction table: profile → microsites
--    (สำหรับ microsite-specific admins)
CREATE TABLE IF NOT EXISTS profile_microsites (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  microsite_id UUID REFERENCES microsites(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'microsite_admin' 
    CHECK (role IN ('microsite_admin', 'microsite_editor', 'microsite_writer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (profile_id, microsite_id)
);

-- 3. เพิ่ม microsite_id ใน articles (nullable)
--    NULL = main site article
ALTER TABLE articles ADD COLUMN IF NOT EXISTS microsite_id UUID REFERENCES microsites(id) NULL;

-- 4. เพิ่ม microsite_id ใน hero_slides (nullable)
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS microsite_id UUID REFERENCES microsites(id) NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_articles_microsite_id ON articles(microsite_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_microsite_id ON hero_slides(microsite_id);
CREATE INDEX IF NOT EXISTS idx_profile_microsites_profile_id ON profile_microsites(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_microsites_microsite_id ON profile_microsites(microsite_id);

-- 6. RLS Policies
ALTER TABLE microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_microsites ENABLE ROW LEVEL SECURITY;

-- Everyone can see active microsites
CREATE POLICY "Anyone can view active microsites"
  ON microsites FOR SELECT
  USING (is_active = true);

-- Admin can manage microsites
CREATE POLICY "Admins can manage microsites"
  ON microsites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Profile-microsite: individuals see their own assignments
CREATE POLICY "Users can see own microsite assignments"
  ON profile_microsites FOR SELECT
  USING (profile_id = auth.uid());

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_microsite_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER microsites_updated_at
  BEFORE UPDATE ON microsites
  FOR EACH ROW
  EXECUTE FUNCTION update_microsite_timestamp();
