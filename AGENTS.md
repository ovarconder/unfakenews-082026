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

จากที่ทดสอบจริงใน workspace นี้:

- Agent ส่งคำสั่งไปยัง terminal ได้ แต่ tool `run_terminal_command` **ไม่คืน stdout กลับมา**
  (จะได้แค่สถานะ "executed")
- **แต่ remote terminal กับ workspace เป็น filesystem เดียวกัน**
  → ถ้าคำสั่งเขียน output ลงไฟล์ที่อยู่ใน workspace agent จะอ่านไฟล์นั้นเองได้ด้วย tool `read_file`
- จึง **ไม่จำเป็นต้องให้มนุษย์คัดลอกผลให้อีกต่อไป** (ทำเฉพาะเมื่อ agent อ่านไฟล์ไม่ได้จริงๆ)

### วิธีทำงานที่ถูกต้อง (แนะนำ — agent อ่านเองได้)

1. **เขียน output ลงไฟล์ใน workspace** ที่ถูก gitignore ไว้ เช่นโฟลเดอร์ `agent-reports/`
   ```bash
   cd /path/to/project && mkdir -p agent-reports && some-command > agent-reports/out.txt 2>&1; echo "exit=$?" >> agent-reports/out.txt
   ```
2. **ตามด้วย tool `read_file`** อ่านไฟล์ `agent-reports/out.txt` เพื่อดูผลลัพธ์
   - ต้องอ่านเองหลังส่งคำสั่ง — ระบบนี้ **ไม่ส่ง event แจ้งเตือน** ว่า terminal รันเสร็จ
   - ถ้าอ่านแล้วยังไม่ทันเขียนเสร็จ ให้อ่านซ้ำอีกครั้ง
3. **รวมหลายคำสั่งไว้ในคำสั่งเดียว** เพื่อลดจำนวนรอบ
   - ใช้ `&&`, `;`, `{}` รวมงานเข้าด้วยกัน

> `agent-reports/` และ `*.report.txt` อยู่ใน `.gitignore` แล้ว — ใช้เป็นที่พัก output ได้ โดยไม่ปนกับ commit

### ทางเลือกสำรอง (ถ้า agent อ่านไฟล์ไม่ได้ / คนละ filesystem)

- ใช้ `tee` พร้อม marker แล้วให้มนุษย์คัดลอกผลมาให้
  ```bash
  cd /path/to/project && some-command 2>&1 | tee /tmp/out.txt; printf '\n===DONE===\n'
  ```

### ข้อควรปฏิบัติอื่นๆ

- **หลีกเลี่ยงคำสั่งแบบ interactive** (เช่น `git rebase -i`, `nano`, `vim`, pager)
  - ใช้ flag ที่ไม่ต้อง interact เช่น `git --no-pager`, `git commit -m "..."`
- ใช้เครื่องมืออื่นที่อ่านไฟล์ได้ทันที (Read / Glob / Grep) แทนเมื่อเป็นไปได้
- **อย่าเดาผลลัพธ์** — ถ้าอ่านไฟล์แล้วไม่ได้ผลจริง ให้ขอให้มนุษย์ช่วยตรวจ/คัดลอกมาให้

### ตัวอย่างที่ถูกต้อง

```bash
cd /workspaces/unfakenews-082026 && mkdir -p agent-reports && { git status -s; echo "---"; git log --oneline -3; } > agent-reports/out.txt 2>&1; echo "exit=$?" >> agent-reports/out.txt
```
แล้ว agent ตามด้วย `read_file("agent-reports/out.txt")`

### ตัวอย่างที่ผิด (agent จะอ่านค่าไม่ได้)

```bash
git status        # ← ไม่ redirect ลงไฟล์ใน workspace, อ่านไม่ได้
```

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
- [ ] รันคำสั่ง terminal โดย **redirect output ลง `agent-reports/` ใน workspace** แล้ว agent อ่านเองด้วย `read_file` (ไม่ต้องรอมนุษย์คัดลอก)
- [ ] ไม่เดาผลลัพธ์ terminal — ถ้าอ่านไฟล์แล้วไม่ได้ผลจริง ให้อ่านซ้ำ หรือขอให้มนุษย์ช่วยตรวจ
- [ ] ก่อนแก้ schema/DB — ปรึกษาเจ้าของโปรเจกต์และตรวจ type จริงก่อน
- [ ] migration ใหม่ — ตั้งชื่อเรียงลำดับ + ใช้ `IF NOT EXISTS`
