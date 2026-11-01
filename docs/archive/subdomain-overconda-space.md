# 🌐 Multi-Microsite Architecture — overconda.space

> **Main site:** Vercel  
> **Microsite subdomains:** Netlify  
> **Backend:** Supabase (ฐานข้อมูลกลาง)  
> **Codebase:** Next.js (codebase เดียวกัน — git repo เดียวกัน)

---

## 📑 สารบัญ

1. [Architecture Overview](#1-architecture-overview)
2. [Domain Structure](#2-domain-structure)
3. [Deployment Strategy](#3-deployment-strategy)
4. [How Subdomain Routing Works](#4-how-subdomain-routing-works)
5. [DNS Configuration](#5-dns-configuration)
6. [Vercel Setup (Main Site)](#6-vercel-setup-main-site)
7. [Netlify Setup (Microsites)](#7-netlify-setup-microsites)
8. [Supabase (Shared Backend)](#8-supabase-shared-backend)
9. [URL Generation](#9-url-generation)
10. [Middleware (Subdomain Detection)](#10-middleware-subdomain-detection)
11. [Limitations & Considerations](#11-limitations--considerations)
12. [Quick Start Checklist](#12-quick-start-checklist)

---

## 1. Architecture Overview

```
Internet
    │
    ├── overconda.space ──────────────────► Vercel
    │   └── Server: Next.js (Node.js)
    │       ├── Main site routing
    │       ├── Admin dashboard (/admin/*)
    │       ├── API routes (/api/*)
    │       └── JIT translation engine
    │
    ├── music.overconda.space ────────────► Netlify
    ├── movie.overconda.space ────────────► Netlify
    ├── art.overconda.space ──────────────► Netlify
    │   └── Server: Next.js (Static + SSR on demand)
    │       ├── Microsite-specific pages
    │       │   ├── /[lang]/articles/[...slug]
    │       │   ├── /[lang]
    │       │   └── /[lang]/articles
    │       └── Share API calls to Vercel main site
    │
    └── Shared Backend ───────────────────► Supabase
        ├── PostgreSQL (articles, translations, settings)
        ├── Storage (images, logos)
        └── Auth (users, permissions)
```

### หลักการทำงาน

| Component | Hosting | หน้าที่ |
|-----------|---------|--------|
| **Main Site** (`overconda.space`) | **Vercel** | Admin, API routes, JIT translation, Main article display, User management |
| **Microsites** (`*.overconda.space`) | **Netlify** | Public-facing microsite pages (ไม่มี Admin), Static-first performance |
| **Database** | **Supabase** | ฐานข้อมูลกลาง — ทุก microsite + main site ใช้ร่วมกัน |
| **Git Repo** | เดียวกัน | `main` branch → Vercel (main site), `netlify` branch หรือ folder → Netlify |

### ทำไมต้องแยก Vercel + Netlify?

| เหตุผล | รายละเอียด |
|--------|-------------|
| **Cost** | Vercel Pro ($20/เดือน) + Netlify Free (100GB bandwidth) = คุ้มกว่า Vercel Enterprise |
| **Performance** | Netlify edge network แจก static content ได้ดี — microsite ส่วนใหญ่อ่านอย่างเดียว |
| **Isolation** | ถ้า microsite มี traffic สูง ไม่กระทบ main site (admin/API) |
| **Build separation** | Main site build รวม API routes (~ใหญ่); Microsite build แค่หน้า public (~เล็ก, build เร็ว) |

---

## 2. Domain Structure

### ตัวอย่าง Subdomain

| Subdomain | Microsite Slug | เนื้อหา |
|-----------|---------------|---------|
| `overconda.space` | `(main)` | เว็บหลัก + Admin |
| `music.overconda.space` | `music` | สารานุกรมดนตรีไทย |
| `movie.overconda.space` | `movie` | ฐานข้อมูลภาพยนตร์ไทย |
| `art.overconda.space` | `art` | ศิลปะและศิลปินไทย |
| `culture.overconda.space` | `culture` | ประเพณีและวัฒนธรรมไทย |

### URL Structure (เหมือนกันทั้ง Vercel และ Netlify)

```
Main Site (Vercel):
  https://overconda.space/th/articles/[...slug]          ← public
  https://overconda.space/admin/*                        ← admin dashboard
  https://overconda.space/api/*                          ← API routes

Microsite (Netlify):
  https://music.overconda.space/th/articles/[...slug]    ← public only
  https://music.overconda.space/th                       ← home page
  (ไม่มี /admin, ไม่มี /api)
```

### Fallback (Path-based)

ถ้า DNS subdomain ยังไม่พร้อม → ทุกอย่าง fallback ไป path-based:

```
overconda.space/music/th/articles/[...slug]
overconda.space/movie/th/articles/[...slug]
```

โดย **ไม่ต้องแก้ code backend เลย** — ระบบคุณรองรับ path-based อยู่แล้ว

---

## 3. Deployment Strategy

### Git Repository Structure

```yaml
Repository: github.com/overconda/siamheritage
  │
  ├── main branch ─────► Vercel (overconda.space)
  │   ├── Full Next.js app (pages, api, admin)
  │   ├── API routes (translate, admin, upload)
  │   ├── Admin dashboard
  │   └── Public articles
  │
  └── netlify branch ──► Netlify (music.overconda.space)
      └── แยก config:
          ├── next.config.js ─► no API routes, no admin pages
          ├── netlify.toml
          └── middleware.ts ─► subdomain detection
```

### Deployment Flow

```
Developer push code
    │
    ├── main branch
    │   └── Vercel auto-deploy → overconda.space
    │
    └── netlify branch
        ├── Netlify auto-deploy → music.overconda.space
        ├── Netlify auto-deploy → movie.overconda.space
        └── (ใช้ repo เดียวกัน → ตั้ง build command ต่างกันตาม environment variable)
```

หรือถ้าอยากใช้ branch เดียวกัน:

```
Developer push to main
    │
    ├── Vercel auto-deploy → overconda.space
    │
    └── Netlify:
        ├── ตั้ง "production branch" = main ใน Netlify dashboard
        ├── ใช้ `netlify.toml` กำหนด build command
        └── แต่ละ microsite site → ใช้ repo เดียวกัน, branch เดียวกัน
```

### Build Commands

| Platform | Build Command | Output |
|----------|--------------|--------|
| **Vercel** | `next build` | Full app (includes `/api`, `/admin`) |
| **Netlify** | `npm run build:microsite` | Public pages only (no API routes, no admin) |

```jsonc
// package.json
{
  "scripts": {
    "build": "next build",                            // Vercel
    "build:microsite": "MICROSITE_ONLY=true next build", // Netlify
    
    // หรือใช้ environment variable ควบคุม:
    "build:netlify:music": "NEXT_PUBLIC_MICROSITE_SLUG=music next build",
    "build:netlify:movie": "NEXT_PUBLIC_MICROSITE_SLUG=movie next build",
  }
}
```

### Environment Variables

| Variable | Vercel | Netlify (แต่ละ subdomain) |
|----------|--------|--------------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://overconda.space` | `https://music.overconda.space` |
| `NEXT_PUBLIC_MICROSITE_SLUG` | (ไม่ต้อง) | `music` / `movie` / `art` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ (ค่าเดียวกัน) | ✅ (ค่าเดียวกัน) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ (ค่าเดียวกัน) | ✅ (ค่าเดียวกัน) |
| `GEMINI_API_KEY` | ✅ (มี — ใช้ JIT translate) | ❌ (ไม่ต้อง — API call ผ่าน Vercel main site) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (มี — สำหรับ admin) | ❌ (ไม่ต้อง) |

---

## 4. How Subdomain Routing Works

### Flow Diagram

```
User types: music.overconda.space/th/articles/khon
    │
    ▼
DNS: music.overconda.space CNAME → Netlify
    │
    ▼
Netlify Edge Network (CDN)
    │
    ├── Netlify Redirects (_redirects / netlify.toml)
    │   └── Rewrite all paths to /index.html (SPA fallback)
    │
    ▼
Next.js Server (Netlify — SSR on demand)
    │
    ├── middleware.ts
    │   ├── อ่าน host header → "music.overconda.space"
    │   ├── อ่าน NEXT_PUBLIC_MICROSITE_SLUG → "music"
    │   └── ตรวจสอบว่า slug ตรงกับ host หรือไม่
    │
    ├── pages/[micrositeSlug]/[lang]/articles/[...slug].tsx
    │   ├── โหลด MicrositeSettings จาก Supabase (by slug = "music")
    │   ├── โหลด Article จาก Supabase (filter โดย microsite_id)
    │   └── แสดงผลด้วย MicrositeArticleDetail component
    │
    └── API Call ไปยัง Vercel (main site) สำหรับ translate
        └── fetch("https://overconda.space/api/translate-content/khon", ...)
```

### Middleware Logic (Netlify)

```typescript
// middleware.ts — Netlify version
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const micrositeSlug = process.env.NEXT_PUBLIC_MICROSITE_SLUG;
  
  // ถ้า environment ไม่มี micrositeSlug → main site mode
  if (!micrositeSlug) {
    return NextResponse.next();
  }

  // ตรวจสอบว่า host นี้ตรงกับ microsite หรือไม่
  // (ป้องกันคนเข้าผิด subdomain)
  const expectedHost = `${micrositeSlug}.overconda.space`;
  if (host !== expectedHost && !host.includes("netlify.app")) {
    // redirect ไปยัง subdomain ที่ถูกต้อง
    const url = request.nextUrl.clone();
    url.host = expectedHost;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
```

### Middleware Logic (Vercel)

```typescript
// middleware.ts — Vercel version
import { NextResponse, NextRequest } from "next/server";

const MICROSITE_DOMAINS: Record<string, string> = {
  "music.overconda.space": "music",
  "movie.overconda.space": "movie",
  "art.overconda.space": "art",
  "culture.overconda.space": "culture",
};

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const domain = host.replace("www.", "");
  
  // ถ้าเป็น subdomain ที่รู้จัก → rewrite ไป path-based
  const micrositeSlug = MICROSITE_DOMAINS[domain];
  if (micrositeSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/${micrositeSlug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}
```

> ⚠️ **สำคัญ:** Vercel middleware นี้ใช้ **ในกรณีที่คุณต้องการให้ main site (Vercel) รองรับ subdomain ด้วย** ถ้า deploy subdomain ไป Netlify อย่างเดียว (แนะนำ) — Vercel ไม่ต้องมี middleware นี้

---

## 5. DNS Configuration

### ที่ DNS Provider (Cloudflare / Namecheap / Hover)

```yaml
# Root domain
overconda.space:
  type: CNAME
  target: cname.vercel-dns.com     # Vercel
  # หรือ type: A → IP (ขึ้นอยู่กับ Vercel config)

# Wildcard subdomain — ส่งทุก subdomain ไป Netlify
*.overconda.space:
  type: CNAME
  target: [netlify-app-domain].netlify.app  # ค่าเฉพาะของโปรเจกต์คุณ

# หรือ แยกแต่ละ subdomain (ถ้าไม่ต้องการ wildcard)
music.overconda.space:
  type: CNAME
  target: [your-site].netlify.app

movie.overconda.space:
  type: CNAME
  target: [your-site].netlify.app

art.overconda.space:
  type: CNAME
  target: [your-site].netlify.app
```

### Netlify Custom Domain Setup

ใน Netlify dashboard → แต่ละ site:

```
Site settings → Domain management → Add custom domain
  └── music.overconda.space
    
Netlify จะ generate DNS target:
  └── stunning-unicorn-12345.netlify.app  (ตัวอย่าง)
```

### SSL Certificate

```yaml
Vercel:
  ✅ Auto-provision Let's Encrypt — ไม่ต้องทำอะไร

Netlify:
  ✅ Auto-provision Let's Encrypt — ไม่ต้องทำอะไร
  รองรับ wildcard certificate โดยอัตโนมัติ

กรณีใช้ Cloudflare:
  - ตั้ง SSL/TLS เป็น "Full (strict)"
  - เปิด Proxy (orange cloud) หรือ DNS-only (grey cloud) ก็ได้
```

---

## 6. Vercel Setup (Main Site)

### `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SITE_URL": "https://overconda.space"
  }
}
```

### Environment Variables (Vercel Dashboard)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://overconda.space` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `GEMINI_API_KEY` | `AIza...` |

### What Vercel serves

```
https://overconda.space/
  ├── Public main site (articles, home, tags)
  ├── /admin/* — Admin dashboard
  ├── /api/* — All API routes
  │   ├── /api/admin/articles
  │   ├── /api/translate-new
  │   ├── /api/translate-content/[slug]
  │   └── /api/upload
  ├── /th/articles/[...slug] — Main site article detail
  └── /music/th/articles/[...slug] — Path-based microsite fallback
```

---

## 7. Netlify Setup (Microsites)

### `netlify.toml` (ใช้กับทุก microsite — อยู่ใน root repo)

```toml
[build]
  command = "MICROSITE_ONLY=true next build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_MICROSITE_ONLY = "true"

# Redirect all SPA routes to Next.js
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Cache static assets
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Netlify Functions (ถ้าต้องการ serverless — ไม่จำเป็น)
[functions]
  directory = "netlify/functions"
```

### `next.config.js` — Microsite Mode

```javascript
// next.config.js
const isMicrosite = process.env.NEXT_PUBLIC_MICROSITE_ONLY === "true";

const nextConfig = {
  images: {
    domains: ["xxxx.supabase.co", "overconda.space"],
  },
  
  // ถ้าเป็น microsite mode — ไม่ build API routes + admin pages
  ...(isMicrosite && {
    // ข้ามการ build ไฟล์ที่ไม่จำเป็น
    pageExtensions: ["tsx", "ts"].filter(ext => {
      // ใช้ build-time ตรวจว่าไม่รวม admin/api pages
    }),
  }),
};

module.exports = nextConfig;
```

### Netlify Dashboard Setup (ทำครั้งเดียวต่อ subdomain)

| Site | Custom Domain | Environment Variable `NEXT_PUBLIC_MICROSITE_SLUG` |
|------|--------------|---------------------------------------------------|
| Site A | `music.overconda.space` | `music` |
| Site B | `movie.overconda.space` | `movie` |
| Site C | `art.overconda.space` | `art` |
| Site D | `culture.overconda.space` | `culture` |

Environment variables (ใส่เหมือนกันทุก site):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://music.overconda.space` (เปลี่ยนตาม site) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` (ค่าเดียวกัน) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (ค่าเดียวกัน) |
| `NEXT_PUBLIC_MICROSITE_ONLY` | `true` |

> **Netlify Deploy Key:** สร้าง Deploy Key ใน Netlify (เชื่อมกับ GitHub repo) → Netlify จะ auto-deploy เมื่อ push ไป branch ที่กำหนด → ไม่ต้อง deploy ทีละ site ด้วยมือ

---

## 8. Supabase (Shared Backend)

### ทุก microsite + main site ใช้ Supabase project เดียวกัน

```
Supabase Project: siamheritage (project ID: xxxxx)
  │
  ├── Tables
  │   ├── microsites              ← รายชื่อ microsite ทั้งหมด
  │   ├── microsite_settings      ← settings แยกตาม microsite (สี, โลโก้, font)
  │   ├── articles                ← บทความ (มี microsite_id)
  │   ├── translations            ← คำแปล (มี article_id → microsite_id)
  │   ├── categories              ← หมวดหมู่ (shared)
  │   └── profiles                ← users (shared)
  │
  └── Storage
      ├── images/                  ← รูปภาพบทความ (ทุก microsite)
      ├── microsite-logos/         ← โลโก้แยกตาม microsite slug
      └── uploads/                 ← อัปโหลดทั่วไป
```

### Row-Level Security (RLS)

```sql
-- ตัวอย่าง policy: microsite_settings — อ่านได้ทุกคน
CREATE POLICY "microsite_settings_public_read"
  ON microsite_settings FOR SELECT
  USING (true);

-- articles — อ่านได้เฉพาะของ microsite ตัวเอง
CREATE POLICY "articles_read_by_microsite"
  ON articles FOR SELECT
  USING (microsite_id = current_setting('app.microsite_id')::uuid);
```

### API Key Management

```yaml
Supabase Anon Key:    ✅ ใช้ร่วมกันทุก microsite (read-only)
Supabase Service Key: ✅ Vercel เท่านั้น (อ่าน/เขียนได้)
```

---

## 9. URL Generation

### `lib/microsite-config.ts` (shared)

```typescript
export interface MicrositeConfig {
  slug: string;
  name: string;
  subdomain: string;
}

export const MICROSITE_CONFIGS: Record<string, MicrositeConfig> = {
  music: {
    slug: "music",
    name: "Music",
    subdomain: "music.overconda.space",
  },
  movie: {
    slug: "movie",
    name: "Movie",
    subdomain: "movie.overconda.space",
  },
  art: {
    slug: "art",
    name: "Art",
    subdomain: "art.overconda.space",
  },
  culture: {
    slug: "culture",
    name: "Culture",
    subdomain: "culture.overconda.space",
  },
};

/**
 * รับ URL สำหรับ microsite
 * - ถ้า host === microsite subdomain → ใช้ relative path
 * - ถ้า host === main site (overconda.space) → ใช้ path-based (/music/...)
 * - ถ้าไม่ตรงเลย → fallback เป็น path-based
 */
export function getMicrositeUrl(
  micrositeSlug: string,
  locale: string,
  path = "",
  currentHost?: string
): string {
  const config = MICROSITE_CONFIGS[micrositeSlug];
  
  // ถ้าอยู่บน subdomain อยู่แล้ว → relative path
  if (currentHost === config?.subdomain) {
    return `/${locale}${path}`;
  }
  
  // ถ้ามี subdomain config → สร้าง absolute URL
  if (config?.subdomain) {
    return `https://${config.subdomain}/${locale}${path}`;
  }
  
  // Fallback: path-based
  return `/${micrositeSlug}/${locale}${path}`;
}
```

### ใช้งานใน Component

```tsx
// ตัวอย่าง: footer component
import { getMicrositeUrl } from "@/lib/microsite-config";

function Footer({ currentMicrositeSlug, locale }: Props) {
  return (
    <a href={getMicrositeUrl(currentMicrositeSlug, locale, "/articles")}>
      ดูบทความทั้งหมด
    </a>
  );
}
```

---

## 10. Middleware (Subdomain Detection)

### `middleware.ts` — Vercel (Main Site)

```typescript
// Vercel middleware — สำหรับรองรับ subdomain บน Vercel (optional)
import { NextResponse, NextRequest } from "next/server";

const MICROSITE_SUBDOMAINS = ["music", "movie", "art", "culture"];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const domain = host.replace("www.", "").replace(":3000", "");
  
  // ตรวจจับ subdomain
  for (const slug of MICROSITE_SUBDOMAINS) {
    if (domain.startsWith(`${slug}.`)) {
      // Rewrite ไป path-based (ไม่ redirect)
      const url = request.nextUrl.clone();
      url.pathname = `/${slug}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
```

### `middleware.ts` — Netlify (Microsite)

```typescript
// Netlify middleware
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const micrositeSlug = process.env.NEXT_PUBLIC_MICROSITE_SLUG;
  
  // Main site mode → ไม่ต้องทำอะไร
  if (!micrositeSlug) {
    return NextResponse.next();
  }
  
  const host = request.headers.get("host") || "";
  const expectedHost = `${micrositeSlug}.overconda.space`;
  
  // Redirect ถ้าเข้า Netlify preview URL → ไป subdomain จริง
  if (host.includes("netlify.app") && process.env.NODE_ENV === "production") {
    const url = request.nextUrl.clone();
    url.host = expectedHost;
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
```

---

## 11. Limitations & Considerations

### ✅ ข้อดี

| ข้อดี | รายละเอียด |
|-------|-------------|
| **Shared codebase** | แก้ code ทีเดียว → ทุก subdomain ได้รับอัตโนมัติ |
| **Shared database** | ข้อมูลส่วนกลาง (users, categories) ไม่ซ้ำซ้อน |
| **Cost effective** | Vercel Pro ($20) + Netlify Free = ถูกกว่า Vercel Enterprise |
| **Performance** | Netlify edge สำหรับ public pages, Vercel สำหรับ API/admin |
| **Isolation** | Traffic microsite ไม่กระทบ main site API |
| **Path-based fallback** | ถ้า DNS ไม่พร้อม → ใช้ `overconda.space/music/...` ได้ทันที |

### ⚠️ ข้อควรระวัง

| ข้อจำกัด | รายละเอียด | วิธีแก้ |
|----------|-------------|--------|
| **API calls ข้าม platform** | Netlify microsite → เรียก API `/api/translate-content` ที่ Vercel — latency เพิ่ม | ใช้ `fetch()` ปกติ (cross-origin ได้เพราะ Vercel ตั้ง CORS header) |
| **Build time** | แต่ละ subdomain ต้อง build แยกกัน (Netlify 1 site ต่อ 1 build) | ใช้ `netlify build` trigger ทีละอัน หรือใช้ Deploy Hooks |
| **Supabase anon key expose** | Netlify static JS มี anon key visible | ใช้ RLS ป้องกัน — anon key มี read-only permission อยู่แล้ว |
| **DNS propagation** | เวลาเพิ่ม subdomain ใหม่ ต้องรอ DNS propagate (ไม่เกิน 24h) | ใช้ path-based เป็น fallback |
| **Netlify bandwidth** | Netlify Free = 100GB/month | ถ้าเกิน → อัปเกรด Netlify Pro ($19) หรือใช้ Cloudflare proxy ลด bandwidth |

### 🚫 สิ่งที่ไม่จำเป็น

| ไม่จำเป็น | เพราะ |
|-----------|-------|
| **Load balancer** | Vercel + Netlify จัดการ traffic distribution ให้แล้ว |
| **Docker** | Serverless platforms ไม่ต้อง container |
| **Redis cache** | Supabase + in-memory cache (Edge) เพียงพอ |
| **CI/CD complex** | Git push → auto deploy ทั้ง Vercel + Netlify |
| **Monitoring tool** | Vercel Analytics + Netlify Analytics ก็เพียงพอ |

---

## 12. Quick Start Checklist

### Phase 1: ตั้ง DNS

- [ ] ซื้อ domain `overconda.space` (ถ้ายังไม่มี)
- [ ] ตั้ง DNS:
  - `overconda.space` → CNAME → `cname.vercel-dns.com`
  - `*.overconda.space` → CNAME → Netlify target domain
- [ ] รอ DNS propagate (~30 นาที ถึง 24 ชม.)

### Phase 2: Vercel (Main Site)

- [ ] Import repo `siamheritage` เข้า Vercel
- [ ] ตั้ง Production Branch: `main`
- [ ] ตั้ง Custom Domain: `overconda.space`
- [ ] ใส่ Environment Variables ทั้งหมด
- [ ] Deploy → ตรวจสอบว่า `overconda.space` ใช้งานได้

### Phase 3: Netlify (Microsites)

- [ ] สร้าง Netlify site จาก repo เดียวกัน (4 sites)
- [ ] แต่ละ site:
  - ตั้ง Build Command: `npm run build:microsite`
  - ตั้ง Production Branch: `main`
  - ตั้ง Custom Domain: `music.overconda.space` (เปลี่ยนตาม site)
  - ใส่ Environment Variables:
    - `NEXT_PUBLIC_MICROSITE_SLUG` = `music`
    - `NEXT_PUBLIC_SITE_URL` = `https://music.overconda.space`
    - `NEXT_PUBLIC_SUPABASE_URL` (ค่าเดียวกับ Vercel)
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ค่าเดียวกับ Vercel)
    - `NEXT_PUBLIC_MICROSITE_ONLY` = `true`
- [ ] Deploy แต่ละ site → ตรวจสอบ subdomain

### Phase 4: ทดสอบ

- [ ] `overconda.space` → main site ทำงาน
- [ ] `music.overconda.space/th` → หน้า microsite music
- [ ] `music.overconda.space/th/articles/[slug]` → article detail
- [ ] `movie.overconda.space/th/articles/[slug]` → article detail (article ของ movie โดยเฉพาะ)
- [ ] JIT translation ทำงาน (API call ไป Vercel)
- [ ] Admin dashboard (`overconda.space/admin`) ยังใช้งานได้
- [ ] path-based fallback (`overconda.space/music/th/articles/...`) ยังใช้ได้

### Phase 5: Config ต่อ microsite

- [ ] เพิ่มข้อมูล microsite ใน Supabase table `microsites`
- [ ] ตั้งค่า `microsite_settings` (สี, โลโก้, font) ผ่าน Admin dashboard
- [ ] เพิ่มบทความสำหรับ microsite นั้น
- [ ] ตรวจสอบการแสดงผล (สี, โลโก้, font ถูกต้อง)

---

## Appendix

### A. ตัวอย่างไฟล์ `.env` สำหรับ Local Development

```bash
# .env.local (root — สำหรับพัฒนา main site)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...

# .env.microsite.local (สำหรับพัฒนา microsite)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MICROSITE_SLUG=music
NEXT_PUBLIC_MICROSITE_ONLY=true
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### B. คำสั่ง Run Local Development

```bash
# Main site
npm run dev

# Microsite (local)
MICROSITE_ONLY=true NEXT_PUBLIC_MICROSITE_SLUG=music npm run dev
```

### C. Deploy Hooks (Netlify)

Netlify มี Deploy Hooks — ใช้ trigger deploy จาก GitHub Actions หรือ CI:

```yaml
# .github/workflows/deploy-microsites.yml
name: Deploy Microsites

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST https://api.netlify.com/build_hooks/[MUSIC_HOOK_ID]
      - run: curl -X POST https://api.netlify.com/build_hooks/[MOVIE_HOOK_ID]
      - run: curl -X POST https://api.netlify.com/build_hooks/[ART_HOOK_ID]
```

---

> **Author:** Siam Heritage Engineering  
> **Last Updated:** 2025  
> **Main Site:** [overconda.space](https://overconda.space)  
> **Stack:** Next.js (Vercel + Netlify) · Supabase · Gemini AI  
> **Related:** [wiki-style-refactoring.md](./wiki-style-refactoring.md) · [translation-strategy-blueprint.md](./translation-strategy-blueprint.md)
