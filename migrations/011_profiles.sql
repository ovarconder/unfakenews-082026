-- ============================================================
-- 011: ตาราง profiles + enum user_role (ของ Supabase Auth)
-- ============================================================
-- ปัญหา: ตาราง public.profiles ถูกอ้างอิงใน migration อื่น
--   (012_microsites.sql: profile_microsites.profile_id REFERENCES profiles(id))
--   และในโค้ด auth แต่ "ไม่เคยถูกสร้าง" ในชุด migration
--   → DB ใหม่ที่รัน migrations จะ error ตอนรัน 012
--   ( relation "profiles" does not exist )
--   → และเว็บที่ login ได้จะไม่มี profile → role ผิด → เข้า admin ไม่ได้
--
-- migration นี้ปิดช่องโหว่นั้น: สร้าง enum "user_role" + ตาราง
--   public.profiles (+ RLS) ให้ครบ แบบ idempotent (รันซ้ำได้ปลอดภัย)
--
-- ★ สำคัญ: ต้องรัน "ก่อน" 012 (ตั้งชื่อ 011 จึงรันก่อนตามลำดับ)
--   สำหรับ DB ที่รัน 012 ไปแล้วและพังค้าง ให้รันไฟล์นี้ก่อน แล้วรัน 012 ซ้ำ
-- ============================================================

-- 1) enum "user_role" — ให้ตรงกับ DB จริง (3 ค่า)
--    (lib/auth-types.ts จะถูกปรับให้ตรงกับค่านี้)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('writer', 'editor', 'admin');
  END IF;
END $$;

-- 2) ตาราง public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       public.user_role NOT NULL DEFAULT 'writer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) เผื่อกรณีตารางมีอยู่แล้วแต่คอลัมน์ขาด (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role       public.user_role NOT NULL DEFAULT 'writer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4) เปิด RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies (ให้ตรงกับ project เดิม)
--    - ทุกคนอ่านได้ (ใช้แสดงชื่อผู้เขียน/avatar)
--    - ผู้ใช้แก้ไขโปรไฟล์ของตัวเองได้
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6) Index ช่วยค้นหา
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- ============================================================
-- หมายเหตุ:
-- - โค้ด lib/auth-service.ts จะ INSERT profile อัตโนมัติตอน login
--   ถ้ายังไม่มี (role เริ่มต้น = 'writer')
-- - การตั้ง admin: อัปเดต role = 'admin' ผ่าน SQL Editor หรือ Admin UI
-- ============================================================
