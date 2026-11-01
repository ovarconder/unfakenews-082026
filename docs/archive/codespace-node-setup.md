# Node.js / npm Setup ใน Codespace (Mac + VSCode + "continue")

> **เป้าหมาย:** รัน `node`, `npm`, `npx` ได้ใน VSCode / Codespace environment (continue environment)
> บน Mac โดยเฉพาะ PATH ไม่ชี้มาที่ node directory
>
> **สถานะปัจจุบัน:** ✅ ตั้ง PATH แบบถาวรใน `~/.zshrc` เรียบร้อยแล้ว — เปิด terminal ใหม่ใช้งานได้ทันที

---

## 1. ปัญหาเดิม (ก่อนตั้งถาวร)

ใน Codespace / VSCode บน Mac บางครั้ง `node`, `npm`, `npx` **ไม่ถูกค้นเจอจาก PATH โดยตรง** เพราะ terminal ยังไม่ได้โหลด PATH ของ Node ที่ติดตั้งผ่าน `n` (Node Version Manager)

ผลลัพธ์: รัน `node --version` / `npm run dev` ได้ error `command not found`

---

## 2. สถานะปัจจุบัน — ตั้ง PATH แบบถาวรแล้ว ✅

เพิ่มบรรทัดต่อไปนี้ไว้**ท้ายสุด** ของ `~/.zshrc` ให้ PATH ถูกตั้งอัตโนมัติทุกครั้งที่เปิด terminal:

```bash
export N_PREFIX=/usr/local/n
export PATH=/usr/local/n/versions/node/22.14.0/bin:$PATH
```

เหตุผลที่ต่อไว้**ท้ายสุด**: nvm/conda จะรันก่อน แล้ว PATH ของเราถูกตั้งเป็นคำสั่งสุดท้าย
ทำให้ `/usr/local/n/versions/node/22.14.0/bin` มี priority สูงสุด

> ⚠️ ถ้า **Terminal เปิดค้างอยู่** ตั้งแต่ก่อนแก้ `~/.zshrc` ยังไม่เห็น PATH ใหม่
> ต้องเปิด terminal ใหม่ หรือรัน `source ~/.zshrc` ก่อน

---

## 3. ตรวจสอบว่า setup สำเร็จหรือยัง

หลังเปิด terminal ใหม่ ให้เช็ค:

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

- [ ] เปิด terminal ใหม่ → ตรวจ `node --version` ขึ้น v22.14.0
- [ ] ถ้า terminal เก่ายังใช้ไม่ได้ → รัน `source ~/.zshrc` ก่อน
- [ ] ถึงจะใช้ `npm run dev` / `npx tsc --noEmit` / `npm run build`
- [ ] ถ้า node version อัปเกรดใหม่ ให้แก้เลขเวอร์ชันใน `~/.zshrc` ให้ตรงด้วย

---

## 6. Quick Copy-Paste (ยืนยัน PATH ทันที)

ถ้าต้องการตรวจ/ตั้ง PATH แบบชั่วคราวใน terminal ปัจจุบัน ใช้:

```bash
export N_PREFIX=/usr/local/n && export PATH=/usr/local/n/versions/node/22.14.0/bin:$PATH && node --version
```

ควรเห็นผลลัพธ์ `v22.14.0`

---

### หมายเหตุ
- shell เริ่มต้นของ Mac คือ `/bin/zsh` — คำสั่ง `export` ข้างต้นเขียนมาเฉพาะ zsh/bash
- ถ้า node version เปลี่ยน (เช่น อัปเกรดเป็น v23) ให้แก้เลขเวอร์ชันใน PATH (`~/.zshrc`) และตรวจสอบว่ามี directory นั้นอยู่จริง `ls /usr/local/n/versions/node/`
