# 🔑 OAuth Login Settings Flow — Google & Facebook Login

> ระบบ Login ผ่าน Google / Facebook สำหรับ Admin Panel  
> คีย์ OAuth สามารถเก็บได้ทั้ง **Environment Variable (ENV)** และ **Database (Settings page)**  
> ระบบจะตรวจสอบ ENV ก่อน ถ้าไม่มีจึงใช้ค่าจาก DB

---

## 📌 สรุป Architecture

```
Admin Login Page
├── ปุ่ม Google Login
│   ├── client เรียก `isGoogleOAuthConfigured()` → server action
│   │   ├── เช็ค process.env.AUTH_GOOGLE_CLIENT_ID + _SECRET ก่อน
│   │   └── ถ้าไม่มี → fallback to site_settings.googleOAuthClientId + ...Secret
│   ├── ถ้า configured → ปุ่ม active (disabled ถ้าไม่)
│   └── เมื่อคลิก → signInWithGoogle() → สร้าง OAuth URL → redirect
│
├── ปุ่ม Facebook Login
│   └── (logic เดียวกัน)
│
└── Email/Password Login (ยังคงใช้ Supabase auth)

Admin Settings Page (API Keys section)
├── Google OAuth
│   ├── Client ID (text)
│   └── Client Secret (password field)
├── Facebook OAuth
│   ├── App ID (text)
│   └── App Secret (password field)
└── แสดง badge status: ENV / DB / —
```

---

## 🔐 Environment Variables

| Variable | จำเป็น | ไว้ทำอะไร | ตัวอย่าง |
|----------|--------|-----------|---------|
| `AUTH_GOOGLE_CLIENT_ID` | ❓ ถ้าต้องการ Google Login | Google OAuth Client ID | `123456789-xxxxx.apps.googleusercontent.com` |
| `AUTH_GOOGLE_CLIENT_SECRET` | ❓ ถ้าต้องการ Google Login | Google OAuth Client Secret | `GOCSPX-xxxxxxxxxxxx` |
| `AUTH_FACEBOOK_CLIENT_ID` | ❓ ถ้าต้องการ Facebook Login | Facebook App ID | `123456789012345` |
| `AUTH_FACEBOOK_CLIENT_SECRET` | ❓ ถ้าต้องการ Facebook Login | Facebook App Secret | `xxxxxxxxxxxxxxxx` |

> ⚠️ **ไม่ set = ไม่มีปุ่ม Google/Facebook Login**  
> หรือสามารถตั้งค่าผ่าน Settings Page ใน Admin (เก็บใน DB) แทนได้

---

## 📂 Files ที่เกี่ยวข้อง

| File | Role | Type |
|------|------|------|
| `app/admin/login/login-client.tsx` | UI หน้า Login — ปุ่ม Google, Facebook | Client Component |
| `app/admin/login/actions.ts` | Server Actions: `signInWithGoogle()`, `signInWithFacebook()`, `isGoogleOAuthConfigured()`, `isFacebookOAuthConfigured()` | Server Action |
| `lib/site-settings.ts` | เก็บ OAuth keys ใน `SiteSettings` interface + DB mapping | Server Library |
| `app/api/admin/settings/route.ts` | API GET/POST settings — ส่ง OAuth sources ไปด้วย | API Route |
| `app/admin/settings/page.tsx` | UI Settings — ส่วน API Keys > OAuth | Client Component |
| `supabase/migrations/00001_initial_schema.sql` | `site_settings` table columns (ต้อง migrates) | Migration |
| `.env.local` | Environment Variables สำหรับ dev | Config |

---

## 🗄️ Database Schema

คอลัมน์ OAuth ใน `site_settings` table (snake_case):

```sql
-- ต้องเพิ่ม migration:
ALTER TABLE site_settings 
  ADD COLUMN google_oauth_client_id TEXT,
  ADD COLUMN google_oauth_client_secret TEXT,
  ADD COLUMN facebook_oauth_client_id TEXT,
  ADD COLUMN facebook_oauth_client_secret TEXT;
```

Mapping (snake_case ↔ camelCase):

| DB Column | SiteSettings Field | Env Variable |
|-----------|-------------------|--------------|
| `google_oauth_client_id` | `googleOAuthClientId` | `AUTH_GOOGLE_CLIENT_ID` |
| `google_oauth_client_secret` | `googleOAuthClientSecret` | `AUTH_GOOGLE_CLIENT_SECRET` |
| `facebook_oauth_client_id` | `facebookOAuthClientId` | `AUTH_FACEBOOK_CLIENT_ID` |
| `facebook_oauth_client_secret` | `facebookOAuthClientSecret` | `AUTH_FACEBOOK_CLIENT_SECRET` |

---

## 🧠 Priority Logic (ENV vs DB)

เมื่อระบบเช็คว่า OAuth ถูกตั้งค่าหรือไม่:

```
isGoogleOAuthConfigured() หรือ signInWithGoogle():
  1. เช็ค process.env.AUTH_GOOGLE_CLIENT_ID + _SECRET
     ├── มีทั้งคู่ → ✅ ใช้ค่า ENV (return true)
     └── ไม่มีตัวใดตัวหนึ่ง → ไป step 2
  2. Fallback: getSettings() → settings.googleOAuthClientId + ...Secret
     ├── มีทั้งคู่ → ✅ ใช้ค่า DB (return true)
     └── ไม่มี → ❌ ไม่ configured (return false)
```

**ข้อควรรู้:**
- ENV มี priority สูงกว่า DB เสมอ
- ถ้าใส่ค่าทั้ง ENV และ DB → ระบบใช้ค่า ENV
- Settings Page แสดง badge: `ENV` (amber), `DB` (emerald), หรือ `—` (none)
- ถ้าต้องการใช้ค่าจาก DB แทน ENV — ให้ลบหรือล้างค่า ENV นั้นออก

---

## 🔄 Flow การทำงาน

### ฝั่ง Admin Login Page

```
User เปิด /admin/login
  └─► login-client.tsx mount
      ├─ useEffect → เรียก isGoogleOAuthConfigured(), isFacebookOAuthConfigured()
      │   ├─ ผ่าน ENV check → true
      │   ├─ Fallback DB check → true/false
      │   └─ setGoogleEnabled(boolean), setFacebookEnabled(boolean)
      └─ configChecked = true
      
  └─► Render ปุ่ม
      ├─ configured → active (คลิกได้, hover effect)
      └─ not configured → disabled + แสดง "ยังไม่ได้ตั้งค่า"
```

### ฝั่ง Settings Page (Admin)

```
Admin เปิด /admin/settings
  └─► GET /api/admin/settings
      └─ sources: {
            googleOAuthClientId: "env" | "db" | "none",
            googleOAuthClientSecret: "env" | "db" | "none",
            facebookOAuthClientId: "env" | "db" | "none",
            facebookOAuthClientSecret: "env" | "db" | "none",
          }

Admin กรอก Client ID / Client Secret
  └─► กด Save → POST /api/admin/settings
      └─► saveSettings() → UPSERT site_settings
          ├─ fields ที่มีค่า → บันทึกลง DB
          └─ fields ที่ว่างเปล่า → เก็บ null (fallback เป็น ENV)
```

---

## 🖥️ UI Components

### 1. Login Page (`app/admin/login/login-client.tsx`)

```tsx
// ปุ่ม Google
<button
  onClick={handleGoogleLogin}
  disabled={loading || !configChecked || !googleEnabled}
  className={`... ${
    googleEnabled
      ? "active button style"
      : "disabled style + 'ยังไม่ได้ตั้งค่า' label"
  }`}
>
  <GoogleIcon /> เข้าสู่ระบบด้วย Google
</button>

// ปุ่ม Facebook (pattern เดียวกัน)
```

### 2. Settings Page (`app/admin/settings/page.tsx`)

```
┌─────────────────────────────────────┐
│  🔑 API Keys                        │
│  ─────────────────────────────────  │
│  Google AI (Gemini)        ✓        │
│  Claude API                ✓        │
│  Google Analytics           G-xxx   │
│  ─────────────────────────────────  │
│  🔐 OAuth Keys                     │
│                                     │
│  ┌─ Google OAuth ────────────────┐  │
│  │  [Client ID ..................│  │
│  │  [Client Secret ..............│  │
│  │  (badge: ENV | DB | —)        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ Facebook OAuth ──────────────┐  │
│  │  [App ID ....................│  │
│  │  [App Secret ................│  │
│  │  (badge: ENV | DB | —)        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🧪 วิธีทดสอบ

### ทดสอบว่า OAuth Keys ถูกดึงมาใช้

```bash
# 1. ตั้งค่าใน Environment Variables (local .env.local)
AUTH_GOOGLE_CLIENT_ID=123-test.apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=GOCSPX-test-secret

# 2. run dev
npm run dev

# 3. เปิด /admin/login → ดู DevTools Network
#    เรียก /api/admin/settings → sources.googleOAuthClientId === "env"

# 4. ลบ ENV ออกจาก .env.local → restart
#    หน้า login ควรแสดง "ยังไม่ได้ตั้งค่า"
```

### ทดสอบ Settings Page

```bash
# 1. เปิด /admin/settings → เลื่อนไป API Keys
# 2. กรอก Google OAuth Client ID, Client Secret
# 3. กด Save → ควรเห็น success
# 4. Refresh → ค่าควรยังอยู่
#    badge: DB (emerald)
# 5. ล้างค่า → Save → badge: — (none)
```

---

## 🔄 การ Migration

ถ้า `google_oauth_client_id` ฯลฯ ยังไม่มีใน `site_settings` table:

```sql
ALTER TABLE site_settings 
  ADD COLUMN google_oauth_client_id TEXT,
  ADD COLUMN google_oauth_client_secret TEXT,
  ADD COLUMN facebook_oauth_client_id TEXT,
  ADD COLUMN facebook_oauth_client_secret TEXT;
```

หรือสร้างไฟล์ migration ใหม่: `supabase/migrations/00005_oauth_settings.sql`
