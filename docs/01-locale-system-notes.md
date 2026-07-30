# 🌐 Locale System — vibe.overconda.space

> **Project:** vibe.overconda.space  
> **ระบบภาษา:** 15 ภาษา (dynamic tiers ผ่าน DB)  
> **Type รองรับ:** 15 ภาษา  
> **Tier 1 (แสดงใน Header):** 6 ภาษา (en, th, zh, ja, es, pt)  
> **Tier 2 (แปลตามคำขอ):** 9 ภาษา (fr, ko, de, ru, ar, hi, it, vi, ms)

---

## สถาปัตยกรรม (อัปเดต)

### `lib/locales.ts` — Runtime Cache + DB Sync

| Export | ความหมาย | เปลี่ยนแปลง |
|--------|---------|-----------|
| `ALL_LOCALES` | 15 ภาษา type | ไม่เปลี่ยน |
| `ACTIVE_LOCALES` (deprecated) | = `getTier1Locales()` | ❌ ใช้ `getActiveLocales()` หรือ `getTier1Locales()` แทน |
| `TIER1_LOCALES` (deprecated) | = `getTier1Locales()` | ❌ ใช้ `getTier1Locales()` แทน |
| `TIER2_LOCALES` (deprecated) | = `getTier2Locales()` | ❌ ใช้ `getTier2Locales()` แทน |
| `setLocaleTiers(tiers)` | อัปเดต runtime cache | ✅ **ใหม่** |
| `getLocaleTiers()` | อ่านค่าปัจจุบัน | ✅ **ใหม่** |
| `getTier1Locales()` | Tier 1 locales (แสดงใน header) | ✅ **ใหม่** |
| `getTier2Locales()` | Tier 2 locales (แปลตามคำขอ) | ✅ **ใหม่** |
| `getActiveLocales()` | Tier 1 (backward compat) | ✅ **ใหม่** |
| `isTier1(locale)` | เช็คว่าเป็น Tier 1 | ✅ **ใหม่** |
| `isTier2(locale)` | เช็คว่าเป็น Tier 2 | ✅ **ใหม่** |

### Flow การทำงาน

```
site_settings.locale_tiers (DB)
        │
        ▼
getSettings() / saveSettings()
        │
        ▼
setLocaleTiers(tiers) → locales.ts runtime cache
        │
        ▼
getTier1Locales() = en, th, zh, ja, es, pt (ถ้าตั้ง DB)
getTier2Locales() = fr, ko, de, ru, ar, hi, it, vi, ms
```

### การเปลี่ยนแปลงจาก version เก่า

| Version | การตั้งค่า Tier | เปลี่ยนที่ UI |
|---------|----------------|--------------|
| **ก่อน (hardcode)** | `ACTIVE_LOCALES` = ["en","th","zh","ja","es","pt"] code ภายใน `lib/locales.ts` | ต้องแก้ไฟล์ |
| **หลัง (dynamic)** | `localeTiers` ใน `site_settings` table → แก้ได้จาก `/admin/settings` | UI checkbox |

---

## ไฟล์ที่เปลี่ยนแปลง (รอบ Dynamic Tiers)

### 1. `lib/locales.ts`
- เพิ่ม `setLocaleTiers()`, `getLocaleTiers()`, `getTier1Locales()`, `getTier2Locales()`, `getActiveLocales()`
- `ACTIVE_LOCALES`, `TIER1_LOCALES`, `TIER2_LOCALES` ถูก deprecate → ใช้ function แทน
- ค่า default Tier 1 = 6 ภาษา (en, th, zh, ja, es, pt)
- ค่า default Tier 2 = 9 ภาษา (fr, ko, de, ru, ar, hi, it, vi, ms)

### 2. `lib/site-settings.ts`
- เพิ่ม `localeTiers: Record<string, "1" | "2">` ใน `SiteSettings` interface
- `DEFAULT_SETTINGS.localeTiers` = 6 ภาษา Tier 1, 9 ภาษา Tier 2
- `dbRowToSettings()` แปลง `locale_tiers` → `localeTiers`
- `settingsToDbRow()` แปลง `localeTiers` → `locale_tiers`
- เรียก `setLocaleTiers()` ทุกครั้งที่ `getSettings()` หรือ `saveSettings()` ทำงาน

### 3. `app/admin/settings/page.tsx`
- เพิ่ม section **ภาษา (Language Tiers)** ก่อน System section
- 15 ภาษา แสดงเป็น checkbox Tier 1 / Tier 2
- เปลี่ยนค่า → กด Save → locales.ts runtime cache อัปเดตทันที

### 4. `migrations/013_site_settings.sql`
- เพิ่ม column `locale_tiers JSONB`

### 5. `components/microsite/microsite-header.tsx`
- Language switcher ใช้ `getLocaleTiers()` กรองเฉพาะ Tier 1
- ถ้าภาษาปัจจุบันเป็น Tier 2 จะ force แสดง

### 6. `components/layout/header.tsx`
- Language switcher ใช้ `getTier1Locales()` กรองเฉพาะ Tier 1
- (Main site header — แก้ใน commit `e858d2b`)

---

## สำหรับ Microsite

Microsite สามารถ override locale tiers ได้ 2 วิธี:
1. **inherit_from_main = true** → ใช้ localeTiers ของ Main Site
2. **inherit_from_main = false** → ตั้ง locale_tiers เองใน `/admin/microsites/[slug]/edit`

ดูรายละเอียดเพิ่ม: `docs/05-microsite-inherit.md`

---

## การใช้งาน API ใหม่

```typescript
import { getTier1Locales, getTier2Locales, isTier1, setLocaleTiers } from "@/lib/locales";

// ✅ ใช้ getTier1Locales() แทน ACTIVE_LOCALES
const headerLocales = getTier1Locales();

// ✅ เช็คว่าภาษาไหนเป็น Tier 1
if (isTier1(locale)) { /* แสดงใน header */ }

// ✅ ตั้งค่าแบบ manual (กรณีไม่มี DB)
setLocaleTiers({ en: "1", th: "1", fr: "2", ... });
```

---

## ประหยัดค่าใช้จ่าย Translation ยังไง?

| การตั้งค่า | ผล |
|-----------|-----|
| Tier 1 (6 ภาษา) | แปล full content ทันทีเมื่อ publish |
| Tier 2 (9 ภาษา) | ไม่แปลอัตโนมัติ — แปลตามคำขอ (JIT) |
| รวมค่าใช้จ่ายต่อบทความ | ~6 API calls × Gemini Flash ≈ $0.0018 |

ถ้าใช้ 15 ภาษา: ~54 API calls ต่อบทความ ≈ $0.018  
ประหยัดไป: **~90%** ของค่าแปลทั้งหมด

---

> **Branch:** `vibe-overconda-space`  
> **Last updated:** 2025-06-03  
> **Related docs:**  
> - `03-settings-persistence-fix.md` (settings persistence)  
> - `04-adsense-settings-flow.md` (AdSense + settings flow)  
> - `05-microsite-inherit.md` (microsite inherit + locale tiers override)
