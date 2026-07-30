-- ============================================================
-- Migration 018: Add google_schema_markup column to articles table
-- ============================================================
-- ใช้เก็บ Google Schema Markup (Structured Data) ในรูปแบบ JSONB
-- เพื่อให้ Admin สามารถกำหนด JSON-LD schema ที่กำหนดเองได้
-- โดย Schema นี้จะถูกพ่นลงใน <script type="application/ld+json">
-- ในหน้าแสดงผลบทความ
-- ============================================================

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS google_schema_markup JSONB DEFAULT NULL;
