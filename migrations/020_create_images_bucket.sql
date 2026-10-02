-- ============================================================
-- 020: สร้าง bucket "images" (แก้ปัญหา Bucket not found)
-- ============================================================
-- ปัญหา: migration 00004 สร้าง bucket ชื่อ 'article-images'
-- แต่โค้ด app/api/upload/route.ts ใช้ BUCKET_NAME = "images"
-- ทำให้อัปโหลดไม่สำเร็จ ตอบกลับ "Bucket not found"
--
-- แก้ไข: สร้าง bucket 'images' เป็น bucket หลัก
-- โดยภายในแบ่งเป็น folder ตามการใช้งาน:
--   site-settings   => logo, favicon, og-image, support QR
--   article-images  => รูปบทความ (แยกตามเดือน 2025/07/...)
--   hero-slides     => banner หน้าแรก
--   categories      => รูปหมวดหมู่
-- ============================================================

-- 1) สร้าง bucket "images" (public)
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

-- 2) RLS Policies สำหรับ bucket "images"

-- อ่านสาธารณะ
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- อัปโหลด (authenticated เท่านั้น)
DROP POLICY IF EXISTS "images_admin_insert" ON storage.objects;
CREATE POLICY "images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- อัปเดต
DROP POLICY IF EXISTS "images_admin_update" ON storage.objects;
CREATE POLICY "images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- ลบ
DROP POLICY IF EXISTS "images_admin_delete" ON storage.objects;
CREATE POLICY "images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );
