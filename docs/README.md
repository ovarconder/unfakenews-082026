# เอกสารโปรเจกต์ UnFakeNews

> อัปเดตล่าสุด: 2026-11-03

## กติกาการตั้งชื่อ

- ไฟล์ชื่อ `YYYY-MM-DD-หัวข้อ.md` โดย **วันที่ = วันที่อัปเดตเนื้อหาล่าสุด**
- แก้เนื้อหาเอกสารเมื่อไร ให้ `git mv` เปลี่ยนวันที่นำหน้าเป็นวันนั้น และแก้ตารางด้านล่าง
- 1 หัวข้อมีไฟล์เดียว ห้ามสร้างไฟล์ใหม่ที่เนื้อหาทับกับไฟล์เดิม ให้แก้ไฟล์เดิมแทน
- บันทึกงานแต่ละครั้ง (ทำอะไร ทำไม เหลืออะไร) สร้างเป็นไฟล์ใหม่ เช่น `2026-11-01-code-review-cleanup.md`
- เอกสารที่ล้าสมัยให้ย้ายไป `archive/` ไม่ต้องลบ

## เอกสารหลัก (เรียงจากอัปเดตล่าสุด)

| อัปเดต | เอกสาร | เนื้อหา |
|---|---|---|
| 2026-11-03 | [article-guide](2026-11-03-article-guide.md) | **คู่มือ** สร้างบทความ (`/draft-article`) → Import → ตรวจ → publish → clone ไปเว็บ 2–5 (`/clone-article`) |
| 2026-11-01 | [overview](2026-11-01-overview.md) | **เริ่มอ่านที่นี่** — เครือข่าย 5 เว็บ, โครงสร้างโค้ด, แนวคิดข้อมูล |
| 2026-11-01 | [translation-and-source-locale](2026-11-01-translation-and-source-locale.md) | ภาษาต้นฉบับรายบทความ, ระบบแปล, prompt |
| 2026-11-01 | [new-site-setup](2026-11-01-new-site-setup.md) | ตั้งเว็บใหม่: Supabase + Vercel + domain + env |
| 2026-11-01 | [database-schema](2026-11-01-database-schema.md) | ตาราง/คอลัมน์ทั้งหมด + กติกา migration |
| 2026-11-01 | [seo-indexing](2026-11-01-seo-indexing.md) | IndexNow, Google Indexing, sitemap/hreflang, llms.txt, Claims API |
| 2026-10-06 | [image-upload](2026-10-06-image-upload.md) | ระบบอัปโหลดรูป (Supabase Storage) |
| 2026-08-18 | [google-schema-markup](2026-08-18-google-schema-markup.md) | JSON-LD / ClaimReview ต่อบทความ |

## บันทึกงาน

| วันที่ | บันทึก |
|---|---|
| 2026-11-01 | [code-review-cleanup](2026-11-01-code-review-cleanup.md): ตรวจโครงสร้าง, เพิ่มภาษาต้นฉบับ, prompt fact-check, ลบโค้ดที่ไม่ใช้, จัด docs |

## archive/

เอกสารเก่า 29 ไฟล์ (ก่อน 2026-11-01) ส่วนใหญ่เป็นสมัยที่โค้ดยังเป็น SiamHeritage / Vibe หรือเป็นบันทึกการแก้แต่ละครั้งที่ถูกรวมเข้าเอกสารหลักแล้ว
เก็บไว้ค้นประวัติเท่านั้น **ข้อมูลอาจไม่ตรงกับโค้ดปัจจุบัน**
