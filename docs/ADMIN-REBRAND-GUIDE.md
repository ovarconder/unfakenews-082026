# 🏷️ คู่มือการ Rebrand เว็บไซต์ (สำหรับ Admin)

> **ใช้สำหรับ:** เปลี่ยนชื่อเว็บ, โลโก้, favicon, สี, SEO, และข้อมูลติดต่อทั้งหมด  
> **เวลาที่ใช้:** ~10 นาที  
> **ยาก:** ⭐☆☆☆☆ (ง่าย)

---

## 🇹🇭 วิธีเปลี่ยน Branding (แบบเร็ว)

### 1. เปลี่ยนชื่อเว็บ + Tagline + คำอธิบาย

เข้า `/admin/settings` → แก้ฟิลด์:

| ฟิลด์ | ตัวอย่าง | คำอธิบาย |
|-------|---------|----------|
| **Site Name** | `Vibe` | ชื่อเว็บ — ขึ้น header, sidebar, footer, title |
| **Tagline** | `Discover the rhythm of Thai culture` | ข้อความใต้ชื่อเว็บ |
| **Description** | `Vibe — Discover...` | คำอธิบายเว็บ (SEO) |

**กด Save** ด้านล่าง → refresh หน้า → ทุกอย่างอัปเดต ✅

---

### 2. เปลี่ยน Logo + Favicon + OG Image

เข้า `/admin/settings` → เลื่อนหา **Branding / Images**:

| ฟิลด์ | รูปแบบ | ขนาดแนะนำ |
|-------|--------|-----------|
| **Logo** | PNG/SVG | 128×128px (ใช้ใน sidebar admin) |
| **Logo Full** | PNG | ~400×80px (ใช้ใน public header) |
| **Favicon** | PNG/ICO | 32×32px หรือ 64×64px |
| **OG Image** | JPG/PNG | 1200×630px (เวลาคนแชร์ลิงก์) |

**กด Save** → refresh → โลโก้เปลี่ยนทั้งเว็บ ✅

> ⚠️ **ถ้า refresh แล้วกลับมาเป็นของเก่า:**  
> แสดงว่า `site_settings` table ยังไม่มีใน Supabase  
> → ต้องรัน migration (ดูหัวข้อ "วิธีรัน Migration" ด้านล่าง)

---

### 3. เปลี่ยนสีธีม

เข้า `/admin/settings` → เลื่อนหา **Branding / Colors**:

| ฟิลด์ | ค่าเริ่มต้น | ตำแหน่งที่ใช้ |
|-------|-----------|-------------|
| Primary Color | `#fbbf24` (เหลือง) | ปุ่ม, ลิงก์, active states |
| Secondary Color | `#f59e0b` (ส้ม) | gradient กับ primary |
| Background Color | `#060e1a` (ดำ) | พื้นหลังหลัก |
| Text Color | `#ffffff` (ขาว) | ข้อความ |
| Sidebar Color | `#0a1628` (น้ำเงินเข้ม) | พื้นหลัง admin sidebar |
| ... | | มีทั้งหมด 14 สี |

**กด Save** → refresh → theme เปลี่ยนทันที ✅

---

### 4. เปลี่ยนข้อมูลติดต่อ + Social Links

เข้า `/admin/settings` → เลื่อนหา **Contact / Social**:

| ฟิลด์ | ตัวอย่าง |
|-------|---------|
| Email | `hello@vibe.overconda.space` |
| Phone | `+66 2 123 4567` |
| Facebook URL | `https://facebook.com/vibethailand` |
| Instagram URL | `https://instagram.com/vibethailand` |
| YouTube URL | `https://youtube.com/@vibethailand` |

---

### 5. เปลี่ยน Copyright / Footer

เข้า `/admin/settings` → ฟิลด์ **Copyright**:

```
© 2025 Vibe. All rights reserved.
```

เปลี่ยนปี หรือชื่อเจ้าของได้เลย

---

## 🛠️ วิธีตั้งค่าใหม่หมด (Rebrand เต็มรูปแบบ)

ถ้าต้องการเปลี่ยน **ทุกอย่าง** สำหรับเว็บไซต์ใหม่ (เช่น `newbrand.com`):

### Step 1: แก้ Default Settings ตรง Source Code

ไฟล์: `lib/site-settings.ts`

หา `const DEFAULT_SETTINGS: SiteSettings = {` แล้วเปลี่ยน:

```typescript
// ✏️ เปลี่ยน values ทั้ง 22 ฟิลด์
const DEFAULT_SETTINGS: SiteSettings = {
  id: "newbrand-id",
  name: "New Brand Name",
  tagline: "คำขวัญใหม่",
  description: "คำอธิบายเว็บใหม่",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://newbrand.com",
  logo: "/images/logo/new-logo.png",
  favicon: "/images/logo/new-favicon.png",
  copyright: "© 2025 New Brand. All rights reserved.",
  email: "hello@newbrand.com",
  metaTitle: "New Brand — คำอธิบาย",
  ogImage: "https://newbrand.com/images/og-default.jpg",
  // ... เปลี่ยนสี theme และที่เหลือ
};
```

### Step 2: สร้าง Logo จริง

วางไฟล์รูป logo ไว้ใน:
```
public/images/logo/new-logo.png
public/images/logo/new-favicon.png
public/images/og-default.jpg
```

### Step 3: รัน Migration (ถ้ายังไม่เคย)

```bash
supabase db push
```

หรือรัน SQL ใน Supabase Dashboard:
เปิด `migrations/013_site_settings.sql` → ก็อปวาง → Run

### Step 4: เข้า `/admin/settings` → อัปโหลด Logo

เข้าเว็บ → sign in → ไป `/admin/settings` → อัปโหลด logo, favicon, OG image → Save

### Step 5: Deploy ใหม่

```bash
git add -A
git commit -m "feat: rebrand to New Brand"
git push
```

Vercel/Netlify จะ build และ deploy อัตโนมัติ

---

## 📸 ขนาดภาพที่ต้องการ

| รูป | อัตราส่วน | px (กว้าง×สูง) | น้ำหนัก |
|-----|-----------|----------------|---------|
| Logo | 1:1 | 128×128 | < 50KB |
| Logo Full | 5:1 | 400×80 | < 50KB |
| Favicon | 1:1 | 32×32 หรือ 64×64 | < 10KB |
| OG Image | 1.9:1 | 1200×630 | < 200KB |

---

## 🧪 ทดสอบว่าทำงานถูกต้อง

หลังจากเปลี่ยน branding แล้ว ให้เช็ค:

- [ ] **หน้าแรก**: `/th` — header, footer, title
- [ ] **Admin sidebar**: `/admin` — โลโก้ซ้ายบน, ชื่อเว็บ
- [ ] **Login page**: `/admin/login` — โลโก้, title
- [ ] **Favicon**: tab browser — favicon เปลี่ยน
- [ ] **SEO metadata**: view page source → `<title>` และ `<meta>` ถูกต้อง
- [ ] **OG Image**: แปะลิงก์เว็บใน Facebook/Twitter → รูป OG แสดง
- [ ] **Footer**: copyright, email ถูกต้อง
- [ ] **Settings persist**: refresh F5 → branding คงเดิม

---

## ❓ ปัญหาที่พบบ่อย

### Q: Save settings แล้ว refresh กลับไปเป็นของเดิม

**สาเหตุ:** ตาราง `site_settings` ยังไม่มีใน Supabase  
**วิธีแก้:** รัน `supabase db push` หรือเปิดไฟล์ `migrations/013_site_settings.sql` แล้ว run ใน Supabase SQL Editor

### Q: Logo รูปไม่ขึ้น

**สาเหตุ:** path รูปผิด หรือรูปไม่ได้ถูก deploy  
**วิธีแก้:** เช็คที่ `public/images/logo/` ว่ามีไฟล์อยู่ → deploy ใหม่

### Q: สีธีมไม่เปลี่ยน

**สาเหตุ:** ค่า `primaryColor` (camelCase) ถูกส่งไป API แต่ database ใช้ `primary_color` (snake_case)  
**วิธีแก้:** เช็ค console log → ถ้า DB error แสดงว่าต้อง run migration ก่อน

### Q: ไม่รู้ค่า color hex ที่ต้องการ

ใช้ tools:
- [Coolors](https://coolors.co) — จับคู่สี
- [Realtime Colors](https://realtimecolors.com) — ดูตัวอย่างทั้งหน้า
- [Tailwind Color Generator](https://uicolors.app) — สร้างสี Tailwind

---

## 📁 โครงสร้างไฟล์ที่เกี่ยวข้อง

```
lib/
└── site-settings.ts          ← DEFAULT_SETTINGS (fallback เมื่อ DB ยังไม่ตอบ)

migrations/
└── 013_site_settings.sql     ← SQL สร้างตาราง site_settings

app/api/admin/settings/
└── route.ts                  ← API endpoint GET/POST settings

components/admin/
└── settings-context.tsx       ← React Context สำหรับ client components
└── settings-page.tsx          ← หน้า /admin/settings UI

public/images/logo/
├── your-logo.png              ← วาง logo ที่นี่
├── your-favicon.png           ← วาง favicon ที่นี่
└── ...                        ← รูปอื่นๆ
```

---

> ฉบับนี้ใช้กับ **Vibe (overconda.space)**  
> สร้างเมื่อ: 2025-06-02  
> อ่านเพิ่ม: `docs/01-locale-system-notes.md`, `docs/02-rebrand-vibe-notes.md`, `docs/03-settings-persistence-fix.md`
