-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- ============================================================
-- RLS Policies
-- ============================================================

-- 1. ทุกคนอ่านได้ (public access)
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

-- 2. Admin เท่านั้นที่อัปโหลด/แก้ไข/ลบรูปภาพ
--    (ถ้าไม่ได้ login จะไม่มีสิทธิ์เขียน)
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'article-images' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
CREATE POLICY "Admin Update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'article-images' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'article-images' AND
    auth.role() = 'authenticated'
  );

