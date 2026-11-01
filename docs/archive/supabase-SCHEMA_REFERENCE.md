# Siam Heritage — Database Schema Reference

> ใช้เป็น reference สำหรับ fork หรือ setup project ใหม่

## Table: `site_settings`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | TEXT PRIMARY KEY | `'default'` | Row identifier |
| `name` | TEXT | | Site name |
| `tagline` | TEXT | | Site tagline |
| `description` | TEXT | | Site description |
| `url` | TEXT | | Site URL |
| `logo` | TEXT | | Logo path |
| `logo_full` | TEXT | | Full logo path |
| `favicon` | TEXT | | Favicon path |
| `primary_color` | TEXT | | Primary color hex |
| `secondary_color` | TEXT | | Secondary color hex |
| `accent_color` | TEXT | | Accent color hex |
| `background_color` | TEXT | | BG color hex |
| `background_color_secondary` | TEXT | | Secondary BG color |
| `card_color` | TEXT | | Card BG color |
| `card_border_color` | TEXT | | Card border color |
| `text_color` | TEXT | | Text color |
| `text_color_muted` | TEXT | | Muted text color |
| `sidebar_color` | TEXT | | Sidebar BG color |
| `header_color` | TEXT | | Header BG color |
| `success_color` | TEXT | | Success color |
| `error_color` | TEXT | | Error color |
| `copyright` | TEXT | | Copyright text |
| `locale` | TEXT | `'both'` | Site locale (th/en/both) |
| `timezone` | TEXT | `'Asia/Bangkok'` | Timezone |
| `meta_title` | TEXT | | Default meta title |
| `meta_description` | TEXT | | Default meta description |
| `og_title` | TEXT | | OG title |
| `og_description` | TEXT | | OG description |
| `og_image` | TEXT | | OG image URL |
| `twitter_handle` | TEXT | | Twitter/X handle |
| `google_analytics_id` | TEXT | | Google Analytics ID |
| `adsense_id` | TEXT | | Google AdSense ID |
| `adsense_slot_homepage` | TEXT | | Homepage ad slot |
| `adsense_slot_sidebar` | TEXT | | Sidebar ad slot |
| `facebook_url` | TEXT | | Facebook page URL |
| `twitter_url` | TEXT | | Twitter/X URL |
| `instagram_url` | TEXT | | Instagram URL |
| `youtube_url` | TEXT | | YouTube URL |
| `tiktok_url` | TEXT | | TikTok URL |
| `email` | TEXT | | Contact email |
| `phone` | TEXT | | Contact phone |
| `address` | TEXT | | Address |
| `show_author` | BOOLEAN | `true` | Show author on articles |
| `enable_comments` | BOOLEAN | `false` | Enable comments |
| `enable_social_share` | BOOLEAN | `true` | Enable social share |
| `maintenance_mode` | BOOLEAN | `false` | Maintenance mode flag |
| `maintenance_message` | TEXT | | Maintenance message |
| `locale_tiers` | JSONB | | Language tier config |
| `google_oauth_client_id` | TEXT | | Google OAuth client ID |
| `google_oauth_client_secret` | TEXT | | Google OAuth secret |
| `facebook_oauth_client_id` | TEXT | | Facebook OAuth client ID |
| `facebook_oauth_client_secret` | TEXT | | Facebook OAuth secret |
| `translation_api_provider` | TEXT | `'gemini'` | Translation provider (gemini/claude/openai) |
| `gemini_api_key` | TEXT | | Gemini API key |
| `openai_api_key` | TEXT | | OpenAI API key |
| `claude_api_key` | TEXT | | Claude API key |
| `support_enabled` | BOOLEAN | `false` | Enable support section (สนับสนุนผู้ทำเว็บ) |
| `support_qr` | TEXT | | QR code image URL (โอนเงินผ่านธนาคาร) |
| `support_title` | TEXT | | Support section title (Thai) |
| `support_description` | TEXT | | Support section description (Thai) |
| `support_account_name` | TEXT | | Bank account name |
| `support_account_number` | TEXT | | Bank account number |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update timestamp |
| `updated_by` | TEXT | | Who updated |

## Table: `articles`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `uuid_generate_v4()` | Primary key |
| `slug` | TEXT UNIQUE | | URL slug |
| `original_title` | TEXT | | Thai title |
| `original_excerpt` | TEXT | | Thai excerpt |
| `original_content` | TEXT | | Thai content |
| `category_id` | UUID FK → categories(id) | | Category |
| `author_id` | UUID FK → profiles(id) | | Author user ID |
| `author_name` | TEXT | | Display author name |
| `published_at` | DATE | `CURRENT_DATE` | Publish date |
| `image_url` | TEXT | | Featured image URL |
| `image_alt` | TEXT | | Image alt text (Thai) |
| `image_credit` | TEXT | | Image credit |
| `image_photographer` | TEXT | | Photographer name |
| `image_source_url` | TEXT | | Original source URL |
| `image_year` | TEXT | | Image year |
| `featured` | BOOLEAN | `false` | Featured flag |
| `tags` | JSONB | `[]` | Tags array |
| `status` | TEXT | `'published'` | Status (draft/pending_review/published/hidden/deleted) |
| `show_author` | BOOLEAN | `true` | Show author section |
| `entity_name` | TEXT | | Entity name (wiki-style) |
| `entity_name_en` | TEXT | | Entity name in English |
| `entity_type` | TEXT | | Entity type (person/place/tradition/object/event/concept/other) |
| `wikidata_id` | TEXT | | Wikidata Q-ID |
| `quick_facts` | JSONB | | Quick facts array |
| `glossary` | JSONB | | Glossary array |
| `short_excerpt` | TEXT | | Short excerpt (≤150 chars) |
| `long_excerpt` | TEXT | | Long excerpt (250-400 chars) |
| `social_caption` | TEXT | | Social share caption |
| `created_at` | TIMESTAMPTZ | `NOW()` | Created timestamp |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Updated timestamp |

## Table: `translations`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `uuid_generate_v4()` | Primary key |
| `article_id` | UUID FK → articles(id) ON DELETE CASCADE | | Parent article |
| `locale` | TEXT | | Target locale (en, zh, ja, etc.) |
| `title` | TEXT | | Translated title |
| `excerpt` | TEXT | | Translated excerpt |
| `content` | TEXT | `''` | Translated content |
| `seo_title` | TEXT | | SEO title override |
| `seo_description` | TEXT | | SEO description override |
| `translation_status` | translation_status | `'pending'` | Status (complete/summary_only/pending) |
| `is_full_translated` | BOOLEAN | `false` | Full content translated |
| `short_excerpt` | TEXT | | Translated short excerpt (v2) |
| `long_excerpt` | TEXT | | Translated long excerpt (v2) |
| `tags` | JSONB | `[]` | Translated tags (v2) |
| `image_alt_texts` | JSONB | `{}` | Translated image alts (v2) |
| `entity_name` | TEXT | | Translated entity name (v2) |
| `quick_facts` | JSONB | `{}` | Translated quick facts (v2) |
| `glossary` | JSONB | `[]` | Translated glossary (v2) |
| `social_caption` | TEXT | | Translated social caption (v2) |
| `translated_at` | TIMESTAMPTZ | `NOW()` | Last translation timestamp |
| `created_at` | TIMESTAMPTZ | `NOW()` | Created timestamp |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Updated timestamp |
| UNIQUE | | | (article_id, locale) |

## Table: `categories`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `uuid_generate_v4()` | Primary key |
| `slug` | TEXT UNIQUE | | URL slug |
| `name_th` | TEXT | | Thai name |
| `name_en` | TEXT | | English name |
| `description_th` | TEXT | | Thai description |
| `description_en` | TEXT | | English description |
| `image_url` | TEXT | | Category image |
| `created_at` | TIMESTAMPTZ | `NOW()` | Created timestamp |

## Table: `profiles`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID PK FK → auth.users(id) ON DELETE CASCADE | | User ID |
| `name` | TEXT | | Display name |
| `role` | user_role | `'writer'` | Role (admin/editor/writer) |
| `avatar_url` | TEXT | | Avatar URL |
| `created_at` | TIMESTAMPTZ | `NOW()` | Created timestamp |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Updated timestamp |

## Table: `hero_slides`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `uuid_generate_v4()` | Primary key |
| `title_th` | TEXT | | Thai title |
| `title_en` | TEXT | | English title |
| `subtitle_th` | TEXT | | Thai subtitle |
| `subtitle_en` | TEXT | | English subtitle |
| `image_url` | TEXT | | Image URL |
| `image_alt_th` | TEXT | | Thai image alt |
| `image_alt_en` | TEXT | | English image alt |
| `cta_text_th` | TEXT | | Thai CTA text |
| `cta_text_en` | TEXT | | English CTA text |
| `cta_link` | TEXT | | CTA link |
| `sort_order` | INTEGER | `0` | Display order |
| `is_active` | BOOLEAN | `true` | Active flag |
| `created_at` | TIMESTAMPTZ | `NOW()` | Created timestamp |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Updated timestamp |

## Custom Types (ENUMs)

```sql
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'writer');
CREATE TYPE translation_status AS ENUM ('complete', 'summary_only', 'pending');
```

## Indexes

```sql
-- Articles
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_featured ON articles(featured) WHERE featured = TRUE;
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);

-- Translations
CREATE INDEX idx_translations_article ON translations(article_id);
CREATE INDEX idx_translations_locale ON translations(locale);

-- Hero slides
CREATE INDEX idx_hero_slides_active ON hero_slides(sort_order) WHERE is_active = TRUE;
```

## RLS Policies

> ดูรายละเอียดใน `supabase/migrations/00001_initial_schema.sql`
> และ `supabase/migrations/00004_create_storage_buckets.sql`
