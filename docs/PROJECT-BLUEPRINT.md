# UnFake News — Project Blueprint

> **Blueprint สถาปัตยกรรมและโครงสร้างโดยรวมของโปรเจกต์**
> ใช้เป็นเอกสารอ้างอิงหลักฉบับย่อ (overview) สำหรับนักพัฒนาที่เข้ามาทำงานใหม่
> อ่านคู่มือละเอียดแต่ละส่วนใน `docs/*.md` เพิ่มเติมได้

**Tech Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Supabase (PostgreSQL) · Gemini AI (Translation)

---

## 1. ภาพรวม (Overview)

เว็บแพลตฟอร์ม **ข่าวสาร / บทความ / Fact-Checking** (ต่อต้าน Fake News) แบบหลายภาษา รองรับ 15 ภาษา
มีระบบหลัก 3 ส่วน:

1. **Front-end / Public Site** — หน้าเว็บหลักแบบ multiple-locale (`/th`, `/en`, `/ja`, ...) + SEO
2. **Admin Panel** — จัดการบทความ, ผู้ใช้, หมวดหมู่, แปลภาษา, Hero Slides, Microsites, Highlight, Settings
3. **Microsites** — โปรเจกต์ย่อยใน subdomain ที่ใช้บทความแยกระบบ (`.is("microsite_id", null)` filter)


---

## 2. Stack & Dependencies

| Layer | เทคโนโลยี |
|-------|-----------|
| Framework | Next.js `^14.2.29` (App Router, Server Components) |
| UI | React `^18.3.1`, Tailwind CSS `^3.4.18`, lucide-react |
| Editor | Tiptap (rich text editor) |
| DB / Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Translation AI | Gemini (`lib/gemini-service.ts`) |
| Styling | `clsx`, `tailwind-merge`, `class-variance-authority`, CSS variables (dynamic theming) |

---

## 3. โครงสร้าง Directory (Principal)

```
.
├── app/                    # Next.js App Router
│   ├── [lang]/             # ★ Public site หลายภาษา
│   │   ├── layout.tsx      #   root layout (settings, header, footer, GA, ads, maintenance)
│   │   ├── page.tsx        #   หน้าแรก (Home)
│   │   ├── about/  articles/  contact/  privacy/  terms/
│   │   └── articles/[slug]/ # หน้า article detail
│   ├── admin/              # ★ Admin Panel (session จาก sessionStorage)
│   │   ├── articles/       #   รายการบทความ + edit/new
│   │   ├── highlights/     #   ★ จัดการไฮไลต์ (featured) หน้าหลัก
│   │   ├── categories/  users/  translations/  stats/  hero-slides/
│   │   ├── pages/  entity-facts/  microsites/  notifications/  settings/
│   │   ├── login/  logout/  dashboard-client.tsx
│   ├── api/                # ★ REST API (serverless routes)
│   │   ├── admin/          #   articles (CRUD), categories, settings, translations, users, ...
│   │   ├── hero-slides/  settings/  translate-*/  upload/
│   ├── microsite/          # Microsite pages (subdomain)
│   ├── page.tsx            # Redirect → /en
│   ├── robots.ts  sitemap.ts  error.tsx  not-found.tsx
├── components/             # UI components
│   ├── home/  about/  articles/  contact/  layout/  analytics/  ui/
│   ├── admin/              # admin UI (sidebar, editors, settings-context...)
│   ├── microsite/  schema-article.tsx  schema-entity-quickfacts.tsx
├── lib/                    # business logic / services / types
│   ├── article-service-supabase.ts  site-settings.ts  locales.ts
│   ├── auth-service-supabase.ts  auth-types.ts  supabase-*.ts
│   ├── gemini-service.ts  translate-service.ts  microsite-service.ts
│   ├── translations.ts    # ★ UI translation dictionary (15 ภาษา)
│   └── types.ts  wiki-*.ts  notifications  user-store  ...
├── migrations/             # SQL migrations (012-018)
├── supabase/               # schema reference + migrations
├── docs/                   # เอกสาร
├── public/  data/  Users/  middleware.ts  next.config.mjs  tailwind.config.ts
```

---

## 4. ระบบ Localization / ภาษา (15 ภาษา)

ไฟล์หลัก: `lib/locales.ts` + `lib/translations.ts`

- **15 ภาษา:** `en, th, zh, ja, es, pt, fr, ko, de, ru, ar, hi, it, vi, ms`
- **Tier ระบบ (locale_tiers เก็บใน DB `site_settings`):**
  - `"0"` = Disabled (ไม่แสดง, route redirect → `/en`)
  - `"1"` = แสดงใน header + แปลทันที (default 6: th, en, zh, ja, es, pt)
  - `"2"` = JIT แปลตามคำขอ ไม่โชว์ใน header
- **Path:** `/[lang]/...` — middleware (`middleware.ts`) ตรวจจับ locale → save cookie → redirect
- **การแปลบทความ:** ใช้ Gemini (API) เก็บลงตาราง `translations`
- **UI text:** ใช้ helper `t(key, locale)` จาก `lib/translations.ts`

---

## 5. ฐานข้อมูล Supabase (Core Tables)

> Details เต็มใน `supabase/SCHEMA_REFERENCE.md` + `migrations/`

| Table | หน้าที่หลัก |
|-------|-------------|
| `articles` | บทความต้นฉบับ (ไทย) + metadata incl. `featured`, `status`, wiki-style fields |
| `translations` | เนื้อหาที่แปลแล้ว (UNIQUE `(article_id, locale)`) |
| `categories` | หมวดหมู่ (name_th/name_en) |
| `profiles` | ผู้ใช้ (role: admin/editor/writer) |
| `hero_slides` | สไลด์หน้าแรก (carousel) |
| `site_settings` | การตั้งค่าเว็บ, themes, OAuth, API keys, locale_tiers |

**Custom enums:** `user_role` (`admin/editor/writer`), `translation_status` (`complete/summary_only/pending`)

**Index หลัก:** `articles(featured)`, `articles(published_at DESC)`, `translations(article_id)`, `translations(locale)`

---

## 6. Authentication / Authorization

- **Public login:** Email/password + **Google OAuth** (login page)
- **Admin:** session เก็บใน `sessionStorage` (key `siam_admin_session`) ตรวจที่หน้า admin
- **Permission system:** `lib/auth-types.ts` → role-based map `ROLE_PERMISSIONS`
  - Roles: `unassigned`, `writer`, `editor`, `admin`
  - Permissions: `article:create/edit_own/edit_any/delete/publish/...`, `user:*`, `settings:*`, `admin:access`
- **API guard:** `lib/auth-service.ts` (`getCurrentSession`, `requirePermission`) + `lib/supabase-server.ts` (`createAdminClient` bypass RLS)
- **Client fetch admin:** ใช้ header `x-session-data` (base64 JSON) เมื่อเรียก admin API

---

## 7. บทความ & Highlight (Featured)

- **ตาราง `articles.featured`** (BOOLEAN, index) = บทความเด่น/ไฮไลต์
- **Home page** (`components/home/home-page.tsx`):
  - Highlight section: ดึง `getFeaturedSummaries()` (featured)
  - Logic: ถ้า featured ≥ 3 → แสดง 6 อัน; ถ้า < 3 → ใช้ latest มาเติมให้ครบ 6
  - Latest Articles section: 3 บทความล่าสุด
- **Admin จัดการ:**
  - ปุ่ม toggle ★ ในหน้ารายการบทความ (`article-list-client.tsx`) — editor/admin
  - หน้าแยก `/admin/highlights` (`highlights-client.tsx`) — มี search, filter, จำกัด 6 อัน
  - เมนู sidebar "ไฮไลต์ (หน้าหลัก)"
- **API:** `PUT /api/admin/articles/[slug]` ด้วย `{ featured: bool }`

---

## 8. Admin Panel (เมนู sidebar)

Admin sidebar (`components/admin/admin-sidebar.tsx`) มีหน้า:

1. **แดชบอร์ด** `/admin`
2. **บทความ** `/admin/articles` (list + editor)
3. **ไฮไลต์ (หน้าหลัก)** `/admin/highlights`
4. **หน้า** `/admin/pages`
5. **Hero Slides** `/admin/hero-slides`
6. **ผู้ใช้งาน** `/admin/users`
7. **สถิติ** `/admin/stats`
8. **การแปลภาษา** `/admin/translations`
9. **หมวดหมู่** `/admin/categories`
10. **Entity Facts** `/admin/entity-facts`
11. **แจ้งเตือน** `/admin/notifications`
12. **Microsites** `/admin/microsites` (admin only)
13. **ตั้งค่า** `/admin/settings` (admin only)

พร้อมกันนี้ sidebar มีระบบ notification (`notification-store.ts` + `<NotificationBell/>`)

---

## 9. API Endpoints (summary)

| Route | METHOD | หน้าที่ |
|-------|--------|--------|
| `/api/admin/articles` | GET/POST | รายการทั้งหมด / สร้างบทความ |
| `/api/admin/articles/[slug]` | GET/PUT/DELETE | อ่าน/แก้ไข (incl. feature)/ลบ |
| `/api/admin/categories` | GET/... | หมวดหมู่ |
| `/api/admin/settings` | GET/PUT | site settings |
| `/api/admin/users` | GET/... | manage users |
| `/api/admin/translations` | GET/PUT | manage translations |
| `/api/admin/maintenance` | GET/PUT | maintenance mode |
| `/api/admin/microsites` | ... | microsites |
| `/api/hero-slides` (+ `/reorder`) | GET/POST/PUT | hero slides |
| `/api/settings/tiers` | GET/PUT | locale tier config |
| `/api/translate-new` `/translate-content` `/translate-all` | POST | AI translation |
| `/api/upload` | POST | image upload |

---

## 10. Feature Flags & Integrations

- **Google Analytics** — `components/analytics/google-analytics.tsx`
- **AdSense** — `components/analytics/adsense.tsx` (`AdUnit`)
- **Cookie Consent** — `components/analytics/cookie-consent.tsx`
- **Google OAuth** — settings + login (env: `AUTH_GOOGLE_CLIENT_ID/SECRET`)
- **SEO:** `generateMetadata` (hreflang, OG, twitter), `sitemap.ts`, `robots.ts`, JSON-LD schema (`schema-article.tsx`, `schema-entity-quickfacts.tsx`)
- **Theming:** dynamic CSS variables ผ่าน `SettingsProvider`/`settings-context.tsx`

---

## 11. Deployment & Env

- **Platform:** Vercel (deploy → `git push` / CI)
- **Env หลัก:** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_TAGLINE`, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AUTH_GOOGLE_CLIENT_ID`/`SECRET`, API keys (`GEMINI_API_KEY`, ...), `NEXT_PUBLIC_ADSENSE_*` เป็นต้น
- ⚠️ ตั้ง PATH node/npm ใน Codespace ตาม `docs/codespace-node-setup.md`

---

## 12. การทำงานร่วมกัน (Workflow)

1. Pull `/` → แก้โค้ด → `git add/commit` → `push` (Vercel auto deploy)
2. Migration: ใส่ SQL ใน `supabase/migrations/` (ใช้ numbering ต่อจาก 018)
3. ตรวจสอบ: `npx tsc --noEmit` (type check) → `npm run build`

---

## 13. เอกสารอื่นๆ ใน `docs/`

| ไฟล์ | เนื้อหา |
|------|---------|
| `CLONE_SETUP_GUIDE.md` | setup project ใหม่ |
| `MIGRATION_CHECKLIST.md` / `PRE_MERGE_CHECKLIST.md` | checklist ก่อน deploy |
| `env-variables-guide.md` | env vars ทั้งหมด |
| `translation-*.md` / `wiki-style-refactoring.md` | architecture ของ translation & wiki |
| `oauth-login-settings-flow.md` | Google OAuth flow |
| `microsite-inherit.md` / `subdomain-overconda-space.md` | microsites |
| `codespace-node-setup.md` | setup node PATH ใน Codespace |
| 01–13 *.md | รายละเอียด feature เฉพาะ |

> นี่คือ blueprint ระดับสูง (overview) — ดูไฟล์แต่ละ feature เพิ่มเติมได้ตามอ้างอิง
