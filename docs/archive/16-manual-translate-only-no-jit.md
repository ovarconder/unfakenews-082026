# ยกเลิก Auto-Translate ตอน Save + แปลเนื้อหาเต็มทุกภาษา (ไม่มี JIT)

> อัปเดตล่าสุด: สิงหาคม 2025

## 🎯 บทสรุป

ปรับเปลี่ยนระบบการแปลบทความให้เป็น **"แปลด้วยมือผ่านปุ่มเท่านั้น"** เพื่อควบคุมการใช้ token และลดความเสี่ยงจากความช้า/ความผิดพลาดของระบบอัตโนมัติ ประกอบด้วย 3 ส่วนหลัก:

1. **ไม่มีการแปลอัตโนมัติตอนกด Save** ภาษาไทยอีกต่อไป — แอดมินกดปุ่ม "แปลอัตโนมัติ" ทีละภาษาเอาเอง
2. **ทุกภาษา (Tier 1 + Tier 2) แปล content เต็มเหมือนกัน** — ไม่แยก Tier 2 ให้ JIT
3. **ลบระบบ JIT (Just-in-Time) content** — ไม่มีการแปลตอนผู้ใช้เปิดอ่านบทความ

---

## 🔄 เปรียบเทียบก่อน/หลัง

| หัวข้อ | ก่อน | หลัง |
|--------|------|------|
| กด Save ภาษาไทย | auto-translate ภาษาอังกฤษทันที | **ไม่แปลอะไรเลย** |
| การแปลแต่ละภาษา | กดปุ่ม "แปลอัตโนมัติ" | กดปุ่ม "แปลอัตโนมัติ" (เหมือนเดิม) |
| Tier 2 (ภาษาน้อย) | แปลเฉพาะ SEO+summary, content = JIT | **แปล content เต็มเหมือน Tier 1** |
| เปิดอ่านบทความ tier2 ที่ยังไม่แปลเนื้อหา | JIT เรียก Gemini ให้ผู้ใช้รอ (ช้า) | **เห็นเนื้อหาที่แปลเสร็จแล้วทันที** |
| `translation_status` | mixed (`complete` / `summary_only`) | **`complete` เสมอ** (ทุกภาษาแปลเต็ม) |

---

## 🔍 แนวคิด / เหตุผล

### 1. 👆 แปลมือ เพราะอยากควบคุม token & ความช้า

- การแปลกิน token และใช้เวลานาน
- ถ้าแปลอัตโนมัติตอน save อาจผิดพลาด/ช้า และสิ้นเปลืองโดยไม่จำเป็น (เช่น เพิ่งจะแก้แล้วยังไม่ต้องการแปล)
- ให้แอดมิน **เลือกเวลากดแปลเอาเอง** ต่อภาษา แทนที่จะแปลทุกครั้งที่ save

### 2. 🌐 Tier 1 = Tier 2 (แปลเต็มทุกภาษา)

- เดิม Tier 2 (10 ภาษาน้อยนิยม) แปลเฉพาะ title/SEO/excerpt แต่ไม่แปล content (ประหยัดผ่าน JIT)
- แต่เพราะตอนนี้แปล **ด้วยมือกดปุ่มทั้งหมดอยู่แล้ว** จึงไม่มีเหตุผลต้องประหยัดผ่าน JIT อีก
- ทำให้ทุกภาษา (Tier 1 + Tier 2) แปล **content เต็ม** → ผลลัพธ์สม่ำเสมอ

### 3. 🚫 ลบ JIT (Just-in-Time content)

- เดิม บทความ Tier 2 ที่ยังไม่แปล content เมื่อผู้ใช้เปิดอ่านจะ trigger การแปลทันที → ผู้ใช้ต้อง**รอ** แปลครั้งแรกช้ามาก
- หลังเปลี่ยนเป็นแปลมือ ทุกภาษาแปลเนื้อหาเต็มไว้ล่วงหน้าแล้ว จึง**ไม่ต้องมี JIT** → เปิดอ่านไวทันที

---

## 🗂️ ไฟล์ที่ปรับแก้

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `app/admin/articles/edit/[slug]/edit-client.tsx` | ลบ auto-translate EN ออกจาก `handleSave`; เพิ่ม `localStatus` อัปเดต label ทันทีหลังแปลสำเร็จ |
| `app/api/translate-new/route.ts` | Tier 2 แปล content เต็มเหมือน Tier 1; ลบ logic เก็บ content JIT/summary_only |
| `components/articles/article-detail.tsx` | ลบ useEffect JIT + overlay spinner; render `article.content` ตรง ๆ |
| `components/microsite/microsite-article-detail.tsx` | ลบ `fetchContentTranslation` + overlay; ใช้ translated content โดยตรง |
| `app/api/translate-content/[slug]/route.ts` | **ลบไฟล์** (ไม่มี caller แล้ว) |
| `lib/translation-client-store.ts` | **ลบไฟล์** (dead code) |
| `lib/publish-automation.ts` | อัปเดต comment ที่อ้าง JIT ให้ตรงความจริง |

---

## 📥 Flow ใหม่

```
แอดมินแก้ต้นฉบับไทย
       │
       ▼
กด "บันทึก" (ภาษาไทย) ──► PUT /api/admin/articles  (แค่ save, ไม่แปล)
       │
       └─► เลือกภาษา [EN] [JA] [FR] ...
                 │
                 ▼
        กดปุ่ม "แปลอัตโนมัติ" ──► POST /api/translate-new { slug, locale }
                                      │
                                      ├── tier1/tier2 แปล content เต็ม
                                      ▼
                               upsert translations table
                                      │
                                      ├── translation_status = "complete"
                                      └── label ภาษาเปลี่ยนเป็น ✓ ทันที
```

---

## 🧪 วิธีทดสอบ

1. ในหน้า `/admin/articles/edit/[slug]`:
   - แก้ไขต้นฉบับไทย → กด **Save** มีข้อมูลบันทึกลง `articles` table แต่**ไม่มีการแปลอัตโนมัติ**
2. เลือกภาษาใดก็ได้ (เช่น JA) → กดปุ่ม **"แปลอัตโนมัติ"**:
   - รอจนเสร็จ → label ภาษากลายเป็น **✓ (complete)**
   - เปิดหน้า `/ja/articles/[slug]` บนหน้าสาธารณะ → เห็น content ที่แปลเต็มทันที (ไม่มี spinner/JIT)
3. ตรวจ `translations.translation_status` ใน Supabase:
   - ทุกภาษาควรเป็น `complete`
   - ทุกภาษาควรมี `content` ครบ

---

## ⚠️ ข้อควรทราบ

- **บทความเก่าที่เคยเป็น Tier 2 (summary_only)** ที่ยังไม่มี content ใน `translations` จะยังคงเก่าอยู่ — ต้องกดปุ่ม "แปลอัตโนมัติ" ใหม่อีกครั้งเพื่อแปล content ให้เต็ม
- **sitemap** เป็น `force-dynamic` + อ่านจาก Supabase ตรง ๆ → rerun อัตโนมัติเมื่อถูก crawl ไม่ต้องกด save
  - หลังทุกภาษาแปลเป็น `complete` → หน้า variant ภาษานั้น**เข้าสู่ sitemap อัตโนมัติ** (เดิม summary_only ถูกกันออกเพราะไม่ใช่ complete)

---

## 🔗 ไฟล์อ้างอิงเดิม

- `docs/13-edit-article-locale-aware.md` — ยังมีเนื้อหาเก่า (auto-translate EN + Tier2 JIT) ควรอ่านโดยเทียบกับเอกสารนี้
- `docs/translation-architecture.md` — สถาปัตยกรรมการแปล
