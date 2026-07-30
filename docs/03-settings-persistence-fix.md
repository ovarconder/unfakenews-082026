# 💾 Settings Persistence Fix — Supabase-backed Site Settings

> **Commit:** (กำลังจะ commit)  
> **วันที่:** 2025-06-02  
> **ไฟล์ที่แก้ไข:** 4 ไฟล์  
> **ปัญหา:** logo, favicon, OG image — save แล้ว refresh กลับมาเป็นของเดิม

---

## 🔴 ปัญหาที่เจอ

### อาการ
1. เข้า `/admin/settings` → แก้ logo, favicon, OG image, site name
2. กด **Save** → แสดง success ✅
3. **กด Refresh F5** → กลับไปเป็นค่าเดิม (SiamHeritage-logo, ของเก่า)
4. ลองอีกครั้ง — เป็นเหมือนเดิม

### สาเหตุ (ราก)

ระบบ Settings เดิมใช้ **`lib/site-settings.ts`** ซึ่งมีสถาปัตยกรรมดังนี้:

```
เซฟ:  saveSettings(updates)
        ↓ update in-memory cache (OK)
        ↓ try fs.writeFileSync("data/site-settings.json")  ← ❌ fail ใน serverless
        ↓ catch block → เงียบ ← user คิดว่าสำเร็จ  ⚠️

โหลด: getSettings()
        ↓ return cache ถ้ามี (OK)
        ↓ try fs.readFileSync("data/site-settings.json")  ← ❌ fail
        ↓ catch → return DEFAULT_SETTINGS  ← กลับไปค่าเดิม
```

| ปัญหา | รายละเอียด | ผลกระทบ |
|-------|-----------|---------|
| **Filesystem ไม่ writeable** | `saveSettings` ใช้ `fs.writeFileSync` | ❌ **Vercel/Netlify**: fail เงียบ — save ไม่ได้ |
| **Catch block เงียบ** | `catch { }` ไม่มี log | ⚠️ Developer ไม่รู้ว่าสำเร็จหรือไม่ |
| **Cache หายตอน refresh** | `cachedSettings` อยู่แค่ runtime | 🔄 **Refresh = กลับไป DEFAULT** |
| **Merge logic ผิดทาง** | `{ ...DEFAULT, ...data }` → DB/JSON ทับด้วย DEFAULT | 🧩 ข้อมูลที่เซฟถูก DEFAULT ทับ |
| **ไม่มี DB table** | ไม่มี `site_settings` ใน Supabase | 🏗️ ต้องพึ่ง filesystem อย่างเดียว |

---

## 🛠️ สิ่งที่แก้ไข

### 1. `lib/site-settings.ts` — ย้าย File System → Supabase Database

**ไฟล์หลักที่สุด** — rewrite ฟังก์ชัน `getSettings()` และ `saveSettings()` ใหม่ทั้งหมด

#### ก่อน (File System)

```typescript
export function getSettings(): SiteSettings {
  if (cachedSettings) return cachedSettings;
  try {
    const fs = require("fs");
    const path = require("path");
    const SETTINGS_PATH = path.join(process.cwd(), "data", "site-settings.json");
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
      const settings = { ...DEFAULT_SETTINGS, ...data, googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || "" };
      cachedSettings = settings;
      return settings;
    }
  } catch {
    // Fall through to default (serverless environment or file not found)
  }
  const settings = { ...DEFAULT_SETTINGS, googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || "" };
  cachedSettings = settings;
  return settings;
}
```

#### หลัง (Supabase)

```typescript
export async function getSettings(): Promise<SiteSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .single();
    if (error || !data) { ... return DEFAULT_SETTINGS; }
    cachedSettings = dbRowToSettings(data);
    // ✅ Sync locale tiers
    setLocaleTiers(cachedSettings.localeTiers);
    return cachedSettings;
  } catch (err: any) { ... return DEFAULT_SETTINGS; }
}
```

**การเปลี่ยนแปลงหลัก:**
- `import { createAdminClient }` → ใช้ Supabase service role
- `async` ทั้งหมด — รอ DB response
- ไม่มี `fs`, `path` — ทำงานใน serverless environment ได้
- เพิ่ม `dbRowToSettings()` — แปลง **snake_case DB → camelCase TypeScript**
- เพิ่ม `settingsToDbRow()` — แปลง **camelCase TypeScript → snake_case DB**
- `catch` block มี `console.error` — developer เห็น error
- ✅ เรียก `setLocaleTiers()` เพื่อ sync locale tiers → locales.ts runtime cache

### 2. `app/api/admin/settings/route.ts` — `await` ให้ถูกต้อง

### 3. `migrations/013_site_settings.sql` — ตารางใหม่

```sql
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Vibe',
  -- ... 40+ คอลัมน์
  locale_tiers JSONB DEFAULT '{"en":"1","th":"1","zh":"1","ja":"1","es":"1","pt":"1","fr":"2","ko":"2","de":"2","ru":"2","ar":"2","hi":"2","it":"2","vi":"2","ms":"2"}',
);
```

**RLS Policies:** `authenticated` → SELECT, INSERT, UPDATE, DELETE

---

## ✅ วิธีการทำงานหลังจากแก้

### Flow

```
              ┌─────────────────────┐
              │   SettingsProvider   │  client component
              └────────┬────────────┘
                       │ mount
                       ▼
              GET /api/admin/settings
                       │ await getSettings()
                       ▼
              Supabase SELECT * FROM site_settings
                       │ row → camelCase → setLocaleTiers()
                       ▼
              useSettings() → settings.localeTiers
```

### เมื่อ User Save ใน /admin/settings:
```
              POST /api/admin/settings { localeTiers: {...}, ... }
                       │ saveSettings()
                       ▼
              Supabase UPSERT site_settings
                       │ setLocaleTiers() → locales.ts runtime ✅
                       ▼
              Response → OK → Refresh → ค่าเดิม ✅
```

---

## 🧠 Lesson Learned

| บทเรียน | รายละเอียด |
|---------|-----------|
| **อย่าใช้ filesystem ใน serverless** | `fs.writeFileSync` fail เงียบ |
| **Catch block ต้องมี log** | `catch { }` เงียบ = หา bug ไม่เจอ |
| **DB-backed ดีกว่า file-backed** | Persistent ตลอดกาล |
| **snake_case ↔ camelCase ต้องมี helper** | Supabase snake_case → TypeScript camelCase |
| **`await` ทุกที่** | ถ้าเปลี่ยน `sync` → `async` ต้องอัปเดต caller |
| **Locale tiers ต้อง sync ตลอด** | เรียก `setLocaleTiers()` ทุก get/save settings |

---

## ⚙️ Language Tiers (เพิ่มเติมจาก original fix)

ตอนนี้ `site_settings` รองรับ `locale_tiers` (JSONB) สำหรับกำหนด Tier ภาษาแบบ dynamic

ดูรายละเอียดเพิ่ม:
- `docs/01-locale-system-notes.md` — ระบบ locale tiers
- `docs/05-microsite-inherit.md` — Microsite inherit + locale tiers override

---

> **Branch:** `vibe-overconda-space`  
> **Last updated:** 2025-06-03
