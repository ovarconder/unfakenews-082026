# 🏗️ Microsite — Inherit from Main Site + Language Tier Override

> **Commit:** `73c4baa`  
> **วันที่:** 2025-06-03  
> **ไฟล์ที่เกี่ยวข้อง:** 10 ไฟล์  
> **เป้าหมาย:**  
> 1. Microsite inherit branding/settings จาก Main Site โดย default  
> 2. สามารถ override language tiers เฉพาะ microsite ได้  
> 3. ระบบภาษา dynamic tiers ทำงานร่วมกับ microsite

---

## สถาปัตยกรรม

### Concept

```
Main Site (vibe.overconda.space)
  │
  ├── settings: สี, logo, SEO, localeTiers, …
  │
  └── Microsite (inherit_from_main = true)
        │
        ├── ใช้สี Main Site (เว้นแต่ override)
        ├── ใช้ localeTiers ของ Main Site
        └── ใช้ Meta Title, OG Image ของ Main Site (เว้นแต่ตั้งเอง)

  Microsite (inherit_from_main = false)
        │
        ├── ตั้งสี/logo/SEO ของตัวเอง
        ├── ตั้ง localeTiers เฉพาะ microsite
        └── independent จาก Main Site
```

### Inheritance Resolution (Runtime)

```
getMergedMicrositeSettings(microsite)
        │
        ├── inherit_from_main == true ?
        │     ├── YES → fetch getSettings() (Main Site)
        │     │          └── merge: mainSettings + micrositeSettings
        │     │          └── localeTiers: จาก Main Site (ถ้า microsite ไม่ได้ตั้ง custom)
        │     │
        │     └── NO  → ใช้เฉพาะ micrositeSettings
        │                 └── ถ้า localeTiers ว่าง → show ทุกภาษา
        │
        └── return MicrositeSettings
```

---

## ไฟล์ที่เปลี่ยนแปลง

### 1. `lib/microsite-types.ts`
- `Microsite` interface: + `inherit_from_main: boolean`, `locale_tiers: Record<string, "1" | "2"> | null`
- `MicrositeSettings` interface: + `inheritFromMain: boolean`, `localeTiers: Record<string, "1" | "2">`
- `MicrositeRow`, `MicrositeInsert`, `MicrositeUpdate`: + fields

### 2. `lib/microsite-service.ts`
- **`micrositeToSettings()`**: สร้าง `localeTiers` จาก:
  - ถ้า `inherit_from_main` + มี `locale_tiers` → ใช้ custom
  - ถ้า `inherit_from_main` + ไม่มี `locale_tiers` → fallback defaults
  - ถ้าไม่ inherit + ไม่มี → empty = show all locales
- **ใหม่: `getMergedMicrositeSettings()`**: 
  - ถ้า `inheritFromMain` → fetch `getSettings()` (main) → merge
  - resolve `localeTiers` จาก main site (ถ้า microsite ไม่ได้ตั้งเอง)
- `createMicrosite()`/`updateMicrosite()`: ส่ง `inherit_from_main`, `locale_tiers`

### 3. `migrations/012_microsites.sql`
- + `inherit_from_main BOOLEAN DEFAULT true`
- + `locale_tiers JSONB DEFAULT NULL`

### 4. `app/admin/microsites/[slug]/edit/page.tsx`
- + **Inheritance toggle** (Toggle switch)
- ถ้าเปิด inherit → ซ่อน Language Tiers section
- ถ้าปิด inherit → แสดง Tier 1/2 checkbox สำหรับ 15 ภาษา
- ตอน save: ถ้า inherit → ส่ง `locale_tiers: null`

### 5. `app/microsite/[slug]/[lang]/layout.tsx`
- ใช้ `getMergedMicrositeSettings()` แทน `micrositeToSettings()`
- เรียก `setLocaleTiers(settings.localeTiers)` → sync tier ไป locales.ts

### 6. `components/microsite/microsite-header.tsx`
- Language switcher กรองภาษาเฉพาะ Tier 1 จาก `getLocaleTiers()`
- ถ้าภาษาปัจจุบันเป็น Tier 2 → force แสดง

### 7. `app/microsite/[slug]/[lang]/page.tsx` + articles + about
- เปลี่ยนจาก `micrositeToSettings()` → `getMergedMicrositeSettings()`

---

## UI: Admin Edit Microsite

### Inheritance Toggle
```
┌─ สืบทอดค่าจาก Main Site ─────────────────────┐
│                                               │
│  [Toggle ON]  สืบทอดค่าจาก Main Site          │
│               สี โลโก้ SEO ภาษา และอื่นๆ       │
│                                               │
│  (เมื่อ ON → Language Tiers section ซ่อน)      │
└───────────────────────────────────────────────┘
```

### Language Tiers Override (เมื่อ inherit = OFF)
```
┌─ ภาษา (Language Tiers) ──────────────────────┐
│                                               │
│  en │ English    [T1] [T2]                    │
│  th │ ไทย        [T1] [T2]                    │
│  fr │ Français   [T1] [T2]                    │
│  ... (15 ภาษา)                                │
│                                               │
│  ถ้า tier ว่าง → แสดงทุกภาษา (default)        │
└───────────────────────────────────────────────┘
```

---

## Merge Logic ใน `getMergedMicrositeSettings()`

```typescript
if (msSettings.inheritFromMain) {
  const mainSettings = await getSettings();
  const merged = { ...mainSettings, ...msSettings };

  // localeTiers: ใช้ microsite's custom ถ้ามี, ไม่ใช้ main's
  merged.localeTiers = msSettings.localeTiers && Object.keys(msSettings.localeTiers).length > 0
    ? msSettings.localeTiers
    : mainSettings.localeTiers;

  return merged;
}
```

| Field | inherit = true | inherit = false |
|-------|---------------|-----------------|
| `primaryColor` | Microsite (ถ้ามี) → Main | Microsite only |
| `localeTiers` | Main (ถ้า microsite ไม่ได้ตั้ง) | Microsite (หรือ all Tier 1) |
| `logo` | Microsite (ถ้ามี) → Main | Microsite only |
| `metaTitle` | Microsite (ถ้ามี) → Main | Microsite only |
| `facebookUrl` | Main only | Main (fallback) |
| `adsenseId` | Main only | Main (fallback) |

---

## คำถามที่พบบ่อย

### Q: เปิด inherit แล้ว microsite จะใช้ localeTiers ของ Main Site ไหม?
**ใช่** — ถ้า tick inherit, localeTiers ของ Main Site จะถูกใช้
แต่ถ้าตั้ง `locale_tiers` ใน microsite ไว้ก่อน → ค่า microsite จะถูกใช้ (ไม่ใช้ของ Main)

### Q: เปลี่ยน localeTiers ที่ Main Site → Microsite จะเปลี่ยนตาม?
**ใช่** — ถ้า microsite inherit = true → `getMergedMicrositeSettings()` จะ fetch `getSettings()` ทุกครั้ง
(ถ้า microsite ไม่มี custom locale_tiers)

### Q: ไม่อยากให้ Microsite มีหลายภาษา?
ตั้ง `inherit = false` → ไปติ๊กเฉพาะ `en` / `th` เป็น Tier 1 ที่เหลือ Tier 2

---

## ✅ Checklist

- [ ] `migrations/012_microsites.sql` — columns `inherit_from_main`, `locale_tiers`
- [ ] `lib/microsite-types.ts` — interfaces ครบ
- [ ] `lib/microsite-service.ts` — `getMergedMicrositeSettings()` resolve inherit
- [ ] `app/admin/microsites/[slug]/edit/page.tsx` — UI inherit toggle + tier checkbox
- [ ] `app/microsite/[slug]/[lang]/layout.tsx` — ใช้ merged settings + setLocaleTiers()
- [ ] `components/microsite/microsite-header.tsx` — filter tier 1
- [ ] `npx tsc --noEmit` — ผ่าน

---

> **Branch:** `vibe-overconda-space`  
> **Last updated:** 2025-06-03  
> **Related docs:**  
> - `01-locale-system-notes.md` — ระบบ locale tiers dynamic  
> - `03-settings-persistence-fix.md` — settings persistence main site  
> - `04-adsense-settings-flow.md` — AdSense + settings flow
