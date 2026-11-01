# ขั้นตอนทำบทความด้วย Claude Code (หัวข้อ + เนื้อหาคร่าวๆ → draft)

> อัปเดตล่าสุด: 2026-11-01 — เพิ่ม `/draft-article`, `/clone-article`

หลักการ: **คนเป็นคนเลือกหัวข้อ ใส่ข้อเท็จจริงและแหล่งอ้างอิง** Claude ช่วยเรียบเรียงเป็นบทความเต็ม แล้วส่งออกเป็นไฟล์ JSON
ไฟล์นั้น import เข้าเว็บเป็น **draft** เสมอ ต้องมีคนตรวจก่อน publish

## 1. เตรียมหัวข้อ (ฝั่งคน)

สร้างไฟล์ markdown **นอก repo** เช่น `~/Project-UnFakeNews/content/2026-11-01-topics.md`

```markdown
## หัวข้อ: เขมรอ้างว่าไทยยิงก่อนที่ช่องบก
- ข้อกล่าวอ้าง: (ใคร พูดที่ไหน เมื่อไร + ลิงก์)
- ข้อเท็จจริง: ...
- หลักฐาน/แหล่งอ้างอิง: (ลิงก์ข่าว แถลงการณ์ รูป วิดีโอ)
- คำตัดสิน: เท็จ / บิดเบือน / ขาดบริบท
- หมวดหมู่: (slug ของหมวดในเว็บ)
```

ยิ่งใส่แหล่งอ้างอิงครบ บทความยิ่งแม่น เพราะ Claude ใช้เฉพาะข้อมูลที่ให้ไป และไม่แต่งแหล่งที่มาเพิ่มเอง

## 2. สั่ง Claude Code

เปิด Claude Code **ในโฟลเดอร์ repo** (`unfakenews-082026`) แล้วพิมพ์

```
/draft-article ~/Project-UnFakeNews/content/2026-11-01-topics.md
/draft-article ~/Project-UnFakeNews/content/2026-11-01-topics.md factbase.asia      ← ร่างลงเว็บเครือข่ายเป็นภาษาอังกฤษโดยตรง
/draft-article ~/Project-UnFakeNews/content/2026-11-01-topics.md unfakenews.asia ค้นข้อมูลเพิ่มได้
```

- 1 หัวข้อ (`## หัวข้อ:`) = 1 ไฟล์ บันทึกที่ `<โฟลเดอร์ไฟล์หัวข้อ>/out/<เว็บ>/<slug>.json`
- โครงบทความ: ข้อกล่าวอ้าง → คำตัดสิน → ข้อเท็จจริง → บริบท → สรุป → แหล่งอ้างอิง + quick facts + ClaimReview schema
- Claude ใช้เฉพาะข้อมูลและลิงก์ที่ให้ไป เปิดอ่านลิงก์เพื่อยืนยันรายละเอียดได้ แต่ **ไม่ค้นแหล่งใหม่** เว้นแต่สั่งในหมายเหตุ
- หัวข้อที่ข้อมูลไม่พอจะถูกข้าม พร้อมบอกว่าต้องเพิ่มอะไร
- ถ้าไม่ได้ใส่คำตัดสิน Claude จะเสนอให้ และบอกว่าต้องยืนยัน
- กติกาทั้งหมดอยู่ใน `.claude/commands/draft-article.md`

## 3. Import → ตรวจ → Publish

1. Admin → บทความ → **เขียนบทความใหม่** → ปุ่ม **Import JSON** → เลือกไฟล์
2. ระบบสร้างบทความเป็น **draft** แล้วเปิดหน้า edit ให้ทันที
3. ตรวจ: ข้อเท็จจริง, ลิงก์แหล่งอ้างอิงเปิดได้จริง, รูป, หมวดหมู่
4. เปลี่ยนสถานะเป็น published → (ถ้าต้องการ) กดแปลภาษาอื่น

## 4. Clone ไปเว็บเครือข่าย (ภาษาอังกฤษ)

1. หน้า edit ของบทความในเว็บหลัก → **Export JSON**
2. เปิด Claude Code **ในโฟลเดอร์ repo** (`unfakenews-082026`) แล้วพิมพ์

   ```
   /clone-article ~/Downloads/article-<slug>.json unmask.asia
   /clone-article ~/Downloads/article-<slug>.json all          ← ทำครบ 4 เว็บ มุมเล่าต่างกัน
   /clone-article ~/Downloads/article-<slug>.json debunk.asia เน้นเรื่องภาพตัดต่อ
   ```

   Claude จะเรียบเรียงใหม่เป็นภาษาอังกฤษตามมุมเล่าของแต่ละเว็บ ตั้ง `source_locale: "en"` ใช้ slug ใหม่ เอาคำแปลออก
   แล้วตรวจไฟล์ให้เอง (slug, ไม่มีอักษรไทยหลง, ลิงก์ไม่หาย) บันทึกที่ `<โฟลเดอร์ไฟล์ export>/out/<เว็บ>/<slug>.json`
   พร้อมสรุปจุดที่ควรตรวจก่อน publish
3. เว็บปลายทาง → Admin → เขียนบทความใหม่ → **Import JSON** → ตรวจ → Publish

มุมเล่าของแต่ละเว็บและกติกาการเขียนอยู่ใน `.claude/commands/clone-article.md` ถ้าอยากปรับให้แก้ที่ไฟล์นั้น

| เว็บ | มุมเล่า |
|---|---|
| unmask.asia | เปิดโปงกลไกการบิดเบือน (ใครปล่อย ใช้เทคนิคอะไร) |
| factbase.asia | ข้อมูล/หลักฐาน/ไทม์ไลน์เป็นหลัก |
| contextasia.org | บริบททางประวัติศาสตร์ ภูมิศาสตร์ กฎหมาย ที่หายไป |
| debunk.asia | สั้น ตัดสินทีละประเด็น |

> ⚠️ **SEO:** ถ้าบทความเดียวกันถูกเรียบเรียงลงหลายเว็บแบบแค่สลับประโยค Google อาจมองว่าเป็น duplicate/scaled content แล้วลดอันดับทั้งเครือข่าย
> แต่ละเว็บควรมีมุมเล่า โครงเรื่อง หรือข้อมูลเสริมที่ต่างกันจริง

## 5. รูปแบบไฟล์ JSON (สำหรับ Import)

ตรงกับ `ArticleTransferPayload` ใน `app/api/admin/articles/[slug]/transfer/route.ts`

```json
{
  "__version": 1,
  "__exported_at": "2026-11-01T00:00:00Z",
  "__source_slug": "cambodia-claim-chong-bok",
  "article": {
    "slug": "cambodia-claim-chong-bok",
    "source_locale": "th",
    "original_title": "...",
    "original_excerpt": "...",
    "original_content": "markdown ...",
    "category_slug": "fact-check",
    "author_name": "ทีมงาน UnFake News",
    "published_at": null,
    "image_url": null, "image_alt": null, "image_credit": null,
    "image_photographer": null, "image_source_url": null, "image_year": null,
    "featured": false,
    "tags": ["..."],
    "status": "draft",
    "entity_name": null, "entity_type": null, "wikidata_id": null,
    "quick_facts": [{ "label": "ข้อกล่าวอ้าง", "value": "..." }, { "label": "คำตัดสิน", "value": "เท็จ" }],
    "glossary": null,
    "short_excerpt": "...", "long_excerpt": "...",
    "social_caption": "...",
    "google_schema_markup": { "@context": "https://schema.org", "@type": "ClaimReview", "...": "..." }
  },
  "translations": []
}
```

- `slug` ใช้ a–z, 0–9, `-` เท่านั้น
- `category_slug` ต้องตรงกับ slug หมวดที่มีในเว็บปลายทาง (ถ้าไม่ตรง ระบบจะใส่หมวดแรกที่เจอใน DB — ต้องแก้หมวดเองตอนตรวจ)
- ถ้าเว็บปลายทางมีบทความ slug เดียวกันอยู่แล้ว การ import จะ **อัปเดตทับ** บทความนั้น และเปลี่ยนสถานะกลับเป็น **draft** (ถ้าเคย publish แล้วจะหายจากหน้าเว็บจนกว่าจะ publish ใหม่)
- `translations` ที่เป็นภาษาเดียวกับ `source_locale` จะถูกข้าม
- รูป (`image_url` และรูปในเนื้อหา) ยังชี้ไป Storage ของเว็บต้นทาง ใช้ได้เพราะ bucket เป็น public แต่ถ้าลบรูปที่เว็บต้นทาง รูปที่เว็บปลายทางจะหายด้วย

## 6. ต่อยอด (ยังไม่ได้ทำ)

- ตั้งเวลาให้ร่างอัตโนมัติ (`/schedule`) ซึ่งต้องเพิ่ม API endpoint ที่ใช้ token ส่ง draft เข้าเว็บ
