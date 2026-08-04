# 14 — Database Schema Reference (Supabase)

> เอกสารอ้างอิง schema/tables ของโปรเจกต์ UnFakeNews
> อะปเดตจากโค้ด (`lib/supabase-types.ts`, `lib/microsite-types.ts`, `lib/site-settings.ts`, `lib/microsite-service.ts`)
> และการใช้งานจริงในโค้ด (`.from(...)`, `.select(...)`, `.upsert(...)`)

---

## 🔁 Overview

| Table | ความหมาย | ผ่าน API/ตรง |
|-------|----------|-------------|
| `articles` | บทความ (master ภาษาไทย) | ตรง + API |
| `categories` | หมวดหมู่บทความ | ตรง + API |
| `translations` | บทความที่แปลแต่ละภาษา | ตรง + API |
| `hero_slides` | Banner หน้าแรก (carousel) | ตรง + API |
| `profiles` | profile ผู้ใช้ (extends `auth.users`) | ตรง |
| `microsites` | microsite ต่างๆ (branding/เนื้อหาแยก) | ตรง |
| `profile_microsites` | junction: ผู้ใช้ ↔ microsite (สิทธิ์) | ตรง |
| `site_settings` | การตั้งค่าเว็บ (แบรนด์/SEO/แล้ว) | ตรง + API |

**Enums:**
- `user_role`: `admin | editor | writer`
- `translation_status`: `complete | summary_only | pending`
- (microsite) `microsite_admin | microsite_editor | microsite_writer`

---

## 🧱 Table: `articles`

บทความ master (เนื้อหาต้นฉบับเป็นภาษาไทย) — article_id ใช้เป็น key หลักของ `translations`

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | uuid (PK) | |
| `slug` | text | unique |
| `original_title` | text | ชื่อภาษาไทยต้นฉบับ |
| `original_excerpt` | text | คำโปรยต้นฉบับ |
| `original_content` | text | เนื้อหาต้นฉบับ |
| `category_id` | uuid (FK → categories) | |
| `author_id` | uuid (FK → profiles) | |
| `author_name` | text | ชื่อผู้เขียน (denormalized) |
| `microsite_id` | uuid (FK → microsites) | *ในกรณีของ microsite* |
| `is_published` | boolean | *ใช้ในโค้ด microsite service* + admin count |
| `published_at` | timestamptz | |
| `image_url` | text (nullable) | |
| `image_alt` | text (nullable) | |
| `image_credit` | text (nullable) | เครดิตรูป เช่น วัดพระศรีฯ |
| `image_photographer` | text (nullable) | ผู้ถ่าย/เจ้าของภาพ |
| `image_source_url` | text (nullable) | ลิงก์ต้นฉบับภาพ |
| `image_year` | text (nullable) | ปีที่ถ่าย/ช่วงเวลา |
| `google_schema_markup` | jsonb (nullable) | JSON-LD structured data |
| `featured` | boolean | |
| `tags` | text[] | |
| `status` | text | `draft | published | hidden` |
| `entity_name` | text (nullable) | ชื่อ entity (เช่น Khon) |
| `entity_type` | text (nullable) | |
| `wikidata_id` | text (nullable) | |
| `quick_facts` | jsonb (nullable) | array `{label,value}` |
| `glossary` | jsonb (nullable) | array `{term,definition}` |
| `short_excerpt` | text (nullable) | |
| `long_excerpt` | text (nullable) | |
| `social_caption` | text (nullable) | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

> ⚠️ หมายเหตุ: `supabase-types.ts` ยังไม่ได้นิยาม `microsite_id` / `is_published` ไว้ใน `ArticleRow`/`ArticleUpdate` ถึงแม้โค้ดจะใช้จริง — ควรเพิ่มไปใน type ด้วย

---

## 🧱 Table: `categories`

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | uuid (PK) | |
| `slug` | text | unique |
| `name_th` | text | ชื่อไทย |
| `name_en` | text | ชื่ออังกฤษ |
| `description_th` | text (nullable) | |
| `description_en` | text (nullable) | |
| `image_url` | text (nullable) | |
| `sort_order` | integer | ลำดับเรียง |
| `created_at` | timestamptz | |

---

## 🧱 Table: `translations`

บทความที่แปลแล้ว 1 row ต่อ (article_id + locale)

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | uuid (PK) | |
| `article_id` | uuid (FK → articles) | |
| `locale` | text | เช่น `en`, `zh`, `ja` |
| `title` | text | ชื่อที่แปล |
| `excerpt` | text | คำโปรยที่แปล |
| `content` | text | เนื้อหาที่แปล |
| `seo_title` | text (nullable) | |
| `seo_description` | text (nullable) | |
| `entity_name` | text (nullable) | entity ภาษาที่แปล |
| `quick_facts` | jsonb (nullable) | แปลแล้ว |
| `glossary` | jsonb (nullable) | แปลแล้ว |
| `translation_status` | enum | `complete | summary_only | pending` |
| `is_full_translated` | boolean | |
| `translated_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

> unique constraint: `(article_id, locale)`

---

## 🧱 Table: `hero_slides`

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | uuid (PK) | |
| `title_th` | text | |
| `title_en` | text | |
| `subtitle_th` | text (nullable) | |
| `subtitle_en` | text (nullable) | |
| `image_url` | text | รูปอยู่ใน bucket `images/hero-slides/` |
| `cta_text_th` | text (nullable) | |
| `cta_text_en` | text (nullable) | |
| `cta_link` | text (nullable) | |
| `sort_order` | integer | |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## 🧱 Table: `profiles`

ต่อจาก Supabase `auth.users` (id = auth.users.id)

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | uuid (PK = auth.users.id) | |
| `name` | text | |
| `role` | enum `user_role` | `admin | editor | writer` |
| `avatar_url` | text (nullable) | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## 🧱 Table: `microsites`

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | uuid (PK) | |
| `slug` | text | unique |
| `name` | text | |
| `description` | text (nullable) | |
| `is_active` | boolean | |
| `primary_color` | text | |
| `background_color` | text | |
| `background_secondary` | text | |
| `card_color` | text | |
| `logo_url` | text (nullable) | bucket `images/site-settings/` |
| `favicon_url` | text (nullable) | bucket `images/site-settings/` |
| `inherit_from_main` | boolean | |
| `locale_tiers` | jsonb (nullable) | ชุด tier เฉพาะ microsite |
| `show_in_main_nav` | boolean | |
| `main_site_visible` | boolean | |
| `show_main_site_link` | boolean | |
| `custom_nav_links` | jsonb (nullable) | array `{label,href,locale_specific}` |
| `meta_title` | text (nullable) | |
| `meta_description` | text (nullable) | |
| `about_content_th` | text (nullable) | |
| `about_content_en` | text (nullable) | |
| `contact_email` | text (nullable) | |
| `show_author` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## 🧱 Table: `profile_microsites`

Junction — สิทธิ์ผู้ใช้ในแต่ละ microsite

| column | type | หมายเหตุ |
|--------|------|----------|
| `profile_id` | uuid (FK → profiles) | |
| `microsite_id` | uuid (FK → microsites) | |
| `role` | enum | `microsite_admin | microsite_editor | microsite_writer` |
| `created_at` | timestamptz | |

> PK (composite): `(profile_id, microsite_id)`

---

## 🧱 Table: `site_settings`

การตั้งค่าเว็บแบบ single-row (`id = 'default'`)

| column | type | หมายเหตุ |
|--------|------|----------|
| `id` | text (PK) | ปกติ = `'default'` |
| `name` | text | ชื่อเว็บ |
| `tagline` | text | |
| `description` | text | |
| `url` | text | |
| `logo` | text | |
| `logo_full` | text (nullable) | |
| `favicon` | text | |
| `primary_color` | text | |
| `secondary_color` | text | |
| `accent_color` | text | |
| `background_color` | text | |
| `background_color_secondary` | text | |
| `card_color` | text | |
| `card_border_color` | text | |
| `text_color` | text | |
| `text_color_muted` | text | |
| `sidebar_color` | text | |
| `header_color` | text | |
| `success_color` | text | |
| `error_color` | text | |
| `copyright` | text | |
| `locale` | text | `th | en | both` |
| `timezone` | text | เช่น `Asia/Bangkok` |
| `meta_title` | text | |
| `meta_description` | text | |
| `og_title` | text | |
| `og_description` | text | |
| `og_image` | text | |
| `twitter_handle` | text (nullable) | |
| `google_analytics_id` | text (nullable) | |
| `adsense_id` | text (nullable) | |
| `adsense_slot_homepage` | text (nullable) | |
| `adsense_slot_sidebar` | text (nullable) | |
| `facebook_url` | text (nullable) | |
| `twitter_url` | text (nullable) | |
| `instagram_url` | text (nullable) | |
| `youtube_url` | text (nullable) | |
| `tiktok_url` | text (nullable) | |
| `email` | text (nullable) | |
| `phone` | text (nullable) | |
| `address` | text (nullable) | |
| `show_author` | boolean | |
| `enable_comments` | boolean | |
| `enable_social_share` | boolean | |
| `maintenance_mode` | boolean | |
| `maintenance_message` | text (nullable) | |
| `locale_tiers` | jsonb | ชุด `{ 'th':'1', 'en':'1', ... }` |
| `google_oauth_client_id` | text (nullable) | ⚠️ column ใหม่ |
| `google_oauth_client_secret` | text (nullable) | ⚠️ column ใหม่ |
| `facebook_oauth_client_id` | text (nullable) | ⚠️ column ใหม่ |
| `facebook_oauth_client_secret` | text (nullable) | ⚠️ column ใหม่ |
| `translation_api_provider` | text | `gemini | claude | openai` |
| `claude_api_key` | text (nullable) | |
| `openai_api_key` | text (nullable) | |
| `gemini_api_key` | text (nullable) | |
| `support_enabled` | boolean | ⚠️ column ใหม่ |
| `support_qr` | text (nullable) | ⚠️ column ใหม่ (bucket `images/site-settings/`) |
| `support_title` | text (nullable) | ⚠️ column ใหม่ |
| `support_description` | text (nullable) | ⚠️ column ใหม่ |
| `support_account_name` | text (nullable) | ⚠️ column ใหม่ |
| `support_account_number` | text (nullable) | ⚠️ column ใหม่ |
| `updated_at` | timestamptz | |
| `updated_by` | text (nullable) | |

> ⚠️ **คอลัมน์ใหม่ที่เพิ่มในโปรเจกต์นี้** (schema ที่เอามาจากโปรเจกต์อื่นยังไม่มี):
> กลุ่ม OAuth (4 ตัว) + กลุ่ม Support (6 ตัว) — มี SQL ไว้ใน `scripts/add_missing_site_settings_columns.sql`

---

## 🗂️ Storage Bucket: `images`

Bucket เดียวถือแตกรูปทั้งหมด **แยกเป็น folder ตามฟังก์ชัน**

```
images/
├── article-images/
│   └── <YYYY>/<MM>/<file>     ← รูปบทความ แยกตามเดือน (ใหม่)
├── site-settings/
│   └── <file>                  ← logo, favicon, og-image, support QR
├── hero-slides/
│   └── <file>                  ← banner หน้าแรก
└── categories/
    └── <file>                  ← รูปหมวดหมู่
```

- bucket เดิมชื่อ `article-images` → เปลี่ยนเป็น `images` แล้ว
- ไฟล์เก่าที่อยู่ใน bucket `article-images` เดิม ยังใช้ URL เดิมได้ (ไม่ต้องย้ายทันที)
- `/api/upload` รับ `folder` (whitelist: `article-images | site-settings | hero-slides | categories`) และแยก article ตามเดือนโดยอัตโนมัติ

---

## 🔑 Relations / FK (สรุป)

```
auth.users (1) ──< profiles (1:1 โดย id)
profiles.id ──< articles.author_id
categories.id ──< articles.category_id
microsites.id ──< articles.microsite_id
articles.id ──< translations.article_id
profiles.id ──< profile_microsites.profile_id
microsites.id ──< profile_microsites.microsite_id

site_settings: single-row (id = 'default')
```

---

## 🛠️ หมายเหตุการ migrate / sync

- `lib/supabase-types.ts` ไม่มี `microsites`, `profile_microsites`, `site_settings` — เฉพาะ 5 tables หลัก (articles, categories, translations, hero_slides, profiles)
- ถ้าใช้ `supabase gen types typescript` ใหม่ / เพิ่ม type ด้วยมือ ควรให้ครบทั้ง 8 tables เท่าที่โค้ดใช้จริง
- `article.MicrositeArticleMaster` หมายเหตุถึง `microsite_id`, `is_published` ที่โค้ดใช้จริง ควรเพิ่มใน `ArticleRow`
