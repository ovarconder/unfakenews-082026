# 🔐 Environment Variables Guide (for Vibe / overconda.space)

> คู่มือการตั้งค่า Environment Variables สำหรับระบบ Analytics + AdSense  
> ตั้งใน Vercel Dashboard → Project Settings → Environment Variables

---

## ⚡ Variables ที่ต้องตั้ง

| Variable | จำเป็น | ไว้ทำอะไร | ตัวอย่าง |
|----------|--------|-----------|---------|
| `NEXT_PUBLIC_GA_ID` | ❓ ถ้าต้องการ Analytics | Google Analytics 4 measurement ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_ADSENSE_ID` | ❓ ถ้าต้องการ AdSense | Google AdSense publisher ID | `ca-pub-XXXXXXXXXXXXXXXX` |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` | ❓ ถ้าต้องการ AdSense | Ad Unit slot สำหรับ sidebar บทความ | `1234567890` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOMEPAGE` | ❓ ถ้าต้องการ AdSense | Ad Unit slot สำหรับหน้าแรก | `1234567890` |

> ⚠️ **ไม่ set = ไม่มี analytics/ads แสดง** ระบบจะ skip โดยอัตโนมัติ ไม่ error

---

## 📊 Google Analytics 4 (GA4)

### ขั้นตอน

1. ไปที่ [Google Analytics](https://analytics.google.com)
2. Admin → Create Property → ใส่ชื่อ "Vibe"
3. เลือก Web → ใส่ URL `https://vibe.overconda.space`
4. สร้าง → จะได้ **Measurement ID** (`G-XXXXXXXXXX`)
5. เอา ID ไปตั้งเป็น `NEXT_PUBLIC_GA_ID` ใน Vercel

### สิ่งที่ track โดยอัตโนมัติ

- Page views (แยกตามภาษา เช่น `/th`, `/en`)
- การอ่านบทความ (`article_read` event)
- การเปลี่ยนภาษา (`language_switch` event)
- การแปล (`translation` event)

### Tracking Events (ใน Google Analytics)

| Event | Parameters | ใช้ดูอะไร |
|-------|-----------|----------|
| `page_view` | `page_language` | ภาษาที่ users เข้าชม |
| `article_read` | `article_slug, article_language, translation_status` | ยอดอ่านบทความแยกภาษา |
| `language_switch` | `from_language, to_language` | พฤติกรรมการเปลี่ยนภาษา |
| `translation` | `action, locale, slug, model` | ต้นทุนการแปล |

---

## 💰 Google AdSense

### ขั้นตอน

1. ไปที่ [Google AdSense](https://adsense.google.com)
2. สมัคร — ต้องมีเนื้อหาเพียงพอ (~20-50 บทความ) ก่อนถึงจะผ่าน
3. เมื่อ approved → **Get code** → copy `ca-pub-XXXXXXXXXXXXXX`
4. สร้าง **Ad units**:
   - **Sidebar Rectangle**: 300×250px → ใช้ใน sidebar บทความ
   - **Homepage Banner**: Responsive → ใช้ในหน้าแรก
5. เอา slot ID ไปตั้งใน Vercel

### ตำแหน่งที่วาง Ad

| ไฟล์ | ตำแหน่ง | ประเภท |
|------|---------|--------|
| `components/home/home-page.tsx` | ระหว่าง hero + latest articles | responsive banner |
| `components/articles/article-detail.tsx` | sidebar ถัดจาก related articles | rectangle 300×250 |

### ข้อควรระวัง

- AdSense ห้ามวางบนหน้า login, admin — ระบบไม่วางให้ (AdUnit จะไม่ render ถ้าไม่มี slot)
- อย่าวาง AdUnit เกิน 3 จุดต่อหน้า — เสี่ยง policy violation
- ตรวจสอบ AdSense Policy ก่อนเปิด public

---

## 🧪 ทดสอบว่าทำงาน

### ทดสอบ Analytics
```bash
# 1. ตั้ง GA_ID ใน .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 2. run dev
npm run dev

# 3. เปิด localhost → เปิด DevTools → Network tab
#    ควรเห็น requests ไป google-analytics.com

# 4. ใน GA → Realtime → ควรเห็น active user
```

### ทดสอบ AdSense
```bash
# 1. ตั้ง ADSENSE_ID และ slot IDs
# 2. run dev → เปิดหน้า article
# 3. ตรวจว่า <ins class="adsbygoogle"> แสดงใน DOM
#    (แต่ AdSense จะไม่แสดงโฆษณาจริงใน localhost)
```

---

## 📁 Code Reference

| Component | Path | Description |
|-----------|------|-------------|
| `GoogleAnalytics` | `components/analytics/google-analytics.tsx` | GA4 + custom events |
| `CookieConsent` | `components/analytics/cookie-consent.tsx` | Cookie banner |
| `AdSenseScript` | `components/analytics/adsense.tsx` | โหลด adsbygoogle.js |
| `AdUnit` | `components/analytics/adsense.tsx` | วาง Ad responsive |
| `AdUnitFixed` | `components/analytics/adsense.tsx` | วาง Ad fixed size |
