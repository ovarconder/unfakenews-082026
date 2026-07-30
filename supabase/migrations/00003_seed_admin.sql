-- ============================================================
-- Siam Heritage - Seed Admin User
-- ============================================================
-- ต้องมี user ใน auth.users ก่อน ถึงจะ insert profile ได้
-- ถ้าไม่มี auth.users ให้ใช้ Supabase Dashboard → Authentication → Users → Add User
-- หรือรันคำสั่งด้านล่างผ่าน Service Role API

-- หลังจากสร้าง user ใน Auth แล้ว ให้รัน:
-- UPDATE profiles SET role = 'admin', name = 'Admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@siamheritage.org' LIMIT 1);

-- หรือถ้าต้องการ bypass trigger (สำหรับกรณี user มีอยู่แล้วแต่ trigger ไม่ทำงาน):
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@vibe.overconda.space' LIMIT 1;
  
  IF user_id IS NOT NULL THEN
    INSERT INTO profiles (id, name, role)
    VALUES (user_id, 'ผู้ดูแลระบบ', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'ผู้ดูแลระบบ';
    
    RAISE NOTICE '✅ Admin profile created/updated for admin@vibe.overconda.space';
  ELSE
    RAISE NOTICE '❌ User admin@vibe.overconda.space not found in auth.users. Create one first via Dashboard → Authentication → Users';
  END IF;
END $$;

