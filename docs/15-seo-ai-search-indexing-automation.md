# 15 - SEO / AI Search Indexing Automation

> **สถานะ:** ✅ Implemented (ผ่าน `tsc --noEmit` ไม่มี type error)
> **ขอบเขต:** Instant indexing (IndexNow + Google Indexing API), Sitemap + hreflang ตามสถานะเผยแพร่จริง, llms.txt, Open Claims API, ClaimReview structured data, และ post-publish automation pipeline
> **บทบาท:** ระบบที่ทำงาน "ภายหลัง" (post-publishing) เพื่อให้ทุกหน้าใหม่ / หน้าที่อัปเดต ถูกค้นพบโดย Search Engine และ AI crawlers ได้เร็วที่สุด โดยไม่ expose สถานะครึ่ง ๆ กลาง ๆ

---

## 1. Concept (แนวคิดหลัก)

### 1.1 ทำไมต้องมีระบบนี้

เมื่อทีมกองบรรณาธิการ publish บทความใหม่ (ภาษาไทย) หรือปล่อยบทความภาษาแปล (EN, JA, ...) ตามหลัง

- **ปัญหาดั้งเดิม:** crawler รู้ได้ก็ต่อเมื่อมาตรวจ `sitemap`/`robots` เอง ซึ่งอาจช้าเป็นชั่วโมงหรือวัน → บทความใหม่ติด index ช้า
- **ปัญหาเรื่อง "สถานะครึ่ง ๆ กลาง ๆ":** ก่อนหน้านี้ `sitemap`/`hreflang` ลิสต์ไป *ทุกภาษา active* โดยไม่สนใจว่าภาษานั้นแปลเสร็จ (published) หรือยัง → risk SEO พบ **ลิงก์ไปหน้า 404 / ภาษาที่ยังไม่พร้อม** ซึ่งทำร้าย crawl budget, E-E-A-T และคะแนน trust

### 1.2 หลักสำคัญ (Guardrail)

> **⚠️ เงื่อนไขเด็ดขาด:** ทุกการทำงาน downstream (indexing, revalidate, hreflang, sitemap, schema) จะเกิดขึ้น **ต่อเมื่อ language variant นั้นเข้าสู่สถานะ "เผยแพร่จริง" เท่านั้น**

| ภาษาต้นทาง | เกณฑ์ "เผยแพร่จริง" |
|---|---|
| ภาษาไทย (`th`, ต้นฉบับ) | `articles.status = 'published'` |
| ภาษาที่แปล (`en`, `ja`, ...) | `translations.translation_status = 'complete'` |

ถ้า variant ยังเป็น `draft` / `pending` / `summary_only` → ระบบจะ **ข้าม (skip)** ทันที และไม่ expose URL ไปยังช่องทางใด

### 1.3 กลยุทธ์ Indexing แบบ 2 ชั้น (Instant + Passive)

| กลไก | เป้าหมาย | ลักษณะ |
|---|---|---|
| **IndexNow** | Bing, Perplexity, Yandex, Seznam | ✓ *Instant* — POST ทันทีหลัง publish |
| **Google Indexing API** | Google | ✓ *Instant* — Service Account JWT submit หลัง publish |
| **llms.txt + hreflang + ClaimReview** | AI Agents (GPTBot, Claude, Perplexity...) | 🐢 *Passive* — ช่วยให้ AI เข้าใจและให้คะแนนโครงสร้างบทความ |
| **Sitemap / robots.txt** | Search Engine ทุกตัว | 🐢 *Passive* — baseline สำหรับ crawl ปกติ |

---

## 2. การทำงาน (How it works)

### 2.1 รูปแบบสถาปัตยกรรม (Post-Publish Automation Pipeline)

```
                        ┌─────────────────────────────────────────────┐
  event "publish"       │  lib/publish-automation.ts                   │
 ┌──────────────┐  ┌──►│  (runPublishAutomation)                      │
 │ Article PUT  │──┘   │  1. isVariantPublished()  ← guardrail เช็ค    │
 │ Translations │      │     สถานะจริงจาก DB อีกครั้ง                  │
 │ translate-new│      │  2. getArticleIndexTargets()                 │
 │ translate-all│      │  3. pingIndexNow(urls)                       │
 │ translate-jit│      │  4. submitUrlsToGoogle(urls)                 │
 └──────────────┘       │  5. revalidatePath / revalidateTag          │
                        └─────────────────────────────────────────────┘
```

**ใครเป็น "Trigger" (จุดที่เรียก pipeline):**

| จุด | เหตุการณ์ | locale |
|---|---|---|
| `PUT /api/admin/articles/[slug]` | admin publish/แก้บทความ (TH) | `th` |
| `PUT /api/admin/translations` | admin บันทึก manual translation → complete | ภาษาแปล |
| `POST /api/translate-new` | translate/re-translate บทความ → complete (Tier 1) | ภาษาแปล |
| `POST /api/translate-all` | batch แปลหลายบทความ → complete (Tier 1) | ภาษาแปล |
| `GET /api/translate-content/[slug]` | JIT Tier 2 แปลเนื้อหาขณะผู้ใช้เปิด (fire-and-forget) | ภาษาแปล |

> หมายเหตุ: Tier 2 (`summary_only`) ถูก **กันออก** ที่ขั้น `translate-all`/`translate-new` เพราะยังไม่ใช่ `complete`

### 2.2 Guardrail `isVariantPublished()`

Function นี้ **สุ่มยืนยันสถานะจาก DB อีกครั้ง** (ไม่ไว้ใจ input จาก client):

```ts
if (locale === 'th')  return article.status === 'published'
else                  return translation?.translation_status === 'complete'
```

ถ้าผ่าน → ดำเนินการต่อ / ถ้าไม่ผ่าน → คืน `{ skipped: true, reason }` โดยไม่ ping ใด ๆ

### 2.3 IndexNow (lib/indexnow.ts)

- อ่าน key จาก `INDEXNOW_KEY` (env)
- **ถ้าไม่มี key → ไม่ submit** (ดีกว่าส่งให้ fail) — คืน `{ submitted: false }`
- สร้าง payload `{ host, key, keyLocation, urlList }` แล้ว POST ไป `https://api.indexnow.org/indexnow`
- **ไฟล์ `/{KEY}.txt` ต้องวางไว้ที่ `/public/`** (protocol บังคับให้มี)

### 2.4 Google Indexing API (lib/google-indexing.ts)

- จัดการ **Service Account JWT (RS256)** เอง: สร้าง JWT → ขอ `access_token` จาก `https://oauth2.googleapis.com/token` → POST `urlNotifications:publish` (type `URL_UPDATED`)
- ตัวเลือก: `URL_DELETED` สำหรับหน้าถูกลบ
- ตรวจ config ครบก่อน → ถ้าไม่ครบ คืน `{ submitted: false, reason }`

### 2.5 Sitemap + Per-language sitemap

**`app/sitemap.ts` (รวมทุกภาษา):**
- ดึงบทความจาก Supabase ผ่าน `getPublishedArticleRows()` (filter `status='published'`)
- สำหรับแต่ละบทความ → `getPublishedVariants()` → **เฉพาะ variant ที่ `complete` เท่านั้น** → เพิ่ม URL พร้อม `lastmod` ตาม `dateModified` ต่อ variant ภาษา

**`app/sitemap/[lang]/route.ts` (`/sitemap/:lang.xml`):**
- สร้าง sitemap เฉพาะภาษานั้น (static + บทความ variant นั้น) — ตัด `.xml` ต่อท้าย lang ออก
- robots.ts จะ reference ทั้ง `/sitemap.xml` และ `/sitemap/{แต่ละ locale}.xml`

### 2.6 Dynamic hreflang (เฉพาะ published variants)

`app/[lang]/articles/[slug]/page.tsx` `generateMetadata`:

- ดึง `translations` ที่เกี่ยวข้อง → `getPublishedVariants()` → สร้าง `alternates.languages` จาก **ภาษาเผยแพร่จริงเท่านั้น**
- `x-default` → ชี้ EN (ถ้า published) หรือภาษาแรกที่เผยแพร่
- **กันไม่ให้ hreflang ชี้ไปหน้าที่ยังสร้างไม่เสร็จ**

### 2.7 ClaimReview Structured Data + Open Claims API

- **หน้า article** แทรก `<SchemaClaimReview>` JSON-LD เมื่อ variant ปัจจุบันเผยแพร่จริง (ใช้ `inLanguage`, `datePublished`/`dateModified` ตาม variant)
- **`/api/v1/claims/latest`** — ส่งข้อมูล fact-check เป็น Open JSON (รองรับ `?format=jsonld` คืนเป็น `@graph` ClaimReview) สำหรับ AI Search Engine

### 2.8 llms.txt + robots.txt

- **`/llms.txt`** — Markdown ให้ AI เข้าใจโครงสร้างเว็บเร็วขึ้น (ภาษา x ลิงก์ + จุดประสงค์ + note สำหรับ LLM)
- **`/robots.txt`** — เปิดให้ AI agents ชัดเจน (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended) + reference sitemap ทั้งหมด

---

## 3. โครงสร้างไฟล์

```
lib/
  seo-utils.ts                 ← shared helpers + published-state resolution
  indexnow.ts                  ← IndexNow protocol client
  google-indexing.ts           ← Google Indexing API (JWT)
  publish-automation.ts        ← orchestrator (guardrail + trigger)

app/
  sitemap.ts                       ← combined sitemap (ทุกภาษา, published เท่านั้น)
  robots.ts                        ← AI agents allowance + sitemap refs
  llms.txt/route.ts                ← machine-readable site summary
  sitemap/[lang]/route.ts          ← per-language sitemap XML
  [lang]/articles/[slug]/page.tsx  ← dynamic hreflang + ClaimReview schema

app/api/
  seo/notify-publish/route.ts      ← internal trigger endpoint
  seo/indexnow/route.ts            ← IndexNow trigger endpoint
  seo/google-index/route.ts        ← Google Indexing trigger endpoint
  v1/claims/latest/route.ts        ← open claims JSON API

app/api/admin/
  articles/[slug]/route.ts         ← hook publish (TH)
  translations/route.ts            ← hook manual translation
app/api/
  translate-new/route.ts           ← hook translate
  translate-all/route.ts           ← hook batch translate
  translate-content/[slug]/route.ts← hook JIT translate

components/
  schema-claimreview.tsx           ← ClaimReview JSON-LD component

migrations/
  021_seo_indexing.sql             ← DB columns + audit table
```

---

## 4. ผลลัพธ์ (Outcomes)

### 4.1 ที่ได้จากโค้ดนี้ (ภายใน repo)

- ✅ **Instant Indexing** — ทุกบทความใหม่/อัปเดต trigger IndexNow + Google Indexing API ทันทีหลัง "publish จริง"
- ✅ **Sitemap สะอาด** — ไม่มี URL ครึ่ง ๆ กลาง ๆ ขึ้น sitemap; มี `lastmod` ต่อ variant ภาษา
- ✅ **hreflang ที่ถูกต้อง** — สะท้อนเฉพาะภาษาที่ "เผยแพร่จริง" → ลดลิงก์ 404 ในมุมมอง SEO
- ✅ **Per-language sitemap** — `/sitemap/{locale}.xml` สำหรับ Search Console แยกภาษา
- ✅ **AI-friendly** — `llms.txt`, robots เปิดให้ AI agents, ClaimReview JSON-LD
- ✅ **Open Claims API** — `/api/v1/claims/latest` สำรับ AI Search / third-party
- ✅ **No type error** — ยืนยันด้วย `tsc --noEmit`

### 4.2 ผลที่ต้องอาศัยการตั้งค่าภายนอก (ยังไม่เกิดจนกว่าจะ config)

| สิ่งที่ต้องทำ | ไฟล์/ที่ | สถานะ |
|---|---|---|
| รัน `021_seo_indexing.sql` | Supabase SQL editor | ต้องรันเอง |
| ตั้ง env `INDEXNOW_KEY` + วาง `/public/{KEY}.txt` | `.env.local` + `public/` | ต้องทำเอง |
| ตั้ง env Google Service Account (3 ตัว) | `.env.local` | ต้องทำเอง |
| Enable "Indexing API" + เพิ่ม SA ใน Search Console | Google Cloud | ต้องทำเอง |

> จนกว่าจะตั้งค่า env ครบ ระบบจะ **ไม่พัง** — มันแค่คืน `{ submitted: false }` และ log skip อย่างปลอดภัย (fire-and-forget)

---

## 5. Env Variables ที่เกี่ยวข้อง

```
# บังคับ (ถ้าไม่มี ระบบ skip อย่างปลอดภัย)
INDEXNOW_KEY=...

# Google Indexing API
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=...

# ใช้กำหนด base URL (fallback มาก่อน constants.ts)
NEXT_PUBLIC_SITE_URL=https://unfakenews.asia
```

---

## 6. สรุป / ข้อควรจำ

- **Guardrail ไม่ใช่น้ำยา** — `isVariantPublished()` เช็คสถานะจริงจาก DB ทุกครั้งก่อน indexing
- **Fail-soft** — ถ้า env ไม่ครบ / API error → ไม่ block request หลัก, แค่ log
- **Trigger ครอบคลุมทุก path การ publish** — ทั้ง manual (admin), translate, batch, และ JIT
- **Sitemap/hreflang/llms.txt** ปรับเป็น "dynamic" โดย read จาก publishing state จริง ไม่ hardcode

หลัง deploy + ตั้ง env + รัน migration แล้ว ตรวจผลด้วย:
- `robots.txt` → ควรเห็น sitemap รายภาษา
- `/sitemap/en.xml` → ควรเห็นเฉพาะบทความที่ EN เผยแพร่จริง
- `/api/v1/claims/latest` → ควรเห็น claims เป็น JSON
