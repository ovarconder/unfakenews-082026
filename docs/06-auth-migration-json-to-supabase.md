# 🔐 Auth Migration: JSON-based → Supabase Auth

> **Commit:** `f28bc90`  
> **วันที่:** 2025-06-XX  
> **ไฟล์ที่แก้ไข:** 8 ไฟล์  
> **ปัญหาเดิม:** Login ไม่ได้, password ไม่ถูก, ไม่ persist

---

## 🔴 ปัญหาที่เจอ

### อาการ
1. เข้า `/admin/login` → ใส่อีเมล + รหัสผ่านที่ถูกต้อง
2. แจ้ง **"อีเมลหรือรหัสผ่านไม่ถูกต้อง"** ตลอด
3. สร้าง user ใน Supabase Auth แล้วก็ยังเข้าไม่ได้

### สาเหตุ (ราก)

ระบบเดิมใช้ **JSON-based user store + homemade JWT** ซึ่งมีสถาปัตยกรรมดังนี้:

```
Login flow (ก่อนแก้):
  loginClient → loginAdmin(email, password)
      ↓ Server Action
      ↓ auth-service.login()
      ↓ user-store.authenticateUser() ← เปรียบเทียบ SHA256 hash
      ↓ FALLBACK_USERS (hardcoded) ← ไม่สนใจ Supabase Auth users
      ↓ ไม่ match → return null → "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
```

| ปัญหา | รายละเอียด | ผลกระทบ |
|-------|-----------|---------|
| **FALLBACK_USERS hardcoded** | user ถูก hardcode ใน `lib/user-store.ts` | ❌ ไม่สนใจ Supabase Auth users |
| **SHA256 hash** | ใช้ crypto hash เปรียบเทียบเอง | ❌ ไม่ใช้ password ของ Supabase Auth |
| **Homemade JWT** | เขียน JWT เอง (HS256) ไม่ใช้ Supabase session | ❌ session ไม่ refresh อัตโนมัติ |
| **File system** | พยายามเขียน `data/users.json` | ❌ fail ใน serverless (Netlify) |

---

## 🛠️ สิ่งที่แก้ไข

### สถาปัตยกรรมใหม่

```
Login flow (หลังแก้):
  loginClient → loginAdmin(email, password)
      ↓ Server Action
      ↓ auth-service.login()
      ↓ Supabase Auth: signInWithPassword(email, password) ✅
      ↓ ถ้าสำเร็จ → Supabase session cookie ✅ (httpOnly)
      ↓ getCurrentSession()
          ↓ supabase.auth.getSession() ✅
          ↓ SELECT * FROM profiles WHERE id = user.id
          ↓ return { id, email, name, role }
```

### ไฟล์ที่เปลี่ยนแปลง

| # | ไฟล์ | การเปลี่ยนแปลง | เหตุผล |
|---|------|---------------|--------|
| 1 | **`lib/user-store.ts`** | 🔄 เขียนใหม่ทั้งหมด | Supabase profiles + auth.users แทน FALLBACK_USERS |
| 2 | **`lib/auth-service.ts`** | 🔄 เขียนใหม่ทั้งหมด | Supabase Auth session แทน homemade JWT |
| 3 | **`app/admin/login/actions.ts`** | ✅ เปลี่ยน import | ใช้ auth-service.login() |
| 4 | **`app/admin/logout/route.ts`** | ✅ เปลี่ยน import | ใช้ auth-service.logout() แทน auth-service-supabase |
| 5 | **`app/admin/users/page.tsx`** | ✅ `await listUsers()` | listUsers กลายเป็น async |
| 6 | **`app/api/admin/users/route.ts`** | ✅ `await` | CRUD กลายเป็น async |
| 7 | **`app/api/admin/users/[id]/route.ts`** | ✅ `await` | CRUD กลายเป็น async |
| 8 | **`app/api/auth/change-password/route.ts`** | ✅ ใช้ `auth.updateUser()` | Supabase API แทน file-based |

---

## 📋 รายละเอียดแต่ละไฟล์

### 1. `lib/user-store.ts` — หัวใจหลัก 🫀

**ก่อน (JSON-based):**

```typescript
const FALLBACK_USERS: User[] = [
  {
    id: "f69a5993-...",
    email: "admin@vibe.overconda.space",
    passwordHash: "ecb42295...", // SHA256 of "password123"
    role: "admin",
    // ...
  },
];

function getUsers(): User[] {
  // ลองอ่านจาก data/users.json → ไม่มี → ใช้ FALLBACK_USERS
}

export function authenticateUser(email, password): UserPublic | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  const hash = hashPassword(password); // crypto SHA256
  if (hash !== user.passwordHash) return null;
  return toPublic(user);
}
```

**หลัง (Supabase):**

```typescript
export async function authenticateUser(email, password): Promise<UserPublic | null> {
  const supabase = createAdminClient();
  
  // ✅ ใช้ Supabase Auth จริง
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password,
  });
  
  if (error || !data.user) return null;
  
  // ✅ ดึง profile จาก public.profiles
  const profiles = await fetchAllProfiles();
  const profile = profiles.find(p => p.id === data.user.id);
  
  // ✅ ถ้าไม่มี profile → สร้างให้อัตโนมัติ
  if (!profile) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      name: data.user.email?.split("@")[0],
      role: "admin",
    });
  }
  
  return {
    id: data.user.id,
    email: data.user.email,
    name: profile?.name || data.user.email,
    role: profile?.role || "admin",
  };
}
```

**ฟังก์ชันอื่น ๆ ที่เปลี่ยนเป็น async:**

| ฟังก์ชันเดิม (sync) | ฟังก์ชันใหม่ (async) |
|--------------------|--------------------|
| `getUserByEmail()` | `getUserByEmail()` → `await` |
| `getUserById()` | `getUserById()` → `await` |
| `listUsers()` | `listUsers()` → `await` |
| `createUser()` | `createUser()` → `await` → `auth.admin.createUser()` |
| `updateUser()` | `updateUser()` → `await` → `profiles.update()` + `auth.admin.updateUserById()` |
| `deleteUser()` | `deleteUser()` → `await` → `auth.admin.deleteUser()` |

### 2. `lib/auth-service.ts` — Session Management

**ก่อน (Homemade JWT):**

```typescript
const SESSION_COOKIE = "siamheritage_session";

function createToken(payload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256" }));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(header, encodedPayload, getSecretKey());
  return `${header}.${encodedPayload}.${signature}`;
}

export async function createSession(userId, email, role): Promise<string> {
  const payload = { userId, email, role, exp: Date.now() + 86400 };
  const token = createToken(payload);
  cookies().set(SESSION_COOKIE, token, { httpOnly: true, ... });
  return token;
}
```

**หลัง (Supabase session cookies):**

```typescript
export async function getCurrentSession() {
  const supabase = await createClient();
  // ✅ ใช้ Supabase Auth session โดยตรง
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) return { user: null, session: null };
  
  // ✅ ดึง profile จาก profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: profile?.name || "User",
      role: profile?.role || "writer",
    },
    session,
  };
}

export async function login(email, password) {
  // ✅ Supabase Auth เป็นคนจัดการ session cookie ให้เอง
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password,
  });
  // ...
}
```

**ข้อดีของการใช้ Supabase session:**
- Session cookie ถูกจัดการอัตโนมัติ (set, refresh, expire)
- ใช้ `@supabase/ssr` (server-side rendering) — refresh token อัตโนมัติ
- ไม่ต้องเขียน JWT เอง, ไม่ต้องจัดการ secret key
- ปลอดภัยกว่า (SameSite, httpOnly, Secure)

---

## 🔄 Data Flow เปรียบเทียบ

### ก่อน (JSON-based)

```
Client                     Server                        Supabase
  │                          │                             │
  │── POST /admin/login ────►│                             │
  │   { email, password }    │                             │
  │                          │                             │
  │                          ├── hashPassword(password)    │
  │                          ├── compare with FALLBACK     │
  │                          │   _USERS[].passwordHash     │
  │                          │                             │
  │                          ├── create homemade JWT       │
  │                          │   { userId, role, exp }     │
  │                          │                             │
  │◄── set cookie ───────────┤                             │
  │    siamheritage_session  │                             │
```

### หลัง (Supabase Auth)

```
Client                     Server                        Supabase
  │                          │                             │
  │── POST /admin/login ────►│                             │
  │   { email, password }    │                             │
  │                          ├──► signInWithPassword ─────►│
  │                          │◄── session cookie ─────────┤
  │                          │    sb-xxxx-auth-token       │
  │                          │                             │
  │                          ├── SELECT * FROM profiles ──►│
  │                          │◄── { name, role } ─────────┤
  │                          │                             │
  │◄── 200 OK ──────────────┤                             │
  │    { user, session }    │                             │
```

---

## ✅ วิธีใช้งาน (สำหรับ Admin)

### การ Login

1. ไปที่ `/admin/login`
2. ใส่อีเมล + รหัสผ่านที่สร้างใน **Supabase Auth**
3. ถ้า login สำเร็จ → session จะถูก manage โดย Supabase อัตโนมัติ

### การสร้าง User (กรณียังไม่มี)

สามารถสร้าง user ได้ 2 วิธี:

#### วิธีที่ 1: Supabase Dashboard (แนะนำ ✅)
1. ไปที่ **Supabase Dashboard** → **Authentication** → **Users**
2. กด **Add User**
3. ใส่ email + password
4. ไปที่ **SQL Editor** → รัน:
```sql
INSERT INTO profiles (id, name, role)
VALUES ('USER_ID_FROM_AUTH', 'ชื่อผู้ใช้', 'admin');
```

#### วิธีที่ 2: รอ auto-create (login ครั้งแรก)
1. สร้าง user ใน Supabase Auth ก่อน
2. Login ที่ `/admin/login`
3. ระบบจะสร้าง profile ให้อัตโนมัติ (default role = "admin")

### Environment Variables ที่จำเป็น

| Variable | จำเป็น | คำอธิบาย |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **ใช้ใน admin API** — จำเป็นสำหรับ CRUD users |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ต้องมีใน Netlify Environment Variables ด้วย เพราะ `createAdminClient()` ใช้ key นี้ในการเรียก `auth.admin.*` APIs

---

## 🗺️ Field Mapping

### `public.profiles` table

| Column | Type | คำอธิบาย |
|--------|------|----------|
| `id` | UUID | อ้างอิง `auth.users.id` (Primary Key) |
| `name` | TEXT | ชื่อผู้ใช้ |
| `role` | TEXT | `admin` / `editor` / `writer` |
| `avatar_url` | TEXT | URL รูปโปรไฟล์ |
| `created_at` | TIMESTAMPTZ | วันที่สร้าง |
| `updated_at` | TIMESTAMPTZ | วันที่แก้ไขล่าสุด |

### Interface → DB → Usage

| Interface Field (camelCase) | DB Column (snake_case) | ใช้งานที่ไหน |
|----------------------------|------------------------|-------------|
| `user.id` | `auth.users.id` | Session, API routes |
| `user.email` | `auth.users.email` | Login, Display |
| `user.name` | `profiles.name` | Admin UI |
| `user.role` | `profiles.role` | Permission check |
| `user.avatar` | `profiles.avatar_url` | Admin UI |

---

## 🧪 ทดสอบว่าทำงาน

### 1. สร้าง Test User

ไปที่ Supabase Dashboard → Authentication → Users → Add User:

| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `test1234` |

### 2. รัน SQL เพื่อตั้ง role

```sql
INSERT INTO profiles (id, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'Test Admin',
  'admin'
);
```

### 3. Login

- ไปที่ `/admin/login`
- Email: `test@example.com`
- Password: `test1234`
- กด Login → ควรเข้า admin dashboard ได้ ✅

### 4. ตรวจสอบ Session Persist

- Login แล้ว refresh F5 → ควรยังอยู่ในระบบ ✅
- ลบ cookie → ต้อง login ใหม่ ✅
- ไป `/admin/logout` → logout และ redirect ไป login ✅

---

## 🧠 Lesson Learned

| บทเรียน | รายละเอียด |
|---------|-----------|
| **อย่า hardcode user ในโค้ด** | FALLBACK_USERS ทำให้ login ไม่ match กับ users จริงใน DB |
| **อย่าเขียน JWT เอง** | Supabase Auth จัดการ session + refresh + security ให้ครบ |
| **อย่าใช้ SHA256 hash password เอง** | Supabase Auth hashing + salting ปลอดภัยกว่า |
| **Type ต้องตรงกัน** | `string | null` ≠ `string | undefined` — TypeScript จะ error |
| **sync → async** | การเปลี่ยนเป็น Supabase query ทำให้ต้องเปลี่ยน caller ทั้งหมดเป็น async |
| **Service role key ต้องมี** | `createAdminClient()` ใช้ `SUPABASE_SERVICE_ROLE_KEY` — อย่าลืมตั้งใน Netlify |
| **Auto-create profile** | ถ้า profile ไม่มี → สร้างให้ตอน login ครั้งแรก (สะดวกตอน setup) |

---

## 📚 เอกสารอ้างอิง

- `docs/03-settings-persistence-fix.md` — ตัวอย่างการย้ายจาก File system → Supabase (similar pattern)
- `docs/04-adsense-settings-flow.md` — Dynamic settings via Supabase
- `lib/supabase-server.ts` — Supabase server client helper
- `lib/supabase-types.ts` — Database type definitions
- `lib/auth-types.ts` — Role, Permission types

> **Branch:** `develop/complete-website`  
> **Last updated:** 2025-06-XX  
> **Related docs:**  
> - `03-settings-persistence-fix.md` (settings persistence — File → Supabase)  
> - `04-adsense-settings-flow.md` (AdSense + settings flow)  
> - `05-microsite-inherit.md` (microsite inherit)
