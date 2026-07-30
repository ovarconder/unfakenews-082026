# 🖼️ คู่มือระบบอัปโหลดรูปภาพ

> **เกี่ยวกับ:** การอัปโหลดรูปภาพในระบบ (Cover Image, รูปในเนื้อหาบทความ, Logo, Favicon, OG Image)
> **Stack:** Supabase Storage (bucket: `article-images`) + Next.js API Route
> **จำกัดขนาด:** 1MB (client-side + server-side)

---

## 📐 ขนาดรูปภาพที่แนะนำ

| ประเภท | ขนาดสูงสุด | รูปแบบแนะนำ | ขนาดพิกเซลแนะนำ |
|--------|-----------|-------------|-----------------|
| ภาพปกบทความ | 1MB | WebP หรือ JPEG 80% | 1200×630px |
| รูปในเนื้อหา | 1MB | WebP หรือ JPEG 80% | 800-1200px กว้าง |
| Logo | 500KB | PNG (โปร่งใส) หรือ SVG | 128×128px |
| Favicon | 100KB | PNG หรือ ICO | 64×64px |
| OG Image | 500KB | JPEG หรือ PNG | 1200×630px |

> 💡 **เคล็ดลับ:** ใช้ WebP format — คุณภาพเท่า JPEG แต่ขนาดเล็กกว่า 25-35%

---

## 🔄 Flow การอัปโหลด

```
User ลาก/เลือกรูป
    │
    ▼
Client-side validation (1MB limit + ตรวจประเภทไฟล์)
    │
    ├── ❌ ไฟล์ > 1MB → แจ้งเตือนทันที (ไม่ส่ง request)
    ├── ❌ ไฟล์ > 500KB → console.warn (แต่ยังอัปโหลดได้)
    └── ✅ ผ่าน validation
            │
            ▼
    POST /api/upload (multipart/form-data)
            │
            ├── ❌ formData() ล้ม → 413 "ไฟล์ใหญ่เกินไป"
            ├── ❌ ชนิดไฟล์ไม่ถูกต้อง → 400
            ├── ❌ ไฟล์ > 1MB (server check) → 400
            ├── ❌ Supabase upload error → 500
            └── ✅ อัปโหลดสำเร็จ → return { url, filename }
                    │
                    ▼
            setImageUrl(data.url) → แสดง preview
```

---

## 📁 ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | บทบาท |
|------|--------|
| `app/api/upload/route.ts` | API endpoint — รับไฟล์, อัปโหลดไป Supabase Storage |
| `components/ui/image-uploader.tsx` | Component Drag & Drop + Preview + URL fallback |
| `components/admin/article-editor.tsx` | ฟังก์ชัน `uploadImage()` สำหรับอัปโหลดรูปในเนื้อหา |

---

## ⚙️ ไฟล์ละเอียด

### 1. `app/api/upload/route.ts`

API endpoint สำหรับรับไฟล์รูปภาพและอัปโหลดไปยัง Supabase Storage

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
```

**ฟังก์ชัน:** `POST /api/upload`

**ค่าคงที่:**
- `ALLOWED_TYPES` — `image/jpeg, image/png, image/gif, image/webp, image/svg+xml`
- `MAX_FILE_SIZE` — `1 * 1024 * 1024` (1MB)
- `BUCKET_NAME` — `"article-images"`

**Request:** `multipart/form-data` พร้อม field `file`

**Response สำเร็จ:**
```json
{
  "success": true,
  "url": "https://xxx.supabase.co/storage/v1/object/public/article-images/...",
  "filename": "1717000000-a1b2c3.jpg",
  "size": 123456
}
```

**Error Responses:**
| HTTP Status | กรณี |
|-------------|------|
| 400 | ไม่มีไฟล์ / ชนิดไฟล์ไม่รองรับ / ไฟล์ใหญ่เกิน 1MB |
| 413 | formData() ล้มเหลว (body ใหญ่ผิดปกติ) |
| 500 | Supabase upload error / Internal error |

> 🔒 **Security:** ใช้ `createAdminClient()` (bypass RLS) → เฉพาะผู้ใช้ที่ login แล้วเท่านั้นที่เรียก API นี้ได้

---

### 2. `components/ui/image-uploader.tsx`

Component สำหรับอัปโหลดรูปภาพแบบ Drag & Drop + Preview + URL fallback

**Props:**
```typescript
interface ImageUploaderProps {
  value: string;              // current image URL
  onChange: (url: string) => void;
  label?: string;
  accept?: string;            // default: image/jpeg,image/png,image/gif,image/webp,image/svg+xml
  maxSizeMB?: number;
  bucket?: string;
  className?: string;
  previewWidth?: number;
  previewHeight?: number;
  showUrlInput?: boolean;     // default: true
}
```

**Validation ฝั่ง Client (ก่อนส่ง API):**
1. ✅ ตรวจขนาดไฟล์ — **ห้ามเกิน 1MB** (แสดง error ทันที)
2. ✅ ตรวจประเภทไฟล์ — ตรงกับ `accept` prop
3. ⚠️ เตือน console ถ้าไฟล์ > 500KB
4. 🛡️ Safe JSON parsing — ถ้า response จาก server ไม่ใช่ JSON (เช่น Internal Server Error) จะแสดงข้อความที่เข้าใจง่าย

**Error Handling:**
- กรณี response ไม่ใช่ JSON (เช่น `"Internal E"...`) → แสดง "เซิร์ฟเวอร์ตอบกลับผิดพลาด (HTTP XXX) — กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ"
- กรณี error อื่น → แสดง `error` message ที่ server ส่งมา

---

### 3. `components/admin/article-editor.tsx` — `uploadImage()`

ฟังก์ชันสำหรับอัปโหลดรูปเวลาผู้ใช้ insert รูปลงในเนื้อหาบทความ (ผ่าน Insert Image modal)

```typescript
async function uploadImage(file: File): Promise<string> {
  // จำกัด 1MB ฝั่ง client
  if (file.size > 1 * 1024 * 1024) { ... }
  
  // Safe JSON parsing
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  let data: any;
  try {
    data = await res.json();
  } catch {
    // Response ไม่ใช่ JSON → throw readable error
  }
}
```

---

## 🐛 ปัญหาที่พบและแก้ไขแล้ว

### ปัญหา: ลากรูปมาวางแล้วขึ้น `"Unexpected token 'I', \"Internal E\"... is not valid JSON"`

**สาเหตุ:** response จากเซิร์ฟเวอร์ไม่ใช่ JSON — อาจเป็นเพราะ:
1. ไฟล์ใหญ่เกินไป → Server ปฏิเสธ request (413 Request Entity Too Large)
2. Next.js body parser limit → คืน HTML error page
3. Internal Server Error ก่อนถึง API logic

**สิ่งที่แก้ไข (2025-06-02):**
1. **เพิ่ม client-side validation** — เช็คขนาดไฟล์ 1MB ก่อนส่ง request
2. **Safe JSON parsing** — ถ้า response ไม่ใช่ JSON จะ `catch` แล้ว throw error ที่อ่านเข้าใจได้
3. **API error messages เป็นภาษาไทย** — ผู้ใช้เข้าใจง่ายขึ้น
4. **ป้องกัน formData() ล้ม** — try-catch รอบ `request.formData()`
5. **ลด server limit** — `MAX_FILE_SIZE` จาก 10MB → 1MB
6. **ลด client limit** — `ImageUploader` จาก 5MB → 1MB, `uploadImage()` จาก 5MB → 1MB

---

## 📋 สรุป Limit

| จุดตรวจ | Limit | ไฟล์ |
|---------|-------|------|
| Client: `ImageUploader` handleUpload | 1MB | `components/ui/image-uploader.tsx` |
| Client: `article-editor` uploadImage | 1MB | `components/admin/article-editor.tsx` |
| Server: API `/api/upload` | 1MB | `app/api/upload/route.ts` |

---

> **อัปเดตล่าสุด:** 2025-06-02  
> **ผู้แก้ไข:** Vibe Engineering  
> **ไฟล์ที่เกี่ยวข้อง:** `components/ui/image-uploader.tsx`, `components/admin/article-editor.tsx`, `app/api/upload/route.ts`
