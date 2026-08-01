# Node.js / npm Setup ใน Codespace (Mac + VSCode + "continue")

> **เป้าหมาย:** รัน `node`, `npm`, `npx` ได้ใน VSCode / Codespace environment (continue environment)
> บน Mac โดยเฉพาะ PATH ไม่ชี้มาที่ node directory
>
> **ต้องอ่านบทความนี้ทุกครั้ง** ก่อนรันอะไรที่เกี่ยวกับ npm / dev server / build

---

## 1. ปัญหา

ใน Codespace / VSCode บน Mac บางครั้ง `node`, `npm`, `npx` **ไม่ถูกค้นเจอจาก PATH โดยตรง** เพราะ terminal ยังไม่ได้โหลด PATH ของ Node ที่ติดตั้งผ่าน `n` (Node Version Manager)

ผลลัพธ์: รัน `node --version` / `npm run dev` ได้ error `command not found`

---

## 2. ทางแก้: ตั้ง PATH ก่อนใช้งานเสมอ

รันคำสั่ง 2 บรรทัดนี้ **ก่อน** จะใช้งาน node/npm ทุกครั้ง ใน terminal ที่เปิดใหม่:

```bash
export N_PREFIX=/usr/local/n
export PATH=/usr/local/n/versions/node/22.14.0/bin:$PATH
```

> ⚠️ ต้องทำทุกครั้งที่เปิด terminal ใหม่ (PATH ไม่จำข้าม session)
> เวอร์ชัน `22.14.0` ขึ้นอยู่กับ node version ที่ติดตั้งไว้บนเครื่อง — ตรวจสอบด้วยข้อ 3.

---

## 3. ตรวจสอบว่า setup สำเร็จหรือยัง

หลังตั้ง PATH แล้ว ให้เช็คเวอร์ชัน:

```bash
node --version   # ต้องขึ้น v22.14.0
npm --version    # ต้องขึ้น 10.9.2
```

ถ้าเห็นเวอร์ชันตามนี้ แปลว่าพร้อมใช้แล้ว

---

## 4. คำสั่งที่ใช้บ่อย

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน dev server (localhost:3000) |
| `npx tsc --noEmit` | type check (ตรวจ error ของ TypeScript) |
| `npm run build` | build production |

---

## 5. สรุปข้อควรจำ (Checklist)

- [ ] เปิด terminal ใหม่ → รัน `export N_PREFIX=/usr/local/n` + `export PATH=...` 🟡 (ทำเสมอ)
- [ ] ตรวจ `node --version` ขึ้น v22.14.0
- [ ] ถึงจะรัน `npm run dev` / `npx tsc --noEmit` / `npm run build`

---

## 6. Quick Copy-Paste (รันครั้งเดียว)

ถ้าต้องการคำสั่งทั้งชุดครบในบรรทัดเดียว ใช้:

```bash
export N_PREFIX=/usr/local/n && export PATH=/usr/local/n/versions/node/22.14.0/bin:$PATH && node --version
```

ควรเห็นผลลัพธ์ `v22.14.0`

---

### หมายเหตุ
- shell เริ่มต้นของ Mac คือ `/bin/zsh` — คำสั่ง `export` ข้างต้นเขียนมาเฉพาะ zsh/bash
- ถ้า node version เปลี่ยน (เช่น อัปเกรดเป็น v23) ให้แก้เลขเวอร์ชันใน PATH ให้ตรงกับจริงด้วย
