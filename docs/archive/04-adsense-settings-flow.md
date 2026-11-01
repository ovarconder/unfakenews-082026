# 🎯 AdSense + Dynamic Settings via Supabase

> **Commit:** (เตรียม commit)  
> **วันที่:** 2025-06-02  
> **ไฟล์ที่เกี่ยวข้อง:** 9 ไฟล์  
> **เป้าหมาย:**  
> 1. AdSense ID + Slot IDs อ่านจาก DB (ไม่ใช้ env var)  
> 2. logo, favicon, OG image — dynamic จาก DB  
> 3. settings ถูก save ลง DB → คงอยู่ถาวร

---

## 🧠 สถาปัตยกรรมภาพรวม

```
┌─────────────────────────────────────────────┐
│  Supabase site_settings table               │
│  ┌──────────────────────────────────────┐   │
│  │ name, logo, favicon, og_image,       │   │
│  │ google_analytics_id, adsense_id,     │   │
│  │ adsense_slot_homepage,               │   │
│  │ adsense_slot_sidebar,                │   │
│  │ locale_tiers,  ← เพิ่มใหม่          │   │
│  │ …                                     │   │
│  └──────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Server Component      Client Component
   (getSettings async)   (useSettings hook)
        │                     │
        ▼                     ▼
   generateMetadata      AdSenseScript
   Header / Footer       AdUnit / AdUnitFixed
   HomePage (AdUnit)     ArticleDetail (AdUnit)
        │
        ▼
   setLocaleTiers()  ← locales.ts runtime cache
```

---

## 🔁 Flow การทำงาน

### A. Server Components (SSR)

```
[Layout / HomePage / generateMetadata]
        │
        ▼
  await getSettings()
        │
        ▼
  Supabase SELECT * FROM site_settings
        │
        ▼
  dbRowToSettings(data) → snake_case → camelCase
        │
        ▼
  setLocaleTiers(settings.localeTiers)  ← sync tiers
        │
        ▼
  settings.logo, settings.favicon, settings.adsenseId, …
```

### B. Client Components (CSR)

```
[ArticleDetail / SettingsProvider]
        │
        ▼
  useSettings()  ← fetches /api/admin/settings
        │
        ▼
  settings.adsenseId, settings.adsenseSlotSidebar
```

### C. Admin Save Flow

```
POST /api/admin/settings { logo, localeTiers, adsenseId, … }
        │
        ▼
  saveSettings(updates)
        │
        ▼
  Supabase UPSERT site_settings
        │
        ▼
  setLocaleTiers(updated.localeTiers)  ← sync cache
        │
        ▼
  Response 200 OK → Cache + tiers updated ✅
```

---

## 🗺️ ตาราง Field Mapping

### Interface → DB → Usage

| Interface Field (camelCase) | DB Column (snake_case) | ใช้งานที่ไหน |
|----------------------------|------------------------|-------------|
| `localeTiers` | `locale_tiers` | locales.ts runtime, language switcher |
| `logo` | `logo` | Header, Admin Sidebar |
| `favicon` | `favicon` | generateMetadata → icons.icon |
| `ogImage` | `og_image` | Open Graph preview |
| `adsenseId` | `adsense_id` | AdSense components |
| ... | ... | ... |

### Fallback Priority

```
DB value (row.xxx)
  │  ถ้ามีค่า → ใช้
  ▼
DEFAULT_SETTINGS.xxx
  │  ถ้ามี → ใช้
  ▼
env var (process.env.NEXT_PUBLIC_XXX)
  ▼
empty string / null
```

---

## 🧰 วิธีเปลี่ยน Language Tiers (ไม่ต้อง Deploy ใหม่)

1. login `/admin/login`
2. ไป `/admin/settings`
3. เลื่อนหา **ภาษา (Language Tiers)** section
4. ติ๊ก Tier 1 / Tier 2 สำหรับแต่ละภาษา
5. **Save**
6. Refresh → Header language switcher เปลี่ยนตาม

---

## ✅ Checklist ก่อน Merge

- [ ] `lib/site-settings.ts` — interface มี `localeTiers`
- [ ] `lib/site-settings.ts` — `DEFAULT_SETTINGS.localeTiers` ครบ 15 ภาษา
- [ ] `lib/site-settings.ts` — `dbRowToSettings()` แปลง `locale_tiers`
- [ ] `lib/site-settings.ts` — `settingsToDbRow()` แปลง `localeTiers`
- [ ] `lib/site-settings.ts` — เรียก `setLocaleTiers()` ใน getSettings/saveSettings
- [ ] `lib/locales.ts` — มี `setLocaleTiers()`, `getTier1Locales()`, `getTier2Locales()`
- [ ] `migrations/013_site_settings.sql` — มี column `locale_tiers JSONB`
- [ ] `app/admin/settings/page.tsx` — UI checkbox ภาษา
- [ ] `components/microsite/microsite-header.tsx` — ใช้ `getLocaleTiers()`
- [ ] `components/layout/header.tsx` — ใช้ `getTier1Locales()`
- [ ] `npx tsc --noEmit` — ผ่าน

---

## 📚 เอกสารอ้างอิง

- `docs/01-locale-system-notes.md` — ระบบ locale tiers dynamic
- `docs/03-settings-persistence-fix.md` — วิธีขยับจาก FS → Supabase
- `docs/05-microsite-inherit.md` — Microsite inherit settings + locale tiers
- `docs/CLONE_SETUP_GUIDE.md` — วิธี fork ไปทำเว็บใหม่
- `docs/MIGRATION_CHECKLIST.md` — checklist ตอน clone
