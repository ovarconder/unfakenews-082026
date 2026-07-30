# 🔄 Rebrand: Siam Heritage → Vibe (vibe.overconda.space)


> **Commit:** `a0d1655`  
> **วันที่:** 2025-06-02  
> **ไฟล์ที่แก้ไข:** 9 ไฟล์, 24 insertions, 23 deletions

---

## สรุปการเปลี่ยนแปลง

เปลี่ยน default branding ทั้งหมดจาก "Siam Heritage" / "siamheritage.org" → "Vibe" / "vibe.overconda.space"

| รายการ | ก่อน (Siam Heritage) | หลัง (Vibe) |
|--------|---------------------|-------------|
| Site ID | `siamheritage` | `vibe-overconda-space` |
| Site Name | Siam Heritage | Vibe |
| Tagline | ข่าวจริง ข้อมูลลึก... | Discover the rhythm of Thai culture |
| Description | Real News, Deep Insights... | Vibe — Discover the rhythm... |
| URL | `https://siamheritage.org` | `process.env.NEXT_PUBLIC_SITE_URL \|\| "https://vibe.overconda.space"` |
| Copyright | © 2025 Siam Heritage... | © 2025 Vibe. All rights reserved. |
| Meta Title | Siam Heritage - ข่าวจริง... | Vibe — Discover the rhythm... |
| OG Title | Siam Heritage | Vibe — overconda.space |
| OG Description | ข่าวจริง ข้อมูลลึก... | Discover the rhythm of Thai culture... |
| OG Image | `siamheritage.org/siamheritage-soon.jpg` | `vibe.overconda.space/images/og-default.jpg` |
| Twitter Handle | @SiamHeritage | @vibeoverconda |
| Email | `hello@siamheritage.org` | `hello@vibe.overconda.space` |

---

## ไฟล์ที่แก้ไข (9 ไฟล์)

### 1. `lib/site-settings.ts` — Default Settings (หัวใจหลัก 🫀)

**นี่คือ single source of truth** ของ branding ทั้งหมด เปลี่ยน `DEFAULT_SETTINGS` 22 ฟิลด์:

```diff
- id: "siamheritage",
+ id: "vibe-overconda-space",
- name: "Siam Heritage",
+ name: "Vibe",
- tagline: "ข่าวจริง ข้อมูลลึก เรื่องเล่าที่น่าเชื่อถือ",
+ tagline: "Discover the rhythm of Thai culture",
- description: "Real News, Deep Insights, Trusted Stories",
+ description: "Vibe — Discover the rhythm of Thai culture through curated stories...",
- url: "https://siamheritage.org",
+ url: process.env.NEXT_PUBLIC_SITE_URL || "https://vibe.overconda.space",
- copyright: "© 2025 Siam Heritage. All rights reserved.",
+ copyright: "© 2025 Vibe. All rights reserved.",
- metaTitle: "Siam Heritage - ข่าวจริง ข้อมูลลึก...",
+ metaTitle: "Vibe — Discover the rhythm of Thai culture",
- metaDescription: "Siam Heritage — Real News...",
+ metaDescription: "Vibe — Discover the rhythm of Thai culture...",
- ogTitle: "Siam Heritage",
+ ogTitle: "Vibe — overconda.space",
- ogImage: "https://siamheritage.org/siamheritage-soon.jpg",
+ ogImage: "https://vibe.overconda.space/images/og-default.jpg",
- twitterHandle: "@SiamHeritage",
+ twitterHandle: "@vibeoverconda",
- email: "hello@siamheritage.org",
+ email: "hello@vibe.overconda.space",
  // และอื่นๆ รวม 22 ฟิลด์
```

Components ที่ `SettingsProvider` + `useSettings()` จะอ่านค่าจากนี้โดยอัตโนมัติ

---

### 2. Components ที่มี hardcoded fallback `"Siam Heritage"` → `"Vibe"`

ทุก component เปลี่ยน `const siteName = settings?.name || "Siam Heritage"` → `"Vibe"`:

| # | ไฟล์ | จุดที่แสดงผล |
|---|------|-------------|
| 1 | **`components/admin/admin-sidebar.tsx`** | 🏷️ Heading ซ้ายบนของระบบหลังบ้าน |
| 2 | **`components/layout/header.tsx`** | 🏠 โลโก้ navbar header (ฝั่ง public) |
| 3 | **`components/layout/footer.tsx`** | 📌 Footer: ชื่อเว็บ + copyright |
| 4 | **`app/admin/dashboard-client.tsx`** | 📊 "แดชบอร์ดผู้ดูแลระบบ {siteName}" |
| 5 | **`app/admin/login/login-client.tsx`** | 🔐 Title "ระบบหลังบ้าน {siteName}" + logo alt |
| 6 | **`app/admin/pages/page.tsx`** | 📄 "ประวัติและข้อมูลของ {siteName}" |
| 7 | **`app/admin/pages/[slug]/page.tsx`** | ✏️ "เนื้อหาเกี่ยวกับ {siteName}" |
| 8 | **`components/coming-soon.tsx`** | ⏳ Footer "Powered by... {siteName}" |

---

### 3. Fix: Missing `siteName` declaration (3 ไฟล์)

ระหว่าง find-and-replace ไฟล์บางไฟล์มีปัญหา **ตัวแปร `const siteName` หายไป** ทำให้ TypeScript error:

| ไฟล์ | Error | สาเหตุ |
|------|-------|--------|
| **`components/layout/footer.tsx`** | `Cannot find name 'siteName'` | `const siteName` หลุดตอน replace |
| **`app/admin/login/login-client.tsx`** | `Cannot find name 'siteName'` | `const siteName` หลุดตอน replace |
| **`app/admin/pages/page.tsx`** | `Cannot find name 'siteName'` | `const siteName` ไม่เคยประกาศตั้งแต่แรก |

> ✅ **Lesson Learned:** `single_find_and_replace` เปลี่ยนเฉพาะ string โดยไม่เช็ค `const` declaration ที่อยู่บรรทัดถัดไป → อาจทำให้ reference หาย  
> **วิธีป้องกัน:** อ่านไฟล์ดู context ก่อน replace ทุกครั้ง หรือใช้ `edit_existing_file` แทน

---

## วิธีการทำงานของ Settings System

```
SettingsProvider (client component)
  ↓ mount → fetch /api/admin/settings
  ↓ Response → SiteSettings object
  ↓ store ใน React Context
  ↓ Components เรียก useSettings()
  ↓ settings.name, settings.logo, settings.favicon ฯลฯ
  ↓ ถ้า API ยังไม่ตอบ → fallback DEFAULT_SETTINGS ใน lib/site-settings.ts
```

**Key insight:** `settings?.name || "Vibe"` — ตอนนี้ `DEFAULT_SETTINGS.name` = "Vibe" อยู่แล้ว  
- ถ้า Context โหลดทัน → ใช้ค่าจาก API  
- ถ้า Context ยัง null → ใช้ "Vibe" fallback

---

## วิธีเพิ่ม/เปลี่ยน Branding ในอนาคต

1. **เปลี่ยน default (fallback):** แก้ `DEFAULT_SETTINGS` ใน `lib/site-settings.ts`
2. **เปลี่ยนแบบ dynamic (ผ่าน API):** POST `/api/admin/settings` → เก็บใน DB หรือ JSON file
3. **เพิ่ม component ใหม่:** ใช้ `useSettings()` pattern:

```typescript
import { useSettings } from "@/components/admin/settings-context";

function MyComponent() {
  const settings = useSettings();
  const siteName = settings?.name || "Vibe";  // 👈 fallback ตัวเดียว
  const logoUrl = settings?.logo || "/images/logo/default.png";
}
```

---

## Related

- **Branch:** `vibe-overconda-space`
- **Main guide:** `SIAMHERITAGE-PROJECT-GUIDE.md`
