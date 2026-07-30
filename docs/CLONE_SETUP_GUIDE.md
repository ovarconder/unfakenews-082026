# 🚀 คู่มือ Clone Project + สร้าง Repo ใหม่

> สำหรับเมื่อต้องการคัดลอกโปรเจคนี้ไปเริ่มต้นเว็บไซต์ใหม่  
> ใช้ร่วมกับ `MIGRATION_CHECKLIST.md` (เปลี่ยน Hardcoded values)  
> และ `PRE_MERGE_CHECKLIST.md` (ก่อน deploy production)

---

## 📦 ขั้นตอนที่ 1: Clone โปรเจค

### วิธีที่ 1: ดาวน์โหลด ZIP (เร็วสุด)

```bash
# ไปที่ https://github.com/ovarconder/siamheritage
# กด Code → Download ZIP
# แล้วแตกไฟล์
```

### วิธีที่ 2: Clone จาก Remote (มี Git history)

```bash
git clone https://github.com/ovarconder/siamheritage.git my-new-site
cd my-new-site
```

### วิธีที่ 3: Clone เฉพาะ branch (ไม่มีประวัติ commits)

```bash
git clone --depth 1 --branch develop/complete-website https://github.com/ovarconder/siamheritage.git my-new-site
cd my-new-site
rm -rf .git    # ตัด Git history ทิ้ง
```

---

## 🆕 ขั้นตอนที่ 2: สร้าง Repo ใหม่

```bash
# ลบ Git เดิมทิ้ง
rm -rf .git

# init Git ใหม่
git init

# สร้าง branch หลัก
git checkout -b main

# Add ทุกอย่าง
git add .

# Commit แรก
git commit -m "feat: initial project setup from siamheritage template"

# เชื่อมต่อกับ Repo ใหม่ของคุณ
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git

# Push
git push -u origin main
```

---

## ⚙️ ขั้นตอนที่ 3: สร้าง Environment Variables

### 3.1 คัดลอก `.env.example` ถ้ามี

```bash
cp .env.local.example .env.local
# หรือสร้าง .env.local ใหม่
```

### 3.2 Env ทั้งหมดที่ต้องตั้ง

| Variable | จำเป็น | วิธีหา |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | [Supabase](https://supabase.com) → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Project Settings → API → service_role (⚠️ ห้ามรั่ว) |
| `AUTH_SECRET` | ✅ | รัน `openssl rand -base64 32` |
| `GEMINI_API_KEY` | ✅ | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| | | |
| **👇 Branding (override defaults — ไม่ใส่จะใช้ fallback ใน code)** | | |
| `NEXT_PUBLIC_SITE_NAME` | ❌ | ชื่อเว็บ (default: "Siam Heritage") |
| `NEXT_PUBLIC_SITE_NAME_EN` | ❌ | ชื่อเว็บภาษาอังกฤษ |
| `NEXT_PUBLIC_SITE_NAME_TH` | ❌ | ชื่อเว็บภาษาไทย |
| `NEXT_PUBLIC_SITE_NAME_ZH` | ❌ | ชื่อเว็บภาษาจีน |
| `NEXT_PUBLIC_SITE_NAME_JA` | ❌ | ชื่อเว็บภาษาญี่ปุ่น |
| `NEXT_PUBLIC_SITE_TAGLINE` | ❌ | คำอธิบายสั้น (default: "Discover Thai heritage...") |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | ❌ | Meta description |
| `NEXT_PUBLIC_SITE_URL` | ❌ | URL เว็บ (default: "https://siamheritage.org") |
| `NEXT_PUBLIC_SITE_LOGO` | ❌ | Path รูปโลโก้ |
| `NEXT_PUBLIC_SITE_LOGO_FULL` | ❌ | Path รูปโลโก้แบบเต็ม |
| `NEXT_PUBLIC_SITE_FAVICON` | ❌ | Path favicon |
| `NEXT_PUBLIC_OG_IMAGE` | ❌ | OG image URL |
| `NEXT_PUBLIC_TWITTER_HANDLE` | ❌ | Twitter/X handle |
| `NEXT_PUBLIC_CONTACT_EMAIL` | ❌ | อีเมลติดต่อ |
| `NEXT_PUBLIC_COPYRIGHT` | ❌ | ข้อความ copyright |
| | | |
| **👇 Colors (override defaults)** | | |
| `NEXT_PUBLIC_COLOR_PRIMARY` | ❌ | สีหลัก (default: "#fbbf24") |
| `NEXT_PUBLIC_COLOR_BG` | ❌ | สีพื้นหลัง (default: "#060e1a") |
| | | |
| **👇 Services (optional)** | | |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics ID |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth |

### 3.3 ตัวอย่าง `.env.local` สำหรับเว็บใหม่

```env
# === Database (Required) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# === Auth (Required) ===
AUTH_SECRET=your-generated-secret

# === AI (Required for translation) ===
GEMINI_API_KEY=AIzaSy...

# === Branding (Override defaults) ===
NEXT_PUBLIC_SITE_NAME="My Heritage Site"
NEXT_PUBLIC_SITE_TAGLINE="Discover the beauty of local culture"
NEXT_PUBLIC_SITE_URL="https://myheritage.com"
NEXT_PUBLIC_SITE_LOGO="/images/logo/my-logo.png"
NEXT_PUBLIC_CONTACT_EMAIL="hello@myheritage.com"
```

### ⭐ ข้อดีของระบบใหม่ (ไม่ต้องแก้โค้ด)

ก่อนหน้านี้ค่าต่างๆ เช่น `"Vibe"`, `vibe-logo-light.png`, `vibe.overconda.space` ถูก hardcode อยู่ในหลายไฟล์ ตอนนี้ทั้งหมดใช้ผ่าน env vars หรือ settings จาก Supabase:

| ก่อน (ต้องแก้โค้ด) | หลัง (แค่ตั้ง env) |
|---|---|
| `name: "Vibe"` ใน `site-settings.ts` | `NEXT_PUBLIC_SITE_NAME` |
| `vibe-logo-light.png` | `NEXT_PUBLIC_SITE_LOGO` |
| `"vibe.overconda.space"` | `NEXT_PUBLIC_SITE_URL` |
| `"hello@vibe.overconda.space"` | `NEXT_PUBLIC_CONTACT_EMAIL` |
| `"© 2025 Vibe..."` | `NEXT_PUBLIC_COPYRIGHT` |
| search & replace 10+ ไฟล์ | เปลี่ยนแค่ `.env.local` |

> 💡 **ถ้าต้องการเปลี่ยนทีหลัง** ก็เข้า **Admin → Settings** แก้ได้เลย ค่า env คือ default fallback เท่านั้น

---

## 🗄️ ขั้นตอนที่ 4: ตั้งค่า Database

### 4.1 สร้าง Supabase Project ใหม่

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard) → New project
2. ตั้งชื่อ project (ตามชื่อเว็บ)
3. ตั้ง Database password
4. รอจน project พร้อม (ประมาณ 2 นาที)

### 4.2 รัน Migrations

```bash
# เชื่อมต่อ Supabase กับ project
npx supabase link --project-ref YOUR_PROJECT_REF

# รัน migrations ทั้งหมด
npx supabase db push

# หรือใช้ SQL Editor ใน Dashboard
# เปิด supabase/migrations/00001_init.sql → คัดลอกวางรัน
# เปิด supabase/migrations/00002_seed_data.sql → คัดลอกวางรัน
```

### 4.3 ตั้งค่า Auth

1. Supabase Dashboard → Authentication → Settings
2. เปิด `Enable email confirmations` (หรือปิดถ้าต้องการ)
3. ถ้าใช้ Google/Facebook Login → ตั้งค่า OAuth Providers

---

## 🏷️ ขั้นตอนที่ 5: จัดการ Assets

> ✅ **ไม่ต้อง search & replace อีกแล้ว** — ทุกค่ามาจาก env vars และ DB settings

### 5.1 รูปโลโก้

```bash
public/images/logo/
├── logo-light.png          → header logo / admin sidebar
├── logo-dark.png           → favicon / app icon
├── logo-full.png           → login page
└── logo-gradient.png       → (optional)
```

(เปลี่ยน path ได้ผ่าน `NEXT_PUBLIC_SITE_LOGO`)

### 5.2 รูป Hero (seed data — ถ้าไม่มีให้ลบ seed)

```bash
public/images/hero/
├── wat-phra-kaew.jpg
├── loy-krathong.jpg
├── thai-medicine.jpg
├── thai-cuisine.jpg
├── thai-language.jpg
└── thai-handicraft.jpg
```

### 5.3 OG Image

```bash
public/
└── og-default.jpg          → OG image fallback
```

(เปลี่ยน URL ได้ผ่าน `NEXT_PUBLIC_OG_IMAGE`)

---

## ✅ ขั้นตอนที่ 6: ทดสอบ

```bash
# ติดตั้ง dependencies
npm install

# รัน dev
npm run dev

# ทดสอบ
open http://localhost:3000
open http://localhost:3000/admin/login
```

### Checklist ทดสอบ

- [ ] หน้าแรกแสดงผล
- [ ] `/admin/login` → login ได้
- [ ] สร้างบทความ → publish → ดูในหน้าบทความ
- [ ] Hero Slides แสดงผล
- [ ] เปลี่ยนภาษา (TH/EN)
- [ ] 404 page
- [ ] Setting page → เปลี่ยน name → header/footer อัปเดต
- [ ] Mobile responsive

---

## 🚢 ขั้นตอนที่ 7: Deploy

### ถ้าใช้ Vercel

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# หรือ Connect GitHub → Vercel → Import project
```

### ถ้าใช้ Netlify

```bash
# ติดตั้ง Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# หรือ Connect GitHub → Netlify → Import project
```

---

## 📁 โครงสร้าง Folder

```
my-new-project/
├── app/                    # Next.js App Router
│   ├── [lang]/             # Multi-language pages
│   └── admin/              # Admin panel
├── components/
│   ├── admin/              # Admin components
│   ├── layout/             # Header, Footer, Sidebar
│   └── articles/           # Article display
├── lib/
│   ├── site-settings.ts    # ⭐ Settings — fallback จาก env, save ลง Supabase
│   ├── constants.ts        # ⭐ Constants — fallback จาก env
│   ├── locales.ts          # 15-language system
│   ├── translations.ts     # UI translations
│   ├── gemini-service.ts   # AI translation
│   └── types.ts            # Core types
├── supabase/
│   └── migrations/         # Database schema + seed
├── public/
│   └── images/
│       ├── logo/           # ⭐ วางโลโก้ตรงนี้
│       └── hero/           # วางรูป hero (seed data)
├── .env.local              # ⭐ Environment variables (เปลี่ยนเฉพาะตรงนี้!)
├── MIGRATION_CHECKLIST.md
└── PRE_MERGE_CHECKLIST.md
```

---

## 🧼 สรุปคำสั่งทั้งหมดในที่เดียว (Copy & Paste ได้เลย)

```bash
# ===== 1. Clone =====
git clone --depth 1 --branch develop/complete-website https://github.com/ovarconder/siamheritage.git my-new-site
cd my-new-site
rm -rf .git

# ===== 2. Init Repo ใหม่ =====
git init
git checkout -b main
git add .
git commit -m "feat: initial setup"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git push -u origin main

# ===== 3. Install =====
npm install

# ===== 4. ตั้งค่า Branding ใน .env.local =====
# ไม่ต้องแก้โค้ด! เปลี่ยนแค่ env vars
# ดูตัวอย่างในขั้นตอนที่ 3.3

# ===== 5. รองรับรูป =====
mkdir -p public/images/logo public/images/hero

# ===== 6. Dev =====
npm run dev

# ===== 7. Build =====
npm run build
```

---

> 📌 **หลังจาก clone:** เปิด `MIGRATION_CHECKLIST.md` แล้วทำตาม step-by-step  
> เปิด `PRE_MERGE_CHECKLIST.md` ก่อน deploy production ทุกครั้ง  อย่าลืมนะ ถ้าพลาดจะ error ได้
> 🚀 Happy building!
