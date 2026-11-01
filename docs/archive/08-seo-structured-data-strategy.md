# 08-seo-structured-data-strategy.md

# กลยุทธ์ SEO + Structured Data สำหรับ Siam Heritage

> **วัตถุประสงค์:** ปรับปรุงข้อมูลทางวัฒนธรรมที่ถูกบิดเบือนโดยกัมพูชา  
> **เป้าหมาย:** ทำให้ Google Search, Google Images, Wikipedia, และ AI (ChatGPT/Gemini)  
> อ่านและอ้างอิงข้อมูลที่ถูกต้องว่า "มวยไทย, ชุดไทยผ้าสไบ, โขนไทย และมรดกไทยอื่นๆ เป็นของไทย"

---

## สารบัญ

1. [ภาพรวมกลยุทธ์](#1-ภาพรวมกลยุทธ์)
2. [Google Search — JSON-LD Schema.org](#2-google-search--json-ld-schemaorg)
3. [Google Images — ImageObject Schema](#3-google-images--imageobject-schema)
4. [Wikidata Q-ID — เชื่อมโยง Wikipedia + AI](#4-wikidata-q-id--เชื่อมโยง-wikipedia--ai)
5. [Hreflang + Canonical — ลำดับภาษา](#5-hreflang--canonical--ลำดับภาษา)
6. [Robots.txt + Sitemap.xml](#6-robotstxt--sitemapxml)
7. [AI / ChatGPT / Gemini Readable](#7-ai--chatgpt--gemini-readable)
8. [สรุปกลไกการทำงานครบวงจร](#8-สรุปกลไกการทำงานครบวงจร)
9. [ขั้นตอนการปฏิบัติ](#9-ขั้นตอนการปฏิบัติ)
10. [สิ่งที่ต้องทำบน Supabase](#10-สิ่งที่ต้องทำบน-supabase)

---

## 1. ภาพรวมกลยุทธ์

กัมพูชา flood รูปภาพและข้อมูลเกี่ยวกับวัฒนธรรมไทยลง Social Media, Wikipedia Commons, Google Images โดย:
- ใส่คำบรรยายว่ารูปชุดไทย, รูปมวยไทย, รูปผ้าสไบ, รูปโขนไทย เป็นวัฒนธรรมของกัมพูชา
- ไม่มีข้อมูลต้นทาง (Credit) → อ้างว่าเป็นของตน
- AI (ChatGPT/Gemini/DALL-E) ถูกเทรนด้วยข้อมูลที่ผิดเพี้ยนนี้

### วิธีการแก้ของ Siam Heritage — 3 เลเยอร์

| เลเยอร์ | ระบบ | จัดการกับ |
|---------|------|-----------|
| **1** | ImageObject Schema (JSON-LD) | Google Images |
| **2** | Wikidata Q-ID + Entity JSON-LD | Wikipedia + Knowledge Panel + AI |
| **3** | Hreflang + Canonical + Robots/Sitemap | Google Search Ranking |

---

## 2. Google Search — JSON-LD Schema.org

### 2.1 Article Schema

ทุกบทความบน Siam Heritage มี JSON-LD Article Schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "มวยไทย: ศิลปะการต่อสู้ประจำชาติไทย",
  "description": "มวยไทยเป็นศิลปะการต่อสู้ของไทยที่มีมาช้านาน...",
  "author": { "@type": "Person", "name": "ทีมงาน  UnFake News" },
  "publisher": { "@type": "Organization", "name": " UnFake News" },
  "image": { "@type": "ImageObject", ... },
  "about": [ ... ],
  "mentions": [ ... ],
  "keywords": "มวยไทย, Muay Thai, ศิลปะการต่อสู้ไทย, มรดกไทย",
  "articleSection": "มรดกไทย"
}
```

### 2.2 Entity Facts Schema

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "มวยไทย",
  "identifier": {
    "@type": "PropertyValue",
    "propertyID": "Wikidata",
    "value": "Q1343136"
  },
  "description": "ศิลปะการต่อสู้ของไทยที่มีมาตั้งแต่สมัยอยุธยา",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "ที่มา", "value": "ไทย" },
    { "@type": "PropertyValue", "name": "ยุคสมัย", "value": "กรุงศรีอยุธยา" },
    { "@type": "PropertyValue", "name": "UNESCO", "value": "มรดกวัฒนธรรมที่จับต้องไม่ได้" }
  ]
}
```

### ข้อดี

| ข้อดี | รายละเอียด |
|------|-----------|
| **Google Knowledge Panel** | Google อ่าน Entity ที่มี Wikidata ID → แสดงในกรอบความรู้ |
| **Featured Snippet** | Schema ที่ถูกต้องช่วยให้ Google เลือกแสดงเป็น Featured Snippet |
| **Keyword Ranking** | keywords + articleSection บอก Google ว่าบทความนี้เกี่ยวข้องกับ "มวยไทย" และเป็น "มรดกไทย" |

---

## 3. Google Images — ImageObject Schema

### 3.1 โครงสร้าง

```json
{
  "@type": "ImageObject",
  "url": "https://siamheritage.org/images/muay-thai-history.jpg",
  "contentUrl": "https://siamheritage.org/images/muay-thai-history.jpg",
  "caption": "มวยไทยในสมัยกรุงศรีอยุธยา — มรดกไทย",
  "creditText": "วัดพระศรีรัตนศาสดาราม / หอจดหมายเหตุแห่งชาติ",
  "photographer": "ช่างภาพรอยพระพุทธบาท",
  "dateCreated": "พ.ศ. 2560",
  "representativeOfPage": true,
  "associatedArticle": {
    "@type": "Article",
    "url": "https://siamheritage.org/th/articles/muay-thai"
  }
}
```

### 3.2 วิธีป้อนข้อมูลใน Admin

ใน **Article Editor** → หัวข้อ "ข้อมูลกำกับรูปภาพ (สำหรับ SEO + Google Images)":

| ช่อง | ตัวอย่าง | ความสำคัญ |
|------|---------|-----------|
| **ที่มาของรูปภาพ (Credit)** | วัดพระศรีรัตนศาสดาราม, หอจดหมายเหตุแห่งชาติ, สมบัติส่วนตัว | Google แสดงเครดิตใต้รูป — คนเห็นได้ทันทีว่ารูปนี้เป็นของไทย |
| **ผู้ถ่าย / เจ้าของภาพ** | ช่างภาพรอยพระพุทธบาท, กรมศิลปากร | บ่งบอกว่าคนไทย/หน่วยงานไทยเป็นเจ้าของ |
| **ปีที่ถ่าย / ช่วงเวลา** | พ.ศ. 2560, ราว พ.ศ. 2470 | บ่งบอกความเก่าแก่ — ภาพเก่า = หลักฐานทางประวัติศาสตร์ |
| **URL ต้นฉบับ** | https://siamheritage.org/images/... | Google ใช้เชื่อมโยงกลับมาที่เว็บเรา |

### 3.3 ข้อดี

| ข้อดี | รายละเอียด |
|------|-----------|
| **Google Images Ranking** | รูปที่มี ImageObject Schema + creditText ได้ priority สูงกว่า |
| **Credit แสดงใต้รูป** | เมื่อมีคนค้นหารูปภาพ "มวยไทย" → Google แสดงเครดิต "วัดพระศรีรัตนศาสดาราม" |
| **ลิงก์กลับ** | representativeOfPage + associatedArticle → Google ลิงก์กลับไปที่ siamheritage.org |
| **ป้องกันการ claim** | รูปที่ไม่มี Credit / Schema จะถูก Google จัดลำดับต่ำกว่ารูปของเรา |

---

## 4. Wikidata Q-ID — เชื่อมโยง Wikipedia + AI

### 4.1 Q-ID คืออะไร

Wikidata Q-ID คือเลขประจำตัวของสิ่งนั้นๆ ใน Wikidata (ฐานความรู้สากล) เช่น:

| สิ่งที่ | Q-ID |
|-------|------|
| โขนไทย | Q65549329 |
| มวยไทย | Q1343136 |
| ชุดไทยผ้าสไบ | Q13078062 |
| วัดพระแก้ว | Q652885 |
| ลอยกระทง | Q7220924 |
| การนวดไทย | Q17005926 |
| ภาษาไทย | Q9217 |

### 4.2 วิธีหา Q-ID

1. ไปที่ [wikidata.org](https://www.wikidata.org)
2. ค้นหาชื่อภาษาไทย เช่น "มวยไทย"
3. คัดลอก Q-ID จาก URL (เช่น `Q1343136`)
4. ใส่ใน **Article Editor → Wikidata ID**

### 4.3 ข้อดี

| แพลตฟอร์ม | กลไก | ผล |
|-----------|-------|-----|
| **Wikipedia** | เมื่อมี `wikidataId` ใน Schema → Wikipedia บทความภาษาไทยถูก Google จับคู่กับ Entity นี้ | Wikipedia ไทยถูกจัดลำดับเหนือกว่าบทความกัมพูชา |
| **Google Knowledge Panel** | Google อ่าน Entity ที่มี Wikidata ID → แสดงในกรอบความรู้ | ทุกคนที่ค้นหา "มวยไทย" จะเห็น Knowledge Panel ว่าเป็นของไทย |
| **ChatGPT/Gemini** | Both models ใช้ Wikidata เป็นแหล่ง truth | เมื่อถาม "What is Muay Thai?" → ตอบว่าเป็นของไทย |

---

## 5. Hreflang + Canonical — ลำดับภาษา

### 5.1 โครงสร้าง

```html
<link rel="alternate" hreflang="th" href="https://siamheritage.org/th/articles/muay-thai" />
<link rel="alternate" hreflang="en" href="https://siamheritage.org/en/articles/muay-thai" />
<link rel="alternate" hreflang="x-default" href="https://siamheritage.org/en/articles/muay-thai" />
<link rel="canonical" href="https://siamheritage.org/en/articles/muay-thai" />
```

### 5.2 ข้อดี

| ข้อดี | รายละเอียด |
|------|-----------|
| **ภาษาไทยเป็น primary** | Google เข้าใจว่าภาษาไทยคือต้นฉบับ |
| **ป้องกัน duplicate content** | 15 ภาษาบน slug เดียว → canonical ป้องกันถูก penalize |
| **แย่งอันดับคู่แข่ง** | เมื่อมีคนค้นหา "มวยไทย" → siamheritage.org ติดอันดับ 1 เพราะ hreflang ตรงกับภาษา |

---

## 6. Robots.txt + Sitemap.xml

### 6.1 robots.txt (`app/robots.ts`)

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://siamheritage.org/sitemap.xml
```

### 6.2 sitemap.xml (`app/sitemap.ts`)

Dynamic sitemap ที่ครอบคลุม:
- 15 ภาษา × static pages (home, about, contact, privacy)
- 15 ภาษา × articles list page
- 15 ภาษา × article detail pages

### 6.3 ข้อดี

| ข้อดี | รายละเอียด |
|------|-----------|
| **Google index ครบทุกหน้า** | sitemap บอก Google ว่ามี URL อะไรบ้าง |
| **Indexing เร็วขึ้น** | Google ไม่ต้อง crawl เองทั้งหมด |
| **Disallow admin** | ป้องกัน admin leak สู่ search result |

---

## 7. AI / ChatGPT / Gemini Readable

### 7.1 Semantic HTML

```html
<section aria-label="Article header">
  <div data-wiki="abstract-short">
    มวยไทยเป็นศิลปะการต่อสู้ของไทยที่มีมาตั้งแต่สมัยกรุงศรีอยุธยา...
  </div>
  <div data-wiki="abstract-full">
    มวยไทยมีวิวัฒนาการมาจากการต่อสู้ของทหารไทยในสมัยโบราณ...
  </div>
</section>
```

- ChatGPT/Gemini ใช้ Semantic HTML + JSON-LD เพื่อ extract ข้อมูล
- AI เห็น `data-wiki`, `aria-label`, และ Schema structured data ก่อนข้อความอื่น

### 7.2 Wikidata สำหรับ AI

AI models (ChatGPT, Gemini, Claude, Perplexity) ใช้ Wikidata เป็น **Ground Truth** เวลาตอบคำถามเกี่ยวกับ "What is X?"

> ถ้า Q1343136 (มวยไทย) ใน Wikidata ระบุว่า "country of origin = Thailand" → AI ทุกตัวจะตอบว่า "Muay Thai originated in Thailand"

---

## 8. สรุปกลไกการทำงานครบวงจร

```
ผู้ใช้ค้นหา "มวยไทย" / "ชุดไทยผ้าสไบ" / "โขนไทย" ใน Google

          ↓

Google เห็น JSON-LD + Wikidata Q-ID + hreflang + imageCredit

          ↓

Google Knowledge Panel แสดง:
"โขนไทย (Khon) — ศิลปะการแสดงของไทย"
"มวยไทย (Muay Thai) — ศิลปะการต่อสู้ของไทย"
"ชุดไทยผ้าสไบ (Thai Sabai) — ชุดประจำชาติไทย"
    พร้อมเครดิตภาพ: "วัดพระศรีรัตนศาสดาราม / หอจดหมายเหตุแห่งชาติ"
    พร้อมลิงก์ไป: siamheritage.org

          ↓

ChatGPT/Gemini เทรน/Retrieve จาก Google + Wikidata

          ↓

AI ตอบถูกต้อง: 
- "Muay Thai is a Thai martial art"
- "Sabai cloth is a traditional Thai garment"
- "Khon is a Thai performing art"

          ↓

Wikipedia ไทยโดน Google จัดลำดับเหนือกว่า Wikipedia กัมพูชา

          ↓

วงจรข้อมูลที่ถูกต้องกลับคืนมา
```

---

## 9. ขั้นตอนการปฏิบัติ

### 🔥 ทำทันที

| # | งาน | วิธีทำ |
|--|-----|--------|
| 1 | **ตั้ง Env Vars ใน Vercel** | `GEMINI_API_KEY`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` |
| 2 | **รัน SQL migration** | เพิ่ม columns image_credit, image_photographer, image_source_url, image_year ใน Supabase |
| 3 | **เขียน Content จริง 5-10 เรื่อง** | ใช้ Admin Editor → ใส่ Wikidata ID, Quick Facts, Glossary, image credit |

### ⏳ เมื่อ content พร้อม

| # | งาน |
|--|-----|
| 4 | **Deploy** push ขึ้น Vercel |
| 5 | **Google Search Console** → [search.google.com/search-console](https://search.google.com/search-console) → add property → verify → submit sitemap |
| 6 | **Bing Webmaster** → [bing.com/webmasters](https://www.bing.com/webmasters) → import จาก Google |
| 7 | **ตรวจ Schema** → [validator.schema.org](https://validator.schema.org/) |

### 📈 เมื่อมี content ~20 เรื่อง

| # | งาน |
|--|-----|
| 8 | สมัคร Google AdSense → ใส่ ID ใน Admin Settings |
| 9 | Social Preview Debug → Facebook/Twitter/LinkedIn |

### 🏛️ Wikidata Q-ID

- ใส่ทุกครั้งเมื่อมี Entity ที่ต้องการ (โขน, มวยไทย, ชุดไทยผ้าสไบ, วัดต่างๆ ฯลฯ)
- ไป [wikidata.org](https://www.wikidata.org) → ค้นหา → คัดลอก Q-ID → ใส่ใน Article Editor

---

## 10. สิ่งที่ต้องทำบน Supabase

### SQL Migration

```sql
-- เพิ่ม columns สำหรับ image metadata
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS image_credit text,
ADD COLUMN IF NOT EXISTS image_photographer text,
ADD COLUMN IF NOT EXISTS image_source_url text,
ADD COLUMN IF NOT EXISTS image_year text;

-- เพิ่ม columns สำหรับ entity/wiki translation (ถ้าต้องใช้)
ALTER TABLE translations
ADD COLUMN IF NOT EXISTS entity_name text,
ADD COLUMN IF NOT EXISTS quick_facts jsonb,
ADD COLUMN IF NOT EXISTS glossary jsonb;
```

---

> **สรุปสั้นๆ**
> - **Social Media flood** = แก้ที่ปลายเหตุ (คนเห็นแป๊บเดียว, ข้อมูลไม่ยั่งยืน)
> - **JSON-LD + Wikidata + Schema.org** = แก้ที่ต้นเหตุ (Google, AI, Wikipedia ใช้เป็น Ground Truth)
>
> เมื่อ Google, ChatGPT, และ Wikipedia เชื่อว่า **"มวยไทย, ชุดไทยผ้าสไบ, โขนไทย เป็นของไทย"** — data flood จากกัมพูชาจะไร้ความหมาย
