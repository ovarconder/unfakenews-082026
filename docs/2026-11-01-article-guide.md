# คู่มือสร้างบทความ + Clone ไปเว็บเครือข่าย

> อัปเดตล่าสุด: 2026-11-01 — เขียนใหม่เป็นคู่มือทีละขั้น (เดิมชื่อ `content-workflow`), เพิ่ม Import หลายไฟล์ และ `/clone-article` แบบโฟลเดอร์

```
 ① เขียนหัวข้อ        ② Claude ร่าง          ③ Import + ตรวจ       ④ Export          ⑤ Claude clone        ⑥ Import + ตรวจ
 (ไฟล์ .md)    ──►  /draft-article  ──►  unfakenews.asia  ──►  (ไฟล์ .json) ──►  /clone-article  ──►  เว็บ 2–5
                                          → Publish                                                    → Publish
```

- Claude **ไม่ publish เอง** ทุกบทความเข้าเว็บเป็น draft ต้องมีคนตรวจแล้วกด publish
- Claude ใช้เฉพาะข้อมูลและลิงก์ที่เราให้ไป ไม่แต่งแหล่งอ้างอิงเพิ่ม

---

## ส่วนที่ 0 — เตรียมครั้งแรก (ทำครั้งเดียว)

1. สร้างโฟลเดอร์เก็บงาน **นอก repo**

   ```bash
   mkdir -p ~/Project-UnFakeNews/content
   ```

2. ทำความเข้าใจ 2 โลก: **Terminal** กับ **Claude Code**

   | | Terminal (zsh) | Claude Code |
   |---|---|---|
   | หน้าตา | `macpro@... %` | ช่องแชท `>` |
   | ใช้ทำอะไร | `cd`, `ls`, เปิด Claude | พิมพ์ `/draft-article`, `/clone-article`, คุยสั่งแก้ |
   | เข้า/ออก | — | เข้า: พิมพ์ `claude` · ออก: `/exit` |

   > `/draft-article` พิมพ์ใน Terminal ตรงๆ **ไม่ได้** ต้องเข้า Claude Code ก่อน
   > อยู่ใน Claude Code แล้วอยากรันคำสั่ง Terminal ให้พิมพ์ `!` นำหน้า เช่น `! ls ~/Downloads`

---

## ส่วนที่ 1 — สร้างบทความใหม่ (unfakenews.asia)

### ขั้นที่ 1: เขียนไฟล์หัวข้อ

สร้างไฟล์ตามวันที่ เช่น `~/Project-UnFakeNews/content/2026-11-02-topics.md` ใส่ได้หลายหัวข้อในไฟล์เดียว:

```markdown
## หัวข้อ: เขมรอ้างว่าไทยยิงก่อนที่ช่องบก
- ข้อกล่าวอ้าง: เพจ XXX โพสต์ว่า ... เมื่อ 1 พ.ย. 2026 https://facebook.com/...
- ข้อเท็จจริง: กองทัพภาคที่ 2 แถลงว่า ...
- หลักฐาน/แหล่งอ้างอิง:
  - https://...
  - https://...
- คำตัดสิน: เท็จ
- หมวดหมู่: fact-check
- รูป: https://... (ถ้ามี)

## หัวข้อ: ภาพทหารไทยรุกล้ำเป็นภาพเก่าปี 2011
- ข้อกล่าวอ้าง: ...
- ข้อเท็จจริง: ...
- หลักฐาน/แหล่งอ้างอิง: ...
- คำตัดสิน: บิดเบือน
```

| ช่อง | จำเป็นไหม | หมายเหตุ |
|---|---|---|
| ข้อกล่าวอ้าง | ✅ | ใคร พูดอะไร ที่ไหน เมื่อไร + ลิงก์โพสต์ต้นทาง |
| ข้อเท็จจริง | ✅ | เขียนสั้นๆ เป็นข้อๆ ได้ |
| หลักฐาน/แหล่งอ้างอิง | ✅ | ยิ่งมากยิ่งดี บทความจะมีแค่ลิงก์ที่ให้ไป |
| คำตัดสิน | แนะนำ | เท็จ / บิดเบือน / ขาดบริบท / จริงบางส่วน / จริง — ไม่ใส่ Claude จะเสนอให้ |
| หมวดหมู่ | แนะนำ | slug หมวดในเว็บ (ดูที่ Admin → หมวดหมู่) |
| รูป | ไม่จำเป็น | URL รูป |

### ขั้นที่ 2: ให้ Claude ร่าง

```bash
cd ~/Project-UnFakeNews/unfakenews-082026     # ← ต้องอยู่โฟลเดอร์ repo
claude
```

ในช่องแชท Claude:

```
/draft-article ~/Project-UnFakeNews/content/2026-11-02-topics.md
```

ใส่หมายเหตุต่อท้ายได้ เช่น

```
/draft-article ~/Project-UnFakeNews/content/2026-11-02-topics.md unfakenews.asia เขียนให้กระชับ ไม่เกิน 800 คำ
/draft-article ~/Project-UnFakeNews/content/2026-11-02-topics.md unfakenews.asia ค้นข้อมูลเพิ่มได้
```

ระหว่างทาง Claude อาจถามขออนุญาตเขียนไฟล์หรือเปิดลิงก์ ให้กดอนุญาต เสร็จแล้วจะได้:
- ไฟล์ที่ `~/Project-UnFakeNews/content/out/unfakenews.asia/<slug>.json` หัวข้อละ 1 ไฟล์
- สรุปภาษาไทยว่าแต่ละบทความต้องตรวจอะไร และหัวข้อไหนถูกข้ามเพราะข้อมูลไม่พอ

อยากแก้ก็พิมพ์คุยต่อได้เลย เช่น "หัวข้อเรื่องที่ 2 ยาวไป ทำให้สั้นลง" หรือ "เพิ่มลิงก์นี้ในเรื่องที่ 1: https://..."

### ขั้นที่ 3: Import เข้าเว็บ

1. เปิด `https://unfakenews.asia/admin` → **บทความ → เขียนบทความใหม่**
2. กดปุ่ม **Import JSON** (มุมขวาบน)
3. เข้าโฟลเดอร์ `content/out/unfakenews.asia/` → กด **⌘A** เลือกทุกไฟล์ → Open
   - ถ้ามีบทความ slug เดียวกันในเว็บอยู่แล้ว จะมีกล่องเตือนก่อน (import จะทับของเดิมและเปลี่ยนเป็น draft)
4. รอจนขึ้นสรุป "Import สำเร็จ x/y ไฟล์" แต่ละบรรทัดกดเข้าไปหน้า edit ของบทความนั้นได้
   - ถ้าเลือก 1 ไฟล์ ระบบจะเปิดหน้า edit ให้ทันที

### ขั้นที่ 4: ตรวจแล้ว Publish (ห้ามข้าม)

ในหน้า edit ของแต่ละบทความ:
- [ ] หัวข้อและคำตัดสินถูกต้อง
- [ ] ตัวเลข วันที่ ชื่อคน คำพูด ตรงกับแหล่งอ้างอิง
- [ ] กดลิงก์แหล่งอ้างอิงทุกตัว ต้องเปิดได้และเป็นเรื่องเดียวกันจริง
- [ ] หมวดหมู่ (ถ้าไม่ได้ระบุ ระบบจะใส่หมวดแรกที่เจอให้)
- [ ] รูปและ alt text
- [ ] เปลี่ยนสถานะเป็น **published** → บันทึก
- [ ] (ถ้าต้องการ) กด "แปลอัตโนมัติ" ภาษาอื่น

---

## ส่วนที่ 2 — Clone ไปเว็บเครือข่าย (unmask / factbase / contextasia / debunk)

### ขั้นที่ 5: Export จากเว็บหลัก

1. หน้า edit ของบทความที่ publish แล้ว → ปุ่ม **Export JSON** → ได้ไฟล์ `article-<slug>.json` ใน Downloads
2. ถ้าหลายบทความ ให้ย้ายไฟล์ของวันนั้นไว้โฟลเดอร์เดียวกัน เช่น

   ```bash
   mkdir -p ~/Project-UnFakeNews/content/2026-11-02-export
   mv ~/Downloads/article-*.json ~/Project-UnFakeNews/content/2026-11-02-export/
   ```

### ขั้นที่ 6: ให้ Claude เรียบเรียงใหม่

ในช่องแชท Claude (เปิดจากโฟลเดอร์ repo เหมือนขั้นที่ 2):

```
/clone-article ~/Project-UnFakeNews/content/2026-11-02-export all
```

| แบบ | ตัวอย่าง |
|---|---|
| ทั้งโฟลเดอร์ ครบ 4 เว็บ | `/clone-article ~/Project-UnFakeNews/content/2026-11-02-export all` |
| ไฟล์เดียว เว็บเดียว | `/clone-article ~/Downloads/article-xxx.json unmask.asia` |
| ใส่หมายเหตุ | `/clone-article ~/Downloads/article-xxx.json debunk.asia เน้นเรื่องภาพตัดต่อ` |

แต่ละเว็บได้บทความภาษาอังกฤษที่มุมเล่าต่างกัน (ข้อเท็จจริงเหมือนเดิม):

| เว็บ | มุมเล่า |
|---|---|
| unmask.asia | เปิดโปงกลไกการบิดเบือน (ใครปล่อย ใช้เทคนิคอะไร) |
| factbase.asia | ข้อมูล หลักฐาน ไทม์ไลน์ |
| contextasia.org | บริบททางประวัติศาสตร์ ภูมิศาสตร์ กฎหมาย ที่หายไป |
| debunk.asia | สั้น ตัดสินทีละประเด็น |

ผลลัพธ์อยู่ที่ `<โฟลเดอร์ export>/out/<เว็บ>/` แยกโฟลเดอร์ละเว็บ (ถ้าเกิน 10 บทความ Claude จะถามยืนยันก่อนเริ่ม)

### ขั้นที่ 7: Import + ตรวจ ที่แต่ละเว็บ

ทำซ้ำทีละเว็บ:
1. `https://unmask.asia/admin` → บทความ → เขียนบทความใหม่ → **Import JSON**
2. เลือกทุกไฟล์ใน `out/unmask.asia/` → Open
3. ตรวจตาม checklist ขั้นที่ 4 → publish

---

## ตัวอย่างวันทำงานจริง (5 หัวข้อ)

| ทำอะไร | ที่ไหน | ครั้ง |
|---|---|---|
| เขียน `2026-11-02-topics.md` 5 หัวข้อ | editor ที่ถนัด | 1 |
| `/draft-article ...topics.md` | Claude Code | 1 |
| Import ทั้งโฟลเดอร์ → ตรวจ → publish | unfakenews.asia/admin | import 1 ครั้ง, ตรวจ 5 เรื่อง |
| Export 5 เรื่อง → ย้ายเข้าโฟลเดอร์ | หลังบ้าน + Terminal | 5 คลิก |
| `/clone-article <โฟลเดอร์> all` → ได้ 20 ไฟล์ | Claude Code | 1 |
| Import ทั้งโฟลเดอร์ → ตรวจ → publish | เว็บ 2–5 | import 4 ครั้ง, ตรวจ 20 เรื่อง |

---

## แก้ปัญหา

| อาการ | วิธีแก้ |
|---|---|
| พิมพ์ `/draft-article` แล้วขึ้น `command not found` | พิมพ์ใน Terminal อยู่ → พิมพ์ `claude` เข้า Claude Code ก่อน |
| พิมพ์ `/` แล้วไม่เห็น `/draft-article` | ไม่ได้เปิด Claude จากโฟลเดอร์ repo → `/exit` แล้ว `cd ~/Project-UnFakeNews/unfakenews-082026` แล้ว `claude` ใหม่ |
| Import ขึ้น `column source_locale does not exist` | เว็บนั้นยังไม่ได้รัน `migrations/029_article_source_locale.sql` |
| Import ขึ้นว่า slug ซ้ำกับไฟล์อื่น | มี 2 ไฟล์ slug เดียวกัน → ให้ Claude เปลี่ยน slug ไฟล์หนึ่ง |
| หมวดหมู่ผิดหลัง import | slug หมวดในไฟล์ไม่ตรงกับเว็บ → แก้หมวดในหน้า edit |
| บทความที่ publish อยู่หายจากเว็บหลัง import | import ทับ slug เดิม → บทความกลับเป็น draft → publish ใหม่ |
| รูปไม่ขึ้นในเว็บเครือข่าย | รูปยังชี้ไป Storage ของเว็บหลัก ถ้าลบรูปที่เว็บหลักจะหายด้วย → อัปโหลดรูปใหม่ในเว็บนั้น |

---

## ข้อควรรู้

- **SEO:** อย่า import ไฟล์ export จากเว็บหลักเข้าเว็บ 2–5 ตรงๆ ให้ผ่าน `/clone-article` ก่อนเสมอ ไม่งั้น 5 เว็บจะมีเนื้อหาเหมือนกันทุกคำ และ Google อาจลดอันดับทั้งเครือข่าย
- **ปรับมุมเล่าหรือกติกา:** แก้ที่ `.claude/commands/clone-article.md` หรือ `.claude/commands/draft-article.md` แล้ว commit มีผลกับทุกคนที่ใช้ repo
- **ไฟล์ JSON:** รูปแบบตาม `ArticleTransferPayload` ใน `app/api/admin/articles/[slug]/transfer/route.ts` (ฟิลด์สำคัญ: `article.slug`, `article.source_locale`, `article.original_*`, `translations`) — ไฟล์เก่าที่ไม่มี `source_locale` จะถือเป็นภาษาไทย
- **ยังไม่ได้ทำ:** ปุ่ม Export หลายบทความพร้อมกัน, ตั้งเวลาให้ร่างอัตโนมัติ
