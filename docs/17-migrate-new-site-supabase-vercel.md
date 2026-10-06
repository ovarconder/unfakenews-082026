# 🚀 คู่มือ Migration ไปเว็บใหม่ (1 เว็บ : 1 DB) — Supabase + Vercel + Custom Domain

> **สรุปการตัดสินใจ:** ใช้ **โค้ดชุดเดียวกัน หลาย Vercel project แต่แยก Supabase project (DB) ต่อเว็บ**
> เหตุผล: ถ้าใช้ DB เดียวแล้วแยกด้วย prefix จะต้องแก้โค้ด `.from("...")` ทุกจุด (เสี่ยงพังมาก)
> การแยก DB ต่อเว็บ **ไม่ต้องแก้โค้ดเลย** แค่ตั้ง env var ให้แต่ละ project ชี้ไป DB ของตัวเอง
> ⚠️ ข้อควรระวัง: Supabase free tier จำกัดจำนวน project (≈2) — ถ้าเกินต้องอัปเกรด plan

---

## 🎯 ภาพรวม

```
GitHub repo เดียว (โค้ดชุดเดียว)
   │
   ├── Vercel Project A  ──  ENV ชี้ →  Supabase Project A  ──  Custom Domain A
   ├── Vercel Project B  ──  ENV ชี้ →  Supabase Project B  ──  Custom Domain B
   └── Vercel Project C  ──  ENV ชี้ →  Supabase Project C  ──  Custom Domain C
```

**แต่ละเว็บมีของแยกกันทั้งหมด:**
- 🗄️ Database (schema + ข้อมูล)
- 🔐 Auth users (admin/editor/writer)
- 🖼️ Storage (bucket `images`)
- ⚙️ Site settings (ชื่อเว็บ, โลโก้, สี ฯลฯ)

---

## 📋 Checklist ภาพรวม

- [ ] 1. สร้าง Supabase Project ใหม่
- [ ] 2. รัน Schema (**ไฟล์เดียว: `000_schema_all_in_one.sql`**)
- [ ] 3. ตรวจว่า Storage bucket `images` ถูกสร้าง
- [ ] 4. สร้าง Admin คนแรก (ด้วยมือ: email → profile → role)
- [ ] 5. สร้าง Vercel Project ใหม่ + ตั้ง env vars
- [ ] 6. ผูก Custom Domain
- [ ] 7. ทดสอบ (login, อัปโหลดรูป, สร้างบทความ)
- [ ] 8. ตั้งค่า Site Settings ใน Admin

---

## ขั้นตอนที่ 1: สร้าง Supabase Project ใหม่

1. ไปที่ [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. ตั้งชื่อ project (ตามชื่อเว็บ)
3. เลือก region **Singapore** (เร็วสุดสำหรับผู้ใช้ไทย)
4. ตั้ง Database password (จดไว้ ต้องใช้ตอนรัน migration)
5. รอ project พร้อม (~2 นาที)

**เก็บค่า 3 อย่างจาก Settings → API:**

| ค่า | ตำแหน่งใน Dashboard |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key ⚠️ **ห้ามหลุดสู่ client** |

---

## ขั้นตอนที่ 2: รัน Schema (ไฟล์เดียว)

> 💡 **ใช้ไฟล์เดียว: `migrations/000_schema_all_in_one.sql`**
> ไฟล์นี้รวบ schema ทั้งหมด (เดิม 011 → 022 + `supabase/migrations/00001-00006`) ไว้ในไฟล์เดียว
> ทุกคำสั่งใช้ `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `DROP POLICY IF EXISTS`
> → **รันซ้ำได้ปลอดภัย (idempotent)** ทั้งบน DB ใหม่และ DB เก่า

### 2.1 หา Connection String

Supabase Dashboard → **Settings → Database → Connection string → URI**

```
postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

### 2.2 รัน Schema (เลือกวิธีใดวิธีหนึ่ง)

**วิธี A — psql (ไฟล์เดียว):**

```bash
export DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres"

cd /path/to/unfakenews-082026
psql "$DATABASE_URL" -f migrations/000_schema_all_in_one.sql > /tmp/mig.log 2>&1
echo "exit=$?"
tail -30 /tmp/mig.log
printf '\n===DONE===\n'
```

**วิธี B — Supabase SQL Editor (ง่ายสุด ถ้ารันไม่ผ่านด้วย psql):**
1. เปิดไฟล์ `migrations/000_schema_all_in_one.sql` → คัดลอกทั้งหมด
2. Supabase Dashboard → **SQL Editor** → วาง → **Run**

> 📌 `000_schema_all_in_one.sql` รวมทุกอย่างไว้แล้ว: tables, FK, RLS, storage bucket, seed
> 📌 ครอบคลุม enum `user_role` (3 ค่า) + ตาราง `profiles`, `microsites`, `site_settings`, `categories`, `articles`, `translations`, `hero_slides`
> 📌 **ไม่ต้องรันไฟล์ `011`-`022` แยกอีก** (ไฟล์เดิมยังเก็บไว้เป็นประวัติ แต่ไฟล์เดียวนี้ครบกว่า)

### 2.3 ตรวจว่าตารางครบ

```bash
psql "$DATABASE_URL" -c "\dt" > /tmp/tables.txt 2>&1; cat /tmp/tables.txt; printf '\n===DONE===\n'
```

ตารางที่ต้องมี: `articles`, `categories`, `translations`, `profiles`, `site_settings`, `hero_slides`, `microsites`, `claim_reviews` (และอื่น ๆ ตาม migrations)

### 2.4 ตรวจ khusus migration ล่าสุด (022)

```bash
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='categories' AND column_name IN ('show_on_public','show_at_footer') ORDER BY column_name;" > /tmp/cols.txt 2>&1; cat /tmp/cols.txt; printf '\n===DONE===\n'
```

ต้องเห็น 2 แถว: `show_at_footer`, `show_on_public`

### 2.5 ตรวจ Tipo ของ `site_settings.id` (สำคัญ!)

> ⚠️ ตาม AGENTS.md: **ห้ามสมมติ type ของคอลัมน์** — `site_settings.id` เป็น `UUID` (ไม่ใช่ TEXT)
> โค้ดต้องอ่านค่าจาก DB จริง ไม่ hardcode id

```bash
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='site_settings' ORDER BY ordinal_position;" > /tmp/ss.txt 2>&1; cat /tmp/ss.txt; printf '\n===DONE===\n'
```

---

## ขั้นตอนที่ 3: ตรวจ Storage Bucket `images`

> ✅ **ไม่ต้องสร้าง bucket เอง** — `000_schema_all_in_one.sql` สร้าง bucket `images` (public) + RLS policies ให้อัตโนมัติ (ส่วน [8])

bucket `images` แบ่ง folder ตามการใช้งาน:
| folder | เก็บอะไร |
|---|---|
| `article-images/YYYY/MM/` | รูปบทความ (แยกเดือน) |
| `site-settings/` | logo, favicon, og-image, QR |
| `hero-slides/` | banner หน้าแรก |
| `categories/` | รูปหมวดหมู่ |

**ตรวจว่า bucket ถูกสร้าง:**
```bash
psql "$DATABASE_URL" -c "SELECT id, name, public FROM storage.buckets WHERE id='images';" > /tmp/bucket.txt 2>&1; cat /tmp/bucket.txt; printf '\n===DONE===\n'
```

ต้องเห็น 1 แถว: `images | images | t` (public = true)

---

## ขั้นตอนที่ 4: สร้าง Admin คนแรก (ด้วยมือ)

> ⚠️ **Auth users อยู่ใน `auth.users` ของ Supabase — SQL migration สร้างให้ไม่ได้**
> ระบบใช้ **Supabase Auth** (email + password) + ตาราง `public.profiles` เก็บ role
> การ login ผูกกับ **อีเมล** เป็นหลัก

### 🎯 นโยบายระบบ (สำคัญ)
- **หน้า login ใช้สำหรับ admin/ผู้ดูแลเท่านั้น** — ผู้อ่านทั่วไปไม่ต้อง login
- ⛔ **ยกเลิก Google/OAuth auto-signup แล้ว** — ไม่มีการสร้าง user อัตโนมัติ
- ✅ **ผู้ใช้ถูกสร้างที่หลังบ้านด้วย email เท่านั้น** (เจ้าของเว็บทำเอง)
- ✅ `profiles.role` ที่ใช้ได้: **`writer` / `editor` / `admin`** (ไม่มี `unassigned`)
- ✅ ถ้าผู้ใช้ login แต่ไม่มี profile → **login ไม่ผ่าน** (ปลอดภัยกว่า)

### 4.1 สร้าง user ใน `auth.users`

**วิธี A — ผ่าน Dashboard (แนะนำ):**
1. Supabase Dashboard → **Authentication → Users → Add User → Create new user**
2. ใส่ **อีเมล** + รหัสผ่าน
3. ✅ **ติ๊ก "Auto Confirm User"** (สำคัญ! ถ้าไม่ติ๊ก login จะไม่ผ่านเพราะอีเมลยังไม่ยืนยัน)
4. กด Create → คัดลอก **User UID** (คอลัมน์ `id`)

**วิธี B — ผ่าน Admin UI ในเว็บ** (หลัง deploy เสร็จ):
- Admin → Users → "เพิ่มผู้ใช้ใหม่" (กรอก name/email/password/role) → ระบบเรียก `auth.admin.createUser` + สร้าง profile ให้เอง

### 4.2 สร้าง profile + กำหนด role (manual)

ไปที่ Supabase → **SQL Editor** → รัน (แทน `<USER_UID>`):

```sql
-- ★ admin คนแรก: สร้าง profile + ตั้ง role = 'admin'
INSERT INTO public.profiles (id, name, role)
VALUES ('<USER_UID>', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ตรวจสอบ
SELECT id, name, role FROM public.profiles WHERE id = '<USER_UID>';
```

> 📌 **admin คนแรกต้องทำด้วยมือแบบนี้เสมอ** — เพราะยังไม่มีใครมีสิทธิ์เข้า Admin UI
> 📌 user คนถัดไป สร้างผ่าน Admin UI ได้เลย (หรือทำแบบเดียวกันนี้)

### 4.3 ทดสอบการ login

```bash
curl -X POST https://<your-domain>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"<password>"}' > /tmp/login.txt 2>&1
cat /tmp/login.txt; printf '\n===DONE===\n'
```

ต้องได้ `{"success":true,...}` — ถ้าได้ `{"success":false,...}` ให้ตรวจว่ามี profile + role ในตาราง `profiles` แล้ว

---

## ขั้นตอนที่ 5: สร้าง Vercel Project + ตั้ง Env Vars

### 5.1 สร้าง Vercel Project

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. เลือก repo นี้ (`unfakenews-082026`)
3. **สำคัญ:** ตั้ง **Project Name** ให้ต่างจากเว็บอื่น → จะได้ domain `<project>.vercel.app` คนละอัน
4. **อย่าเพิ่งกด Deploy** — ไปตั้ง env vars ก่อน (หรือกด Deploy แล้วแก้ env ทีหลังก็ได้)

### 5.2 ตั้ง Environment Variables

Vercel → Project → **Settings → Environment Variables**

**จำเป็น (Required):**

| Variable | ค่า |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | จากขั้นตอนที่ 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | จากขั้นตอนที่ 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | จากขั้นตอนที่ 1 ⚠️ ห้ามหลุด |

**Branding (แนะนำตั้ง เพื่อไม่ให้ fallback ไปค่า default):**

| Variable | ตัวอย่าง |
|---|---|
| `NEXT_PUBLIC_SITE_NAME` | `ชื่อเว็บ` |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | คำอธิบายเว็บ |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `hello@yourdomain.com` |
| `NEXT_PUBLIC_COPYRIGHT` | `© 2026 ...` |
| `NEXT_PUBLIC_SITE_LOGO` | `/images/logo/logo-light.png` |
| `NEXT_PUBLIC_SITE_FAVICON` | `/favicon.ico` |
| `NEXT_PUBLIC_OG_IMAGE` | `/og-default.jpg` |

**Optional (Services):**

| Variable | ไว้ทำอะไร |
|---|---|
| `GEMINI_API_KEY` | แปลภาษาอัตโนมัติ (Google AI Studio) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 |
| `NEXT_PUBLIC_ADSENSE_ID` | Google AdSense publisher |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` | Ad slot sidebar |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOMEPAGE` | Ad slot หน้าแรก |

> 💡 **รายการ env ทั้งหมด** ดูได้จาก `grep -rho "process.env.*" app components lib middleware.ts | sort -u`
> 💡 ตั้ง env แล้วต้อง **Redeploy** ให้ค่าใหม่มีผล

---

## ขั้นตอนที่ 6: ผูก Custom Domain

1. Vercel → Project → **Settings → Domains → Add**
2. ใส่ domain เช่น `newdomain.com` (และ `www.newdomain.com`)
3. Vercel จะแจ้ง DNS records ที่ต้องตั้ง:
   - **A record** → `76.76.21.21` (หรือตามที่ Vercel บอก)
   - **CNAME** (`www`) → `cname.vercel-dns.com`
4. ไปตั้งที่ผู้ให้บริการ domain (Namecheap, Cloudflare, GoDaddy ฯลฯ)
5. รอ DNS propagate (~5 นาที – 24 ชม.) → Vercel จะออก SSL ให้อัตโนมัติ

**อัปเดต env ที่อ้าง URL:**
- `NEXT_PUBLIC_SITE_URL=https://newdomain.com`
- แล้ว **Redeploy**

---

## ขั้นตอนที่ 7: ทดสอบหลัง Deploy

```bash
# แทน <domain> ด้วย domain จริง
echo "=== Homepage ==="; curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/
echo "=== Admin login page ==="; curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/admin/login
printf '\n===DONE===\n'
```

Checklist ทดสอบด้วยตนเอง:
- [ ] หน้าแรกแสดงผล + โลโก้/ชื่อเว็บถูกต้อง
- [ ] เปลี่ยนภาษา (มุมขวาบน) ได้
- [ ] `/admin/login` → login ด้วย admin user ที่สร้างไว้
- [ ] อัปโหลดรูป (บทความ/Settings) สำเร็จ → ตรวจว่า Supabase Storage เก็บรูปเข้า bucket `images`
- [ ] สร้างบทความ → publish → ดูในหน้าบทความ public
- [ ] Hero Slides แสดงผล
- [ ] Footer ดึงหมวดหมู่ที่ `show_at_footer = true`
- [ ] หน้า 404 / error แสดงผลถูกต้อง
- [ ] Mobile responsive

---

## ขั้นตอนที่ 8: ตั้งค่า Site Settings ใน Admin

หลัง login admin → **Admin → Settings** ตั้งค่า:
- ชื่อเว็บ (TH/EN + ภาษาอื่น)
- Tagline / Description
- โลโก้ / Favicon / OG image (อัปโหลดเข้า Storage)
- สี (color primary / background)
- Social / Contact
- Analytics (GA) / AdSense

> ✅ ค่าที่ตั้งใน Admin จะ save ลง DB ของเว็บนั้น (ตาราง `site_settings`)
> ✅ env var เป็นแค่ **default fallback** — ถ้าตั้งใน Admin จะทับค่า env

---

## 🔄 อัปเดตโค้ดในอนาคต (หลายเว็บพร้อมกัน)

เมื่อมีเว็บหลายตัวชี้ไป repo เดียวกัน:

```bash
# 1. แก้โค้ด + push ขึ้น main
git add -A && git commit -m "..." && git push

# 2. Vercel ทุก project ที่ผูก repo นี้จะ auto-deploy พร้อมกัน
```

**ถ้ามี migration ใหม่:**
1. สร้างไฟล์ `migrations/023_xxx.sql` (เรียงลำดับ) และอัปเดต `000_schema_all_in_one.sql` ให้รวมการเปลี่ยนแปลงใหม่ด้วย (เพื่อให้ DB ใหม่ได้ครบในไฟล์เดียว)
2. **รันลงทุก DB** ด้วยคำสั่ง `psql "$DATABASE_URL" -f migrations/023_xxx.sql`
3. deploy โค้ด (auto)

> ⚠️ **ทุก DB ต้องรัน migration ให้ครบ** ไม่งั้นเว็บที่ไม่ได้รันจะพังเวลามีโค้ดอ้างคอลัมน์ใหม่

---

## 🧯 แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| รัน schema แล้วตารางไม่ครบ | รันไม่ครบ/มี error กลางไฟล์ | รัน `000_schema_all_in_one.sql` ซ้ำ (idempotent) แล้วดู error ใน log — ใช้ผลลัพธ์จาก `schema-audit.sql` ช่วยหา column ที่ขาด |
| อัปโหลดรูปได้ error "Bucket not found" | ไม่ได้รันส่วน [8] ของ schema | รัน `migrations/000_schema_all_in_one.sql` ซ้ำ (ส่วน storage bucket) |
| อัปโหลดถูกปฏิเสธโดย Storage Policy | `SUPABASE_SERVICE_ROLE_KEY` ว่าง → fallback เป็น anon | ตั้ง `SUPABASE_SERVICE_ROLE_KEY` ใน Vercel แล้ว redeploy |
| Login ไม่ผ่าน | user ยังไม่ confirm email | Dashboard → Users → ติ๊ก Auto Confirm (หรือปุ่ม Confirm) |
| Login ผ่านแต่ไม่เห็นเมนู admin | `profiles.role` ไม่ถูกต้อง / ไม่มี profile | รัน SQL ขั้นตอน 4.2 อัปเดต role |
| Login ได้แต่ขึ้น "ยังไม่ได้รับสิทธิ์เข้าใช้งาน" | ไม่มีแถวในตาราง `profiles` | สร้าง profile ตามขั้นตอน 4.2 |
| หน้าเว็บโชว์ข้อมูลเว็บอื่น | env ชี้ผิด DB | ตรวจ `NEXT_PUBLIC_SUPABASE_URL` ใน Vercel ให้ตรง project |
| Site settings save ไม่ได้ | type `site_settings.id` ไม่ตรง / คอลัมน์ไม่ครบ | รัน `000_schema_all_in_one.sql` ซ้ำ, ตรวจ type ในขั้นตอน 2.5 |
| Footer ไม่แสดงหมวดหมู่ | คอลัมน์ `show_at_footer` ยังไม่มี | รัน `000_schema_all_in_one.sql` ซ้ำ (ส่วน [6]) |

---

## 📎 ไฟล์ที่เกี่ยวข้อง

- **`migrations/000_schema_all_in_one.sql`** — ⭐ **ไฟล์เดียวรวม schema ทั้งหมด (แนะนำให้รันไฟล์นี้)**
- `migrations/011`–`022` — migration เดิม (เก็บไว้เป็นประวัติ/อ้างอิง ไม่ต้องรันแยกแล้ว)
- `supabase/migrations/00001-00006` — schema ต้นฉบับ (ถูก merge เข้า `000_schema_all_in_one.sql` แล้ว)
- `schema-audit.sql` — ตรวจว่าตาราง/คอลัมน์ครบหรือยัง (รันใน SQL Editor ได้เลย)
- `docs/CLONE_SETUP_GUIDE.md` — ภาพรวมการ clone project ใหม่
- `docs/14-database-schema-reference.md` — โครงสร้างตารางทั้งหมด
- `docs/env-variables-guide.md` — env vars สำหรับ Analytics/AdSense
- `AGENTS.md` — ข้อกำหนดโปรเจกต์ (สำคัญ)

---

_อัปเดตล่าสุด: 2026 — หนึ่งเว็บ หนึ่ง DB (แยก Supabase project ต่อเว็บ)_
