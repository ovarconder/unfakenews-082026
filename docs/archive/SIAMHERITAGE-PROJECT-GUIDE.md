# 🏛️ Siam Heritage — Project Guide

> **ข่าวจริง ข้อมูลลึก เรื่องเล่าที่น่าเชื่อถือ**
> Next.js 15.3 + Supabase + Gemini AI + 15 Languages

---

## 📁 โครงสร้าง Project

```
siamheritage.org/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, GA, cookie consent)
│   ├── globals.css               # Tailwind CSS
│   ├── page.tsx                  # Landing page
│   ├── [locale]/                 # 15-language pages (dynamic routing)
│   │   ├── page.tsx              # Home per locale
│   │   ├── articles/
│   │   ├── about/
│   │   └── contact/
│   ├── microsite/                # ★ Microsite multi-site routing
│   │   └── [slug]/[lang]/        # /{slug}/{lang}/... routes
│   │       ├── layout.tsx        # Microsite layout (theme CSS vars)
│   │       ├── page.tsx          # Microsite home
│   │       ├── articles/
│   │       ├── about/
│   │       └── ...
│   ├── admin/                    # Admin panel
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── articles/
│   │   ├── hero-slides/
│   │   ├── translations/
│   │   └── microsites/           # ★ Super admin: manage microsites
│   │       ├── page.tsx          # List all microsites
│   │       ├── new/              # Create microsite
│   │       └── [slug]/           # Edit, manage articles
│   └── api/                      # API routes
│       ├── translate/            # Gemini translation trigger
│       ├── translate-content/    # JIT content translation
│       └── admin/                # CRUD APIs
│           └── microsites/       # ★ Microsite CRUD APIs
│
├── components/
│   ├── analytics/
│   │   ├── google-analytics.tsx  # GA component (consent-gated)
│   │   └── cookie-consent.tsx    # Cookie consent banner (15 langs)
│   ├── admin/                    # Admin panel components
│   │   └── hero-slide-editor.tsx # Hero slide create/edit form
│   ├── articles/
│   │   ├── article-card.tsx
│   │   ├── article-detail.tsx    # Client component with JIT translation + share buttons
│   │   └── schema-article.tsx    # JSON-LD structured data
│   ├── microsite/                # ★ Microsite-specific components
│   │   ├── microsite-header.tsx  # Navbar เฉพาะ microsite (logo, nav, lang, main-site link)
│   │   ├── microsite-footer.tsx
│   │   ├── microsite-home-content.tsx
│   │   └── microsite-article-detail.tsx  # Article detail + social share buttons
│   ├── layout/
│   │   ├── header.tsx            # Navigation (15 languages)
│   │   ├── footer.tsx
│   │   └── language-switcher.tsx
│   └── ui/                      # Reusable UI components
│
├── lib/                          # Core libraries
│   ├── locales.ts                # Language system (ALL 15 locales)
│   ├── types.ts                  # Core types (Article, etc.)
│   ├── microsite-types.ts        # ★ Microsite, MicrositeSettings, CustomNavLink types
│   ├── microsite-service.ts      # ★ CRUD, cache, fetch per-microsite articles
│   ├── supabase-types.ts         # Supabase DB types (Database<T>)
│   ├── supabase-server.ts        # Server client (with cookies)
│   ├── supabase-client.ts        # Browser client
│   ├── supabase-middleware.ts    # Session refresh helper
│   ├── gemini-service.ts         # AI translation (Gemini)
│   ├── translate-service.ts      # Re-export wrapper
│   ├── translation-store.ts      # ⚠️ SERVER-ONLY: File-based cache + locks
│   ├── translation-client-store.ts # Client-safe translation utils
│   ├── translations.ts           # Static UI text (15 languages)
│   ├── site-settings.ts          # Branding/settings store
│   └── constants.ts              # Build-time constants
│
├── translations/                 # 🗄️ Translation cache (git-ignored?)
│   └── {slug}/
│       ├── {locale}.json         # Cached translated article
│       ├── metadata.json         # Translation status per locale
│       └── .lock.{locale}        # Race condition lock (auto-expire 30s)
│
├── migrations/                   # SQL migration scripts
│   └── 012_microsites.sql        # ★ microsites table, profile_microsites junction
│
├── data/                         # Local data files
│   └── site-settings.json        # Persisted settings (dev only)
│
└── public/                       # Static assets
    └── images/
```

---

## 🌐 ระบบภาษา — 15 Languages

### Architecture

```
Tier 1 (5 ภาษา — แปลสมบูรณ์ทุก字段ทันทีเมื่อ publish)
└── th (ไทย), en, zh (中文), ja (日本語), fr (Français)

Tier 2 (10 ภาษา — แปลเฉพาะหัวข้อ+SEO รอ JIT content)
└── ko, de, es, pt, ru, ar, hi, it, vi, ms
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/locales.ts` | Define ALL_LOCALES, TIER1_LOCALES, TIER2_LOCALES, Locale type |
| `lib/translations.ts` | Static UI text `t(key, locale)` (nav, footer, about, etc.) |
| `lib/types.ts` | `TranslatedArticle`, `ArticleMaster`, `Article` types |
| `lib/gemini-service.ts` | Gemini Flash (Tier1) / Pro (Tier2 JIT) translation engine |
| `lib/translation-store.ts` | ⚠️ **SERVER-ONLY** — file-based cache, lock system |
| `lib/translation-client-store.ts` | Client-safe utils `checkNeedsFullTranslation()`, `fetchContentTranslation()` |

### Important Rules

1. **NEVER** import `translation-store.ts` in client components (it uses `fs` module)
2. Client components MUST use `translation-client-store.ts` instead
3. `"use client"` directive must be the **very first line** of the file (no comments before it)
4. When using `supabase.from("hero_slides")`, cast with `as HeroSlideRow` to fix TypeScript inference

---

## 🗄️ Supabase Database

### Tables (defined in `lib/supabase-types.ts`)

| Table | Key Fields | Notes |
|-------|-----------|-------|
| `articles` | id, slug, original_title, original_content, category_id, author_id, image_url, featured, **microsite_id** | Original Thai articles. `microsite_id IS NULL` = main site |
| `categories` | id, slug, name_th, name_en | Article categories |
| `translations` | article_id, locale, title, content, translation_status, is_full_translated | Translated content |
| `hero_slides` | id, title_th, title_en, image_url, cta_link, is_active, sort_order, **microsite_id** | Banner carousel. `microsite_id IS NULL` = main site |
| `profiles` | id (→auth.users), name, role (admin/editor/writer) | User profiles |
| `microsites` | ★ slug, name, description, is_active, branding colors, nav settings, SEO | Microsite definitions |
| `profile_microsites` | ★ profile_id, microsite_id, role | Junction: which users manage which microsites |

### Supabase Clients

| File | Type | Use Case |
|------|------|----------|
| `lib/supabase-server.ts` | `createClient()` | Server components, API routes (cookie-based auth) |
| `lib/supabase-server.ts` | `createAdminClient()` | Bypass RLS (service_role key, admin operations) |
| `lib/supabase-client.ts` | `createBrowserClient()` | Client components |

---

## 🤖 Gemini AI Translation

### Model Strategy

| Task | Model | Cost |
|------|-------|------|
| Tier 1 full content | Gemini 2.0 Flash 🚀 | Low |
| Tier 2 summary (title+excerpt) | Gemini 2.0 Flash 🚀 | Low |
| Tier 2 JIT full content | Gemini 2.0 Pro 🎯 | Higher |

### Key: `GEMINI_API_KEY` (from Google AI Studio)

### Flow

```
Article Published (Tier 1)
  └─► translateArticle() → Gemini Flash
      ├─ title, excerpt, content, seoTitle, seoDescription
      └─ saveTranslatedArticle() to translations/{slug}/{locale}.json

Article Published (Tier 2)
  └─► translateArticle() → Gemini Flash
      └─ title, excerpt, seoTitle, seoDescription (translations/{slug}/{locale}.json)
      └─ translationStatus: "summary_only"

User Reads Article (Tier 2 — first time)
  └─► fetchContentTranslation() → POST /api/translate-content/{slug}
      └─► translateContentOnly() → Gemini Pro
          └─ update translationStatus → "complete"
          └─ update isFullTranslated → true
```

### Race Condition Protection

`translation-store.ts` uses **file-based locks** (`.lock.{locale}`) with 30s TTL to prevent duplicate API calls when multiple users trigger JIT translation simultaneously.

---

## 🍪 Analytics & Cookie Consent

### Components

| Component | File | Description |
|-----------|------|-------------|
| `GoogleAnalytics` | `components/analytics/google-analytics.tsx` | GA4 script + page view tracking + event helpers |
| `CookieConsent` | `components/analytics/cookie-consent.tsx` | Consent banner (15 languages) |

### Cookie Consent Flow

```
User visits site
  └─► Check localStorage("siamheritage_cookie_consent")
      ├── Not set → Show banner (after 1s delay)
      │   ├── Accept → localStorage="accepted" → reload → GA loads
      │   └── Decline → localStorage="declined" → GA never loads
      ├── "accepted" → GA loads normally
      └── "declined" → GA returns null (no scripts)
```

### Google Analytics Features

- **Auto page view tracking** on route change (with language detection)
- **Google Analytics also works on microsite** routes (`/{slug}/{lang}/...`) since middleware rewrites internally
- **Event tracking helpers**: `trackTranslationEvent`, `trackLanguageSwitch`, `trackArticleRead`, `trackSEOPerformance`
- **Consent-gated**: GA scripts only render when consent = "accepted"

---

## 🆕 Microsite System (Multi-Site)

### Architecture

```
Middleware: /{slug}/...  (ถ้า slug ไม่ใช่ locale)
  └─► rewrite → /microsite/{slug}/...
      └─► app/microsite/[slug]/[lang]/...
          ├─ layout.tsx  → injects CSS variables (colors from DB)
          ├─ header.tsx  → microsite-specific navbar
          ├─ home page   → hero + articles from own DB
          ├─ articles/   → list + detail (JIT translation + share buttons)
          └─ about/      → about + contact info
```

### Key Concepts

| Concept | Implementation |
|---------|---------------|
| **Routing** | Middleware rewrites `/{slug}/{lang}/...` → `/microsite/{slug}/{lang}/...` |
| **Session** | Same session as main site (Supabase auth, same cookies) |
| **Registration** | No self-registration. Admin adds users via `profile_microsites` table |
| **Theming** | Each microsite has own colors (primary, bg, card) via CSS variables |
| **Content Separation** | `articles.microsite_id` — `NULL` = main site, `UUID` = belongs to microsite |
| **Main Site Filter** | `getTranslatedSummaries()` uses `.is("microsite_id", null)` |
| **Navbar** | Microsite has its own nav with optional "go to main site" link |

### Data Model

```
microsites
├── slug (unique, used as URL prefix — e.g., "thai-defend")
├── name, description, is_active
├── primary_color, background_color, background_secondary, card_color
├── logo_url, favicon_url
├── show_in_main_nav, main_site_visible, show_main_site_link
├── custom_nav_links (JSONB — custom nav items)
├── meta_title, meta_description (SEO)
├── about_content_th, about_content_en
├── contact_email, show_author
└── created_at, updated_at

profile_microsites (junction: which users manage which microsite)
├── profile_id → profiles.id
├── microsite_id → microsites.id
└── role (microsite_admin / microsite_editor / microsite_writer)
```

### Admin Panel

- **Super Admin** (role: `admin`) sees "Microsites" menu in sidebar
- Can: list, create, edit, toggle active, delete microsites
- Per-microsite pages: edit settings, view articles

### Migration

Run `migrations/012_microsites.sql` against the Supabase database:
```sql
-- Creates: microsites, profile_microsites tables
-- Alters: articles.microsite_id, hero_slides.microsite_id
-- Indexes: all foreign keys
-- RLS: anyone can view active, only admin can manage
```

---

## 🎨 Styling & Design Tokens

### Font System

| Font | Variable | Usage |
|------|----------|-------|
| Noto Serif | `--font-noto-serif` | English body text |
| Playfair Display | `--font-playfair` | English headings |
| Noto Serif Thai | `--font-noto-serif-thai` | All Thai text |

### Color Scheme (Dark Theme)

```
Background:       #060e1a  (--backgroundColor)
BG Secondary:     #0a1628  (--backgroundColorSecondary)
Card:              #0f1f3a  (--cardColor)
Accent (Amber):    #fbbf24  (--primaryColor)
Text:              #ffffff
Text Muted:        rgba(255,255,255,0.5)
```

> Colors are configurable via `SiteSettings` in `lib/site-settings.ts`
> 
> Microsites override colors via CSS variables: `--ms-primary`, `--ms-bg`, `--ms-bg-secondary`, `--ms-card`

---

## 🚀 Deployment

### Platform: Netlify

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node.js | v22.22.3 |
| Next.js Runtime | v5.15.11 |

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GA_ID=             # Google Analytics Measurement ID
GEMINI_API_KEY=                # Google AI Studio API Key
NEXT_PUBLIC_SITE_URL=          # https://siamheritage.org
```

### Common Build Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `"use client" must be before other expressions` | Comments before `"use client"` | Move `"use client"` to line 1 |
| `Property 'xxx' does not exist on type 'never'` | Supabase query not typed | Cast with `as HeroSlideRow` or `as ArticleRow` |
| `Can't resolve 'fs'` | Imported server-only file in client | Use `translation-client-store.ts` instead |
| `Unexpected token div` | Corrupted JSX (e.g., missing closing tags) | Check for missing `</button>`, `</div>` after edits |
| `Module not found` for microsite files | Forgot to create a component | Check `components/microsite/` directory |

---

## 🔄 Git Workflow

```
Branch: develop/complete-website
Commit prefix convention:
  feat:   New feature
  fix:    Bug fix
  chore:  Maintenance
  refactor: Code restructuring

Auto workflow (เมื่อทำงานเสร็จ):
  1. git add .          # เพิ่มไฟล์ใหม่/แก้ไขทั้งหมด
  2. git commit -m ""   # commit พร้อมข้อความ
  3. git push           # push ขึ้น remote
```

---

## 🧪 Local Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
```

> ⚠️ `translation-store.ts` uses `fs` module — file operations work locally but may fail on Netlify (serverless). Translation cache falls back gracefully.
> 
> ⚠️ Microsites require the migration script (`migrations/012_microsites.sql`) to be run against Supabase before the admin panel works.

---

## 🆕 Microsite System (Multi-Site)

### Architecture

```
Middleware: /{slug}/...  (ถ้า slug ไม่ใช่ locale)
  └─► rewrite → /microsite/{slug}/...
      └─► app/microsite/[slug]/[lang]/...
          ├─ layout.tsx  → injects CSS variables (colors from DB)
          ├─ header.tsx  → microsite-specific navbar
          ├─ home page   → hero + articles from own DB
          ├─ articles/   → list + detail (JIT translation + share buttons)
          └─ about/      → about + contact info
```

### Key Concepts

| Concept | Implementation |
|---------|---------------|
| **Routing** | Middleware rewrites `/{slug}/{lang}/...` → `/microsite/{slug}/{lang}/...` |
| **Session** | Same session as main site (Supabase auth, same cookies) |
| **Registration** | No self-registration. Admin adds users via `profile_microsites` table |
| **Theming** | Each microsite has own colors (primary, bg, card) via CSS variables |
| **Content Separation** | `articles.microsite_id` — `NULL` = main site, `UUID` = belongs to microsite |
| **Main Site Filter** | `getTranslatedSummaries()` uses `.is("microsite_id", null)` |
| **Navbar** | Microsite has its own nav with optional "go to main site" link |

### Admin Authentication for API Routes

⚠️ **Important:** Admin login uses `sessionStorage` (not cookie-based auth).

API routes must use `getRequestUser(request)` helper which checks both:
1. **Cookie** (`siamheritage_session`) — for server-side auth
2. **Header** (`x-session-data`) — for client-side auth from admin pages

Client-side admin pages MUST use `adminFetch()` from `lib/use-admin-fetch.ts` instead of plain `fetch()`.

```ts
// ✅ Correct — sends session header
const res = await adminFetch("/api/admin/microsites");

// ❌ Wrong — will get 401 Unauthorized
const res = await fetch("/api/admin/microsites");
```

### Data Model

```
microsites
├── slug (unique, used as URL prefix — e.g., "thai-defend")
├── name, description, is_active
├── primary_color, background_color, background_secondary, card_color
├── logo_url, favicon_url
├── show_in_main_nav, main_site_visible, show_main_site_link
├── custom_nav_links (JSONB — custom nav items)
├── meta_title, meta_description (SEO)
├── about_content_th, about_content_en
├── contact_email, show_author
└── created_at, updated_at

profile_microsites (junction: which users manage which microsite)
├── profile_id → profiles.id
├── microsite_id → microsites.id
└── role (microsite_admin / microsite_editor / microsite_writer)
```

### Migration

Run `migrations/012_microsites.sql` against the Supabase database.

---

## ✅ Pre-commit Checklist

> ⚠️ **ตรวจสอบทุกครั้งก่อน commit และ push** เพื่อป้องกัน type error และ build failure

### TypeScript
- [ ] Run `npm run build` หรือ `npx tsc --noEmit` ตรวจ type error
- [ ] Supabase `.maybeSingle()` return type มักเป็น `never` — ต้อง cast explicit type
  ```ts
  const { data: rawTrans } = await supabase.from("translations").select("title").eq(...).maybeSingle();
  const trans = rawTrans as { title?: string } | null;
  ```
- [ ] `ALL_LOCALES.includes()` — ต้อง cast เป็น `(ALL_LOCALES as readonly string[])` เพื่อหลีกเลี่ยง literal union type error

### Client Components
- [ ] `"use client"` ต้องอยู่บรรทัดแรกของไฟล์ (ไม่มี comment ข้างบน)
- [ ] ห้าม import `lib/translation-store.ts` หรือ `lib/site-settings.ts` ใน client component (ใช้ `fs`)
- [ ] ห้าม import `lib/constants.ts` ถ้า client component จะ trigger `site-settings.ts` → `fs` error

### Admin API Routes
- [ ] ใช้ `getRequestUser(request)` แทน `requirePermission()` — เพราะ admin login ใช้ sessionStorage
- [ ] ใช้ `adminFetch()` ใน client-side admin pages แทน `fetch()` เปล่า
- [ ] ถ้าเพิ่ม API route ใหม่ อย่าลืมใส่ `getRequestUser()` และ fallback header x-session-data

### File Structure
- [ ] Microsite routes อยู่ภายใต้ `app/microsite/[slug]/[lang]/`
- [ ] Microsite components อยู่ภายใต้ `components/microsite/`
- [ ] Admin microsite pages อยู่ภายใต้ `app/admin/microsites/`
- [ ] API routes อยู่ภายใต้ `app/api/admin/microsites/`

### Middleware
- [ ] ถ้าเพิ่ม slug ใหม่ใน `RESERVED_PATHS` หรือ locale ใหม่ใน `ALL_LOCALES` ต้อง sync ใน middleware.ts ด้วย
- [ ] Middleware rewrite path → `request.nextUrl.pathname` เปลี่ยนเป็น `/microsite/...`
- [ ] Route matcher ต้องครอบคลุม path ที่ไม่ใช่ reserved

### Build
- [ ] Build ผ่าน local (`npm run build`) ก่อน push
- [ ] ถ้าใช้ Netlify ตรวจสอบว่า env vars ครบ
- [ ] ตรวจสอบว่าไม่มี import cycle ที่ทำให้เกิด `Can't resolve 'fs'`
