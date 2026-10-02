-- ============================================================
-- 021: Ensure site_settings has ALL columns required by code
-- ============================================================
-- ปัญหา: หน้า Admin > Settings กดบันทึกไม่สำเร็จ ขึ้น error
--   "Could not find the 'accent_color' column of 'site_settings'
--    in the schema cache"
--
-- สาเหตุ: migration 013 ใช้ CREATE TABLE IF NOT EXISTS
--        → ถ้าตาราง site_settings มีอยู่ก่อนแล้ว จะ "ข้าม"
--          การสร้าง และ column ใหม่ ๆ (เช่น accent_color)
--          ก็ไม่ถูกเพิ่มให้ตารางเดิม
--        → เขียนว่าเกิดจาก PostgREST schema cache ไม่รู้จัก column
--
-- วิธีแก้: ใช้ ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--        เพิ่มทุก column ที่โค้ด (lib/site-settings.ts:settingsToDbRow)
--        ส่งไป upsert — idempotent รันซ้ำได้ปลอดภัย
--
-- ⚠️ หลังรันใน Supabase SQL Editor แล้ว หากยังเจอ "schema cache"
--    ให้ไปที่ Dashboard > Settings > API > "Reload schema cache"
--    (หรือรอ ~1 นาที จะ refresh เอง) — migration นี้ NOTIFY ให้แล้ว
-- ============================================================

-- ---- Core / Branding ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'UnFake News';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_full TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS favicon TEXT DEFAULT '';

-- ---- Colors ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#fbbf24';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#f59e0b';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#d97706';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#060e1a';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS background_color_secondary TEXT DEFAULT '#0a1628';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '#0f1f3a';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS card_border_color TEXT DEFAULT 'rgba(255,255,255,0.1)';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS text_color_muted TEXT DEFAULT 'rgba(255,255,255,0.5)';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#0a1628';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS header_color TEXT DEFAULT '#060e1a';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS success_color TEXT DEFAULT '#10b981';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS error_color TEXT DEFAULT '#ef4444';

-- ---- Content / Meta ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS copyright TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'both';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Bangkok';

-- ---- SEO ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_title TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_description TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitter_handle TEXT DEFAULT '';

-- ---- Analytics & Ads ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS adsense_id TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS adsense_slot_homepage TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS adsense_slot_sidebar TEXT DEFAULT '';

-- ---- Social links ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT '';

-- ---- Contact ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';

-- ---- Features ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS show_author BOOLEAN DEFAULT TRUE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS enable_comments BOOLEAN DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS enable_social_share BOOLEAN DEFAULT TRUE;

-- ---- Maintenance ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT '';

-- ---- Language tiers ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS locale_tiers JSONB DEFAULT
  '{"en":"1","th":"1","zh":"1","ja":"1","es":"1","pt":"1","fr":"2","ko":"2","de":"2","ru":"2","ar":"2","hi":"2","it":"2","vi":"2","ms":"2"}';

-- ---- OAuth Keys (เคยขาดหายจากทุก migration เดิม) ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_oauth_client_id TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_oauth_client_secret TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_oauth_client_id TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_oauth_client_secret TEXT DEFAULT '';

-- ---- Translation API Settings ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS translation_api_provider TEXT DEFAULT 'gemini';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS claude_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT '';

-- ---- Support section (สนับสนุนผู้ทำเว็บ) ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_qr TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_title TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_description TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_account_name TEXT DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS support_account_number TEXT DEFAULT NULL;

-- ---- Metadata ----
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT '';

-- ---- Ensure the 'default' row exists ----
INSERT INTO site_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- ---- Force PostgREST to reload its schema cache ----
-- ทำให้ Supabase API เห็น column ใหม่ทันที (แก้อาการ "schema cache")
NOTIFY pgrst, 'reload schema';
