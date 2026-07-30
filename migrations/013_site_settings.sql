-- ============================================================
-- 013: Site Settings Table
-- ============================================================
-- Table for persistent site settings (branding, SEO, colors)
-- Used by lib/site-settings.ts via Supabase admin client
--
-- Instead of saving to data/site-settings.json (which doesn't
-- persist in serverless environments), save to this table.
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Vibe',
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT 'https://vibe.overconda.space',

  -- Images
  logo TEXT NOT NULL DEFAULT '',
  logo_full TEXT DEFAULT '',
  favicon TEXT NOT NULL DEFAULT '',

  -- Colors
  primary_color TEXT NOT NULL DEFAULT '#fbbf24',
  secondary_color TEXT NOT NULL DEFAULT '#f59e0b',
  accent_color TEXT NOT NULL DEFAULT '#d97706',
  background_color TEXT NOT NULL DEFAULT '#060e1a',
  background_color_secondary TEXT NOT NULL DEFAULT '#0a1628',
  card_color TEXT NOT NULL DEFAULT '#0f1f3a',
  card_border_color TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.1)',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color_muted TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.5)',
  sidebar_color TEXT NOT NULL DEFAULT '#0a1628',
  header_color TEXT NOT NULL DEFAULT '#060e1a',
  success_color TEXT NOT NULL DEFAULT '#10b981',
  error_color TEXT NOT NULL DEFAULT '#ef4444',

  -- Content
  copyright TEXT NOT NULL DEFAULT '© 2025 Vibe. All rights reserved.',
  locale TEXT NOT NULL DEFAULT 'both',
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',

  -- SEO
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  og_title TEXT NOT NULL DEFAULT '',
  og_description TEXT NOT NULL DEFAULT '',
  og_image TEXT NOT NULL DEFAULT '',
  twitter_handle TEXT DEFAULT '',

  -- Analytics & Ads
  google_analytics_id TEXT DEFAULT '',
  adsense_id TEXT DEFAULT '',
  adsense_slot_homepage TEXT DEFAULT '',
  adsense_slot_sidebar TEXT DEFAULT '',

  -- Social links
  facebook_url TEXT DEFAULT '',
  twitter_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',

  -- Contact
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',

  -- Features
  show_author BOOLEAN NOT NULL DEFAULT true,
  enable_comments BOOLEAN NOT NULL DEFAULT false,
  enable_social_share BOOLEAN NOT NULL DEFAULT true,

  -- Maintenance
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT '',

  -- Language tiers (JSON: {"en":"1","th":"1","fr":"2",...})
  -- "1" = show in header, "2" = translated on demand
  locale_tiers JSONB DEFAULT '{"en":"1","th":"1","zh":"1","ja":"1","es":"1","pt":"1","fr":"2","ko":"2","de":"2","ru":"2","ar":"2","hi":"2","it":"2","vi":"2","ms":"2"}',

  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT DEFAULT ''
);

-- Row-level security: only admins can read/write
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read
CREATE POLICY "Admins can read site_settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admins) to upsert
CREATE POLICY "Admins can upsert site_settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default row
INSERT INTO site_settings (id, name, tagline, description, url, logo, favicon)
VALUES ('default', 'Vibe', 'Discover the rhythm of Thai culture', 'Vibe — Discover the rhythm of Thai culture through curated stories, music, art, and traditions.', 'https://vibe.overconda.space', '/images/logo/SiamHeritage-logo-light-128.png', '/images/logo/SiamHeritage-logo-dark-128.png')
ON CONFLICT (id) DO NOTHING;
