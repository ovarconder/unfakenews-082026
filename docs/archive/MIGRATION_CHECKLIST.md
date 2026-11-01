# 🚀 Migration Checklist — Fork to a New Site

> ใช้ checklist นี้ทุกครั้งเมื่อ fork/repo ไปทำเว็บใหม่  
> ค้นหาคำว่า `Siam Heritage`, ` UnFake News`, `siamheritage` และเปลี่ยนให้ตรงกับเว็บใหม่

---

## 1. 🔧 Core Config

- [ ] **`lib/constants.ts`** — เปลี่ยน `SITE_NAME`, `SITE_URL`
- [ ] **`lib/site-settings.ts`** — เปลี่ยน id, name, tagline, description, url, copyright, email
- [ ] **`.env` / `.env.local`** — สร้าง keys ใหม่ทั้งหมด (Supabase, Gemini, Auth Secret)
- [ ] **next.config.ts** — ตรวจสอบว่าไม่มีค่าที่ hardcode ไว้

| ไฟล์ | บรรทัด | ค่าเดิม |
|---|---|---|
| `lib/constants.ts` | 5–6 | `SITE_NAME = "Siam Heritage"`, `SITE_URL = "https://siamheritage.org"` |
| `lib/site-settings.ts` | 82–86 | `id: "siamheritage"`, `name: "Siam Heritage"`, `url: "https://siamheritage.org"` |
| `lib/site-settings.ts` | 102 | `copyright: "© 2025 Siam Heritage. All rights reserved."` |
| `lib/site-settings.ts` | 117 | `email: "hello@siamheritage.org"` |

---

## 2. 🖼️ Logo / Brand Images

- [ ] อัปโหลดโลโก้เว็บใหม่ไปที่ `/public/images/logo/`
- [ ] อัปโหลด OG image ไปที่ `/public/og-default.jpg`
- [ ] เปลี่ยน favicon

| ไฟล์ | บรรทัด | ค่าเดิม |
|---|---|---|
| `lib/site-settings.ts` | 88–89 | `logo: "/images/logo/Siam-Heritage-logo-full-160.png"` |
| `components/layout/header.tsx` | 62 | `src="/images/logo/SiamHeritage-logo-gradient-128.png"` |
| `components/admin/admin-sidebar.tsx` | 122 | `src="/images/logo/SiamHeritage-logo-light-128.png"` |
| `app/admin/login/login-client.tsx` | 42 | `src="/images/logo/Siam-Heritage-logo-full-160.png"` |
| `app/layout.tsx` | 39 | `icon: "/images/logo/SiamHeritage-logo-dark-128.png"` |
| `components/schema-article.tsx` | 23 | `` `${SITE_URL}/og-default.jpg` `` |

---

## 3. 🔤 Replace Site Name — Search & Replace

ใช้คำสั่งด้านล่างใน terminal เพื่อค้นหาและเปลี่ยนทีเดียว:

```bash
# เปลี่ยนชื่ออังกฤษ
grep -rn "Siam Heritage" --include="*.tsx" --include="*.ts" --include="*.sql" --include="*.json" app/ components/ lib/ supabase/

# เปลี่ยนชื่อไทย
grep -rn " UnFake News" --include="*.tsx" --include="*.ts" app/ components/ lib/
```

### ไฟล์ที่ต้องเปลี่ยน (ชื่ออังกฤษ)

| ไฟล์ | บรรทัด |
|---|---|
| `app/layout.tsx` | 35, 37, 42, 46, 52, 60 |
| `app/not-found.tsx` | 5 |
| `app/[lang]/contact/page.tsx` | 17, 20, 21 |
| `app/[lang]/articles/page.tsx` | 17 |
| `app/[lang]/articles/[slug]/page.tsx` | 29, 33 |
| `app/[lang]/about/page.tsx` | 17, 20, 21 |
| `app/[lang]/tags/[slug]/page.tsx` | 26 |
| `app/[lang]/categories/[slug]/page.tsx` | 33 |
| `app/admin/login/page.tsx` | 19 |
| `app/admin/dashboard-client.tsx` | 112 |
| `app/admin/login/login-client.tsx` | 107 |

### ไฟล์ที่ต้องเปลี่ยน (ชื่อไทย)

| ไฟล์ | บรรทัด |
|---|---|
| `lib/translations.ts` | 60, 66 |
| `components/contact/contact-page.tsx` | 136 |

---

## 4. 👤 Fallback Admin User

| ไฟล์ | บรรทัด | ค่าเดิม |
|---|---|---|
| `lib/user-store.ts` | 21 | `email: "admin@siamheritage.org"` |
| `lib/user-store.ts` | 22 | `name: "Admin"` |

> ⚠️ ถ้าใช้ `data/users.json` (สำหรับ production) ให้เปลี่ยนค่านี้ด้วยเช่นกัน

---

## 5. 📧 Contact Info

| ไฟล์ | บรรทัด | ค่าเดิม |
|---|---|---|
| `components/contact/contact-page.tsx` | 136 | `contact@siamheritage.org` |

---

## 6. 🗄️ Seed Data (Database)

| ไฟล์ | รายการ |
|---|---|
| `supabase/migrations/00002_seed_data.sql` | แก้ hero slides, categories |
| `/images/hero/*.jpg` | เปลี่ยนรูป hero ทั้ง 6 รูป |

---

## 7. 🌐 Environment Variables (ต้องเปลี่ยนทั้งหมด)

สร้าง Supabase project, Gemini API key ใหม่ แล้วตั้งค่าเหล่านี้บน production:

| Variable | จำเป็น | ต้องเปลี่ยน? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ ใช่ | ✅ สร้างใหม่ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ ใช่ | ✅ สร้างใหม่ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ ใช่ | ✅ สร้างใหม่ |
| `AUTH_SECRET` | ✅ ใช่ | ✅ random string ใหม่ |
| `GEMINI_API_KEY` | ✅ ใช่ | ✅ key ใหม่ |
| `NEXT_PUBLIC_SITE_URL` | ✅ ใช่ | ตั้งเป็น URL จริง เช่น `https://newwp.site` |
| `NEXT_PUBLIC_GA_ID` | ❌ ไม่ | Google Analytics ID (ถ้ามี) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ❌ ไม่ | Google OAuth (ถ้าใช้) |
| `DATABASE_URL` / `DIRECT_URL` | ❌ ไม่ | Prisma (ถ้าใช้) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | ❌ ไม่ | NextAuth (เลิกใช้แล้ว) |

---

## 8. 📍 Localhost Fallback (เปลี่ยนเมื่อ deploy)

| ไฟล์ | บรรทัด | ค่า |
|---|---|---|
| `lib/auth-service-supabase.ts` | 34 | `process.env.NEXT_PUBLIC_SITE_URL \|\| "http://localhost:3000"` |
| `app/api/admin/articles/route.ts` | 80 | `process.env.NEXT_PUBLIC_SITE_URL \|\| "http://localhost:3000"` |

> localhost fallback ใช้ตอน dev เท่านั้น ไม่มีปัญหาถ้า deploy แล้วตั้ง `NEXT_PUBLIC_SITE_URL` ถูกต้อง

---

## 9. ✅ Final Checks ก่อนใช้งาน

- [ ] `git rm --cached .env` (เอาออกจาก git)
- [ ] `git rm --cached -r data/ 2>/dev/null` (data ถ้าเคยถูก track)
- [ ] ตรวจสอบ `.gitignore` ว่ามี `.env`, `.env*.local`, `/data/` ครบ
- [ ] npm run build — ผ่านโดยไม่มี error
- [ ] ทดสอบ login / create article / upload image
- [ ] ทดสอบ hero slides แสดงผล
- [ ] ตรวจสอบ OG meta tags (ใช้ Facebook Sharing Debugger)
- [ ] ตรวจสอบ robots.txt / sitemap (ถ้ามี)

---

> 🧹 **Tip:** หลังจาก fork สามารถใช้ `sed` หรือ `grep -rl` เพื่อ replace bulk ได้ เช่น:
> ```bash
> grep -rl "Siam Heritage" --include="*.tsx" --include="*.ts" --include="*.sql" app/ components/ lib/ supabase/ | xargs sed -i '' 's/Siam Heritage/New Site Name/g'
> ```
> แต่ควรตรวจทีละไฟล์หลัง replace เสมอ
