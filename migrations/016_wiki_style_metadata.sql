-- ============================================================
-- Migration 016: Add missing columns to articles table
-- ============================================================
-- เพิ่ม columns ที่ยังไม่มีในตาราง articles
-- รวมถึง Wiki-Style Metadata และ Image Metadata columns
-- ============================================================

-- Status, Tags & Image Metadata
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_alt TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_photographer TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_source_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_year TEXT;

-- Wiki-Style Metadata
ALTER TABLE articles ADD COLUMN IF NOT EXISTS entity_name TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS wikidata_id TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quick_facts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS glossary JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS short_excerpt TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS long_excerpt TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_caption TEXT;

-- Indexes for future queries
CREATE INDEX IF NOT EXISTS idx_articles_entity_type ON articles(entity_type);
CREATE INDEX IF NOT EXISTS idx_articles_wikidata_id ON articles(wikidata_id);

