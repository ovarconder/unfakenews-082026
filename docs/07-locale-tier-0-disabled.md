# 🚫 Locale Tier 0 — ปิดภาษา (Disabled)

> **Commit:** `0fd9c56`  
> **วันที่:** 2025-06-XX  
> **ไฟล์ที่แก้ไข:** 9 ไฟล์  
> **Branch:** `develop/complete-website`

---

## สรุปการเปลี่ยนแปลง

เพิ่ม **Tier 0** สำหรับระบบภาษา ทำให้สามารถ **ปิดภาษาใดภาษาหนึ่ง** ไม่ให้แสดงใน Header, ไม่ให้แปล, และ redirect ไป `/en` ถ้าผู้ใช้พยายามเข้าถึง URL ของภาษาที่ปิด

### ก่อน
```
LocaleTier = "1" | "2" (2 ระดับ)
  Tier 1 = แสดงใน Header + แปลทันที
  Tier 2 = แปลตามคำขอ (JIT)
```

### หลัง
```
LocaleTier = "0" | "1" | "2" (3 ระดับ รวมปิด)
  Tier 0 = ปิด — ไม่แสดง, ไม่แปล, redirect ไป /en
  Tier 1 = แสดงใน Header + แปลทันที
  Tier 2 = แปลตามคำขอ (JIT)
```

---

## สิ่งที่เปลี่ยน (9 ไฟล์)

### 1. `lib/locales.ts` — แกนหลัก 🧠

| การเปลี่ยนแปลง | รายละเอียด |
|---------------|------------|
| เพิ่ม type `LocaleTier` | `"0" \| "1" \| "2"` |
| เพิ่ม function `isDisabled(locale)` | เช็คว่า Tier 0 |
| เพิ่ม function `getVisibleLocales()` | คืนค่าเฉพาะ Tier 1 (แสดงใน Header) |
| ปรับ `getActiveLocales()` | คืน Tier 1 + Tier 2 (ไม่รวม Tier 0) |
| ปรับ `DEFAULT_TIERS` type | `Record<string, LocaleTier>` |

```typescript
// lib/locales.ts
export type LocaleTier = "0" | "1" | "2";

export function isDisabled(locale: Locale): boolean {
  return currentTiers[locale] === "0";
}

/** Locales ที่แสดงใน Header locale switcher = Tier 1 เท่านั้น */
export function getVisibleLocales(): Locale[] {
  return getTier1Locales();
}
```

### 2. `lib/types.ts` — Translation Config

```typescript
// lib/types.ts
export interface TranslationStrategyConfig {
  locale: Locale;
  tier: 0 | 1 | 2;  // ✅ จากเดิม 1 | 2
  // ...
}
```

### 3. `lib/microsite-service.ts`

```typescript
const localeTiers: Record<string, "0" | "1" | "2"> = microsite.locale_tiers
```

### 4. `app/[lang]/layout.tsx` — 404/redirect เมื่อ Tier 0 🛑

```typescript
// ถ้าภาษาถูกปิด (Tier 0) → redirect ไป /en
if (isDisabled(lang as Locale)) {
  redirect("/en");
}

// hreflang metadata ใช้เฉพาะ active locales (ไม่รวม Tier 0)
const activeLocales = getActiveLocales();
for (const l of activeLocales) {
  alternates[hreflang] = `${baseUrl}/${l}`;
}
```

### 5. `components/layout/header.tsx` — ซ่อนภาษาที่ปิด 👻

```typescript
// Desktop dropdown — แสดงเฉพาะ Tier 1
{getVisibleLocales().map((l) => (
  <Link key={l} href={switchLocale(pathname, locale, l)}>...</Link>
))}

// Mobile grid — แสดงเฉพาะ Tier 1
{getVisibleLocales().map((l) => (
  <Link key={l} href={switchLocale(pathname, locale, l)}>...</Link>
))}
```

### 6. `app/admin/settings/page.tsx` — UI จัดการ 🎨

```
┌──────────────────────────────────────────────┐
│  [en] English    [Tier 1✅] [Tier 2] [ปิด]   │
│  [th] ไทย        [Tier 1✅] [Tier 2] [ปิด]   │
│  [fr] Français   [Tier 1]  [Tier 2✅] [ปิด]  │
│  [ko] 한국어     [Tier 1]  [Tier 2]  [ปิด✅]  │
└──────────────────────────────────────────────┘
```

| สถานะ | ปุ่ม active | สี |
|-------|-----------|-----|
| Tier 1 | เขียวอมร (emerald) + glow | `bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow` |
| Tier 2 | ส้ม (amber) + glow | `bg-amber-500/20 text-amber-300 border-amber-400/40 shadow` |
| ปิด (Off) | แดง | `bg-red-500/15 text-red-300 border-red-400/30` opacity 50% |

### 7. `app/admin/microsites/[slug]/edit/page.tsx` — Microsite tiers UI

เพิ่มปุ่ม "ปิด" (Tier 0) ในส่วน Language Tiers Override ของ Microsite edit ด้วย UI เดียวกับ settings page

### 8. `app/api/translate-all/route.ts` — API ป้องกันการแปล

```typescript
// ⛔ ข้ามถ้าภาษานี้ถูกปิด (Tier 0)
if (isDisabled(targetLocale)) {
  return NextResponse.json({
    success: false,
    error: `Locale "${targetLocale}" is disabled (Tier 0) — translation skipped`,
  }, { status: 400 });
}
```

### 9. `app/api/translate-new/route.ts` — API เดียวกัน

```typescript
if (isDisabled(targetLocale)) {
  return NextResponse.json({
    success: false, error: `Locale "${targetLocale}" is disabled (Tier 0)`,
  }, { status: 400 });
}
```

---

## Flow การทำงาน

```
User เข้า /ko/articles/khon
        │
        ▼
app/[lang]/layout.tsx
        │
        ├─ isDisabled("ko") = true ?
        │      │
        │      ▼ yes
        │   redirect("/en") ← ไป /en/articles/khon
        │
        ▼ no
    แสดงเนื้อหา ko
```

```
Admin ตั้ง ko → Tier 0 (ปิด)
        │
        ▼
Save settings → DB locale_tiers
        │
        ▼
setLocaleTiers() → runtime cache
        │
        ▼
getVisibleLocales() → ไม่มี ko
getActiveLocales() → ไม่มี ko
isDisabled("ko") → true
```

---

## ข้อควรรู้

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Tier 0 = ปิดสนิท** | ไม่แสดงใน Header, ไม่มี hreflang, ไม่มีการแปล |
| **API reject** | translate-all, translate-new จะ return 400 |
| **Layout redirect** | `/ja/etc` → `redirect("/en")` แทน 404 |
| **Middleware** | ไม่ต้องเปลี่ยน — layout จัดการ redirect |
| **Cookie** | ถ้า cookie มี `ja` แต่ `ja` ถูกปิด → layout redirect ไป `/en` → cookie อัปเดตเป็น `en` |
| **Microsite** | สามารถปิดภาษาเฉพาะ microsite ได้ (override) |

---

## UI Differences

### Settings Page (Main Site)
```
╔══════════════════════════════════════════════╗
║  🌐 ภาษา (Language Tiers)                    ║
║  Tier 1 = แสดงใน Header + แปลทันที          ║
║  Tier 2 = แปลตามคำขอ (แสดงสีส้มเมื่อ active) ║
║  ปิด (Off) = ไม่แสดงให้ผู้ใช้เลือกเลย        ║
║                                              ║
║  ┌────────────────────────────────────────┐  ║
║  │ en English   [🟢 Tier 1] [T2] [ปิด]  │  ║
║  │ th ไทย       [🟢 Tier 1] [T2] [ปิด]  │  ║
║  │ fr Français  [Tier 1] [🟠 T2] [ปิด]  │  ║
║  │ ko 한국어   [Tier 1] [T2]  [🔴 ปิด]  │  ║
║  └────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════╝
```

### Microsite Edit Page
```
╔══════════════════════════════════════════════╗
║  ภาษา (Language Tiers)                       ║
║  ┌────────────────────────────────────────┐  ║
║  │ en  English  [T1] [T2] [ปิด]          │  ║
║  │ th  ไทย      [T1] [T2] [ปิด]          │  ║
║  │ ko  한국어   [T1] [T2] [🔴 ปิด]      │  ║
║  └────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════╝
```

---

## การทดสอบ

### 1. ปิดภาษา
- ไปที่ `/admin/settings` → Language Tiers
- กด **ปิด** สำหรับ `ko`
- กด **บันทึก**

### 2. ภาษาไม่แสดงใน Header
- ไปที่หน้าแรก → เปิด dropdown ภาษา
- `한국어` ควรหายไป ✅

### 3. URL ภาษาที่ปิด → redirect
- เข้า `/ko/about` โดยตรง
- ควร redirect ไป `/en/about` ✅ (ไม่ใช่ 404)

### 4. API translation ถูก reject
```json
POST /api/translate-new
{ "slug": "khon", "locale": "ko" }

Response: 400
{ "success": false, "error": "Locale \"ko\" is disabled (Tier 0)" }
```

### 5. เปิดภาษาใหม่
- ไปที่ settings → กด Tier 1 หรือ Tier 2
- Header แสดงภาษาใหม่, hreflang กลับมา ✅

---

## เอกสารอ้างอิง

- `docs/01-locale-system-notes.md` — ระบบภาษา (เดิม, ก่อน Tier 0)
- `lib/locales.ts` — locale tiers runtime
- `lib/types.ts` — TranslationStrategyConfig type

> **Branch:** `develop/complete-website`  
> **Related docs:**  
> - `01-locale-system-notes.md` (Locale system overview)  
> - `03-settings-persistence-fix.md` (Settings persistence)  
> - `06-auth-migration-json-to-supabase.md` (Auth migration)
