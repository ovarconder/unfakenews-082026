# AGENTS.md — ข้อกำหนดการทำงานของ AI Agent

เอกสารนี้เป็นข้อกำหนดหลักสำหรับ AI Agent (เช่น GitHub Copilot / Cursor / Claude)
ที่ทำงานในโปรเจกต์นี้ **ต้องปฏิบัติตามทุก session** โดยเฉพาะหัวข้อสำคัญด้านล่าง

---

## 🗣️ กฎข้อที่ 1: โต้ตอบเป็นภาษาไทยเท่านั้น

- **ตอบเป็นภาษาไทยเสมอ** ในการสนทนากับเจ้าของโปรเจกต์
- คำอธิบาย, สรุปงาน, คำถาม, ข้อเสนอแนะ — เขียนเป็นภาษาไทย
- โค้ด, ชื่อตัวแปร, comment ในโค้ด — คงรูปแบบเดิมตามมาตรฐาน (มักเป็นภาษาอังกฤษหรือตามที่มีอยู่แล้วในไฟล์)
- ข้อความ commit message / PR — เขียนเป็นภาษาไทยได้ตามความเหมาะสม

> เหตุผล: เจ้าของโปรเจกต์ต้องคอยบอกให้ agent พูดไทยทุกครั้งที่เริ่ม session ใหม่
> จึงบันทึกไว้ในนี้เพื่อให้ agent ทำโดยอัตโนมัติ ไม่ต้องสั่งซ้ำ

---

## ⌨️ กฎข้อที่ 2: การรันคำสั่งใน Terminal (สำคัญมาก)

### บริบทของ environment นี้

ใน workspace นี้ การรันคำสั่ง terminal มีข้อจำกัด:

- Agent ส่งคำสั่งไปยัง terminal ได้ แต่ **ไม่สามารถรับ output กลับมาโดยตรงได้**
- เมื่อรันคำสั่ง terminal ระบบจะ **รอให้มนุษย์กด Enter** ก่อนจึงจะดำเนินการต่อ
- Agent **อ่านผลลัพธ์จากการรันโดยตรงไม่ได้** — ต้องอาศัยมนุษย์คัดลอกผลลัพธ์มาบอก

### วิธีทำงานที่ถูกต้อง

Agent **ต้อง**ปฏิบัติตามแนวทางนี้เมื่อต้องรันคำสั่ง terminal:

1. **เขียน output ลงไฟล์ใน `/tmp` ก่อนเสมอ** แล้วให้มนุษย์คัดลอกเนื้อหามาให้
   ```bash
   cd /path/to/project && some-command > /tmp/result.txt 2>&1; cat /tmp/result.txt
   ```
2. **ใช้ `tee` พร้อม marker** เพื่อให้อ่านง่าย และมีจุดสิ้นสุดชัดเจน
   ```bash
   cd /path/to/project && some-command 2>&1 | tee /tmp/out.txt; printf '\n===DONE===\n'
   ```
3. **รวมหลายคำสั่งไว้ในคำสั่งเดียว** เพื่อลดจำนวนรอบการกด Enter
   - ใช้ `&&`, `;`, `{}` รวมงานเข้าด้วยกัน
4. **อย่าเดาผลลัพธ์** — ถ้ายังไม่ได้รับ output ให้**ขอให้มนุษย์คัดลอกมาให้**
5. **หลีกเลี่ยงคำสั่งแบบ interactive** (เช่น `git rebase -i`, `nano`, `vim`, pager)
   - ใช้ flag ที่ไม่ต้อง interact เช่น `git --no-pager`, `git commit -m "..."`

### ตัวอย่างที่ถูกต้อง

```bash
cd /workspaces/unfakenews-082026 && { git status -s; echo "---"; git log --oneline -3; } 2>&1 | tee /tmp/s.txt; printf '\n===DONE===\n'
```

### ตัวอย่างที่ผิด (agent จะอ่านค่าไม่ได้)

```bash
git status        # ← ไม่ redirect ลงไฟล์, ไม่มี marker, อ่านไม่ได้
```

### หมายเหตุสำหรับ Agent

- หลังส่งคำสั่ง terminal ให้ **หยุดรอ** แล้วถาม/บอกมนุษย์ว่า "ช่วยคัดลอกผลจาก terminal มาให้ด้วยครับ"
- **ห้ามเรียกเครื่องมือ terminal ซ้ำรวดเดียวหลายครั้ง** เพื่อหวังอ่านค่าตัวเอง — จะไม่ได้ผล
- ใช้เครื่องมืออื่นที่อ่านไฟล์ได้ (Read / Glob / Grep) แทนเมื่อเป็นไปได้
  เพราะอ่านไฟล์ได้ทันทีโดยไม่ต้องพึ่ง terminal

---

## 📦 กฎข้อที่ 3: Git และ Migrations

### ไฟล์ SQL ใน `migrations/`

- `.gitignore` มี pattern `*.sql` (ไม่ commit SQL ทั่วไป)
- **ยกเว้น** `migrations/*.sql` ที่ต้อง version ควบคุมกับโค้ด
  (มี `!migrations/` และ `!migrations/*.sql` อยู่ใน `.gitignore` แล้ว)
- migration ใหม่ต้องตั้งชื่อเรียงลำดับ เช่น `022_xxx.sql`

### รูปแบบ migration ที่ปลอดภัย

- ใช้ `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent) แทนการแก้ `CREATE TABLE` เดิม
- ห้าม `DROP TABLE` โดยไม่ปรึกษาเจ้าของโปรเจกต์ก่อน
- ระวัง: `CREATE TABLE IF NOT EXISTS` จะ **ข้าม** การแก้ schema ถ้าตารางมีอยู่แล้ว

### ข้อควรระวังเรื่อง schema

- โปรเจกต์นี้ถูก **แชร์โค้ดกับหลายเว็บ** ที่ใช้ **คนละ database**
- **ห้ามสมมติชนิดข้อมูล (type) ของคอลัมน์** จากโค้ดเพียงอย่างเดียว
  (เช่น `site_settings.id` เป็น `UUID` ตาม schema จริง ไม่ใช่ `TEXT 'default'`)
- โค้ดต้อง **ไม่ hardcode** ค่าที่ขึ้นกับ schema เช่น id ของแถว — ให้อ่านจาก DB จริง

---

## 🚫 กฎข้อที่ 4: Microsite — เลิกใช้งานแล้ว (Ignore)

- ฟีเจอร์ **Microsite เลิกใช้งานแล้ว** เจ้าของโปรเจกต์ไม่ใช้
- **ห้ามแก้ / rebrand / refactor** ไฟล์ต่อไปนี้เว้นแต่เจ้าของสั่งชัด:
  - `components/microsite/*`
  - `app/microsite/*`
  - `app/admin/microsites/*`
- **ไม่มีไฟล์ไหน import `components/microsite/*`** (ตรวจแล้ว) → แยกตัวได้
- ⚠️ `app/api/*` ที่มีคำว่า "microsite" (เช่น `api/v1/claims/latest`, `api/article-locales`,
  `api/admin/microsites`) **คนละเรื่อง** — ห้ามลบ/patch ตามคำว่า microsite
- งาน rebrand สี (**เปลี่ยน hardcode `amber-*` / hex → `brand-*`**) ให้เน้น **หน้าคนอ่าน (public)** เท่านั้น:
  - `components/articles/*`, `components/home/*`, `components/contact/*`,
    `components/support/*`, `components/analytics/*`, `app/[lang]/*`, `app/not-found.tsx`, `app/error.tsx`
  - **admin (`app/admin/*`, `components/admin/*`) ไม่สำคัญ** — สีอะไรก็ได้ ไม่ต้อง rebrand

---

## 🧭 สรุป Checklist สำหรับ Agent ทุกครั้ง

- [ ] ตอบเป็น**ภาษาไทย**
- [ ] รันคำสั่ง terminal โดย **redirect output ลง `/tmp` + marker** เสมอ แล้วรอให้มนุษย์คัดลอกผลมา
- [ ] ไม่เดาผลลัพธ์ terminal — ถ้าไม่ได้ output ให้ขอ
- [ ] ก่อนแก้ schema/DB — ปรึกษาเจ้าของโปรเจกต์และตรวจ type จริงก่อน
- [ ] migration ใหม่ — ตั้งชื่อเรียงลำดับ + ใช้ `IF NOT EXISTS`
