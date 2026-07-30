# ✅ Pre-Merge Checklist: `develop/complete-website` → `main`

> ใช้ checklist นี้ทุกครั้งก่อน merge ไป production  
> ขีดเครื่องหมาย `[x]` เมื่อทำเสร็จแต่ละข้อ

---

## 🔴 1. ความปลอดภัย — API Keys & Secrets

> ⚠️ **สำคัญมาก:** `.env` ถูก track ใน git แล้ว keys อาจรั่วไปใน history  
> ต้อง **revoke keys เดิมทั้งหมด** แล้วสร้างใหม่

- [ ] **Revoke Gemini API Key** — ไป [Google AI Studio](https://makersuite.google.com/app/apikey) → สร้าง key ใหม่
- [ ] **Revoke Supabase Service Role Key** — ไป Supabase Dashboard → Settings → API → `service_role` key → สร้างใหม่
- [ ] **Revoke Google OAuth Credentials** — ไป [GCP Console](https://console.cloud.google.com/apis/credentials) → revoke → สร้างใหม่
- [ ] **เปลี่ยน AUTH_SECRET** — รัน `openssl rand -base64 32` แล้วใช้ค่านี้
- [ ] **เอาออกจาก Git Tracking** — รัน `git rm --cached .env` (แต่ history เก่ายังมี — ต้อง rotate keys แทน)

```bash
# คำสั่งที่ต้องรัน
git rm --cached .env 2>/dev/null
```

---

## 🔴 2. Environment Variables — Production Setup

ตั้งค่าเหล่านี้บน Deployment Platform (Vercel / Netlify / Cloudflare):

### Required (ต้องมี)

| Variable | ค่าตัวอย่าง | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://siamheritage.org` | |
| `NEXT_PUBLIC_SITE_NAME` | `Siam Heritage` | ใช้ใน constants |
| `NEXT_PUBLIC_SITE_NAME_TH` | `สยามเฮอริเทจ` | ใช้ใน translations |
| `NEXT_PUBLIC_SITE_NAME_EN` | `Siam Heritage` | ใช้ใน translations |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Public ปลอดภัย |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (ใหม่) | สร้างใหม่ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (ใหม่) | สร้างใหม่ |
| `AUTH_SECRET` | random string (ใหม่) | เปลี่ยน |
| `GEMINI_API_KEY` | `AIza...` (ใหม่) | สร้างใหม่ |

### Optional

| Variable | ใช้เมื่อ | หมายเหตุ |
|---|---|---|
| `GOOGLE_CLIENT_ID` | ใช้ Google Login | สร้างใหม่ |
| `GOOGLE_CLIENT_SECRET` | ใช้ Google Login | สร้างใหม่ |
| `NEXT_PUBLIC_GA_ID` | ใช้ Google Analytics | `G-XXXXXXXXXX` |

> 💡 **Tip:** คัดลอก `.env.local` → เปลี่ยน keys → อัปโหลดไปยัง Deployment Platform  
> อย่า commit ไฟล์นี้ลง git!

---

## 🔴 3. .gitignore — ป้องกันรั่วซ้ำ

ตรวจสอบว่า `.gitignore` มีบรรทัดเหล่านี้ครบ:

```gitignore
.env
.env*.local
.env*.development
/data/
/translations/
/public/uploads/
```

- [ ] `.env` อยู่ใน `.gitignore` แล้ว
- [ ] `.env*.local` อยู่ใน `.gitignore` แล้ว
- [ ] `/data/` อยู่ใน `.gitignore` แล้ว
- [ ] `/public/uploads/` อยู่ใน `.gitignore` แล้ว

---

## 🟡 4. Deployment Config

- [ ] **เลือก Platform:** Vercel / Netlify / Cloudflare Pages?
- [ ] **Build Command:** `npm run build`
- [ ] **Output Directory:** `.next` (Vercel auto)
- [ ] **Node Version:** >= 18.x
- [ ] **Environment Variables:** ตั้งค่าจากข้อ 2
- [ ] **Custom Domain:** ตั้ง DNS เรียบร้อย
- [ ] **SSL/HTTPS:** เปิด auto

---

## 🟡 5. Static Files & Assets

| # | ไฟล์ | ต้องมีไหม | เช็ค |
|---|---|---|---|
| 1 | `/images/hero/wat-phra-kaew.jpg` | ✅ (ตาม seed data) | ☐ |
| 2 | `/images/hero/loy-krathong.jpg` | ✅ | ☐ |
| 3 | `/images/hero/thai-medicine.jpg` | ✅ | ☐ |
| 4 | `/images/hero/thai-cuisine.jpg` | ✅ | ☐ |
| 5 | `/images/hero/thai-language.jpg` | ✅ | ☐ |
| 6 | `/images/hero/thai-handicraft.jpg` | ✅ | ☐ |
| 7 | `/public/siamheritage-soon.jpg` | ✅ (OG image) | ☐ |
| 8 | `/public/og-default.jpg` | ✅ (schema fallback) | ☐ |
| 9 | `/public/images/logo/*.png` | ✅ (4 รูปแบบ) | ☐ |
| 10 | `/public/favicon.ico` | ❌ ไม่จำเป็น (ใช้ png) | ☐ |

> ถ้าขาด ให้สร้าง placeholder รูปเปล่า หรือลบ reference ออกจาก seed data

---

## 🟡 6. Database & Seed Data

- [ ] Supabase project พร้อม (migrations รันแล้ว?)
- [ ] Seed data รันแล้ว? (categories, hero_slides, initial articles)
- [ ] Row Level Security (RLS) เปิดอยู่?
- [ ] ผู้ใช้ admin ถูกสร้างใน Supabase Auth แล้ว?
- [ ] ทดสอบ query: `SELECT * FROM hero_slides WHERE is_active = true`

---

## 🟢 7. Final Functional Checks

- [ ] `npm run build` ผ่าน ไม่มี error
- [ ] ทดลองเข้า `/admin/login` → login ได้
- [ ] ทดลองสร้างบทความ → publish → ดูหน้า public
- [ ] ทดลอง Hero Slides → แสดงบนหน้าแรกถูกต้อง
- [ ] ทดสอบ 404 page แสดงผล
- [ ] ตรวจสอบ OG meta tags ด้วย [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] ตรวจสอบ robots.txt ด้วย Google Search Console
- [ ] ลองเปลี่ยน settings ที่ `/admin/settings` → ดูว่าขึ้นใน header/footer ไหม
- [ ] ทดสอบเปลี่ยนภาษา (TH ↔ EN)

---

## 📋 8. Git Commands สรุป

```bash
# Step 1: เอาออกจาก git
git rm --cached .env 2>/dev/null
git commit -m "chore: remove .env from tracking"

# Step 2: Merge ไป main
git checkout main
git pull origin main
git merge develop/complete-website

# Step 3: Push
git push origin main

# Step 4: Tag version (optional)
git tag v1.0.0
git push origin v1.0.0
```

---

## 📌 9. After Deploy — Verify

- [ ] เปิด browser → เข้า domain → หน้าแสดงผล
- [ ] ดู Console (F12) → ไม่มี JavaScript error
- [ ] ดู Network tab → API calls 200 OK
- [ ] ทดสอบ responsive (mobile/tablet/desktop)
- [ ] ทดสอบ Google Analytics (ถ้ามี) → ดู real-time report

---
> ✅ **เมื่อทุกข้อครบ ก็พร้อม push to main!** 🚀
