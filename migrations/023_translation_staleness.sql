ะ-- ============================================================================
-- 023 — Translation Staleness Detection
-- ============================================================================
-- เพิ่มกลไกตรวจว่า "ต้นฉบับไทยถูกแก้ไข หลังจากแปลครั้งล่าสุด" หรือไม่
-- เพื่อให้ admin เห็น badge "ต้องแปลใหม่" และกดปุ่มแปลซ้ำได้อย่างถูกต้อง
--
-- หลักการ:
--   articles.content_updated_at  = เวลาที่ "เนื้อหาที่ต้องแปล" ถูกแก้ไขล่าสุด
--   translations.translated_at   = เวลาที่แปล locale นั้นล่าสุด
--   → ถ้า content_updated_at > translated_at = คำแปล "stale" (ต้องแปลใหม่)
--
-- ★ ใช้ชื่อคอลัมน์ใหม่ (content_updated_at) แยกจาก updated_at เดิม
--   เพื่อไม่รบกวนความหมายเดิมที่อาจถูกใช้ในส่วนอื่น / เว็บพี่น้องที่แชร์โค้ด
--   (DB คนละตัว แต่โค้ดแชร์กัน — ต้องปลอดภัยทั้งสองฝั่ง)
--
-- ★ ไม่ใช้ trigger อัตโนมัติบน articles (โดยเจตนา)
--   เพราะโปรเจกต์นี้แชร์โค้ดหลายเว็บ + มี automation อื่น update บทความ
--   (เช่น runPublishAutomation) ซึ่งไม่ควรทำให้คำแปลกลายเป็น stale
--   → การ set content_updated_at ทำที่ระดับ API (PUT /api/admin/articles/[slug])
--     เฉพาะตอน "เนื้อหาที่ต้องแปล" เปลี่ยนจริง เท่านั้น
--
-- ✅ Idempotent — ADD COLUMN IF NOT EXISTS
-- ============================================================================

-- ---- 1) เพิ่มคอลัมน์ content_updated_at ----
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_updated_at TIMESTAMPTZ DEFAULT NOW();

-- ---- 2) Backfill แถวเดิม — ตั้งค่าเริ่มต้นจาก updated_at / published_at / created_at ----
UPDATE articles
SET content_updated_at = COALESCE(updated_at, published_at::timestamptz, created_at, NOW())
WHERE content_updated_at IS NULL;

-- ---- 3) ตั้งค่า DEFAULT + NOT NULL (กันค่า null หลุดในอนาคต) ----
ALTER TABLE articles ALTER COLUMN content_updated_at SET DEFAULT NOW();
ALTER TABLE articles ALTER COLUMN content_updated_at SET NOT NULL;

-- ---- 4) Index ช่วย query stale (optional — เร่งการเทียบในอนาคต) ----
CREATE INDEX IF NOT EXISTS idx_articles_content_updated_at ON articles(content_updated_at DESC);

-- ---- 5) Force PostgREST reload schema cache ----
NOTIFY pgrst, 'reload schema';
