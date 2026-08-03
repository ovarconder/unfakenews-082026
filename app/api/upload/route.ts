// ============================================================
// POST /api/upload
// ============================================================
// อัปโหลดรูปภาพไปยัง Supabase Storage (bucket: images)
// ซึ่งภายในแบ่งเป็น folder ตามฟังก์ชันการใช้งาน เช่น:
//   image-editor/site-settings   => site-settings/xxx.png
//   article-editor             => article-images/2025/07/xxx.png  (แยกตามเดือน)
//   hero-slide-editor          => hero-slides/xxx.png
//   categories                 => categories/xxx.png
//
// รับ multipart/form-data พร้อม field:
//   file   (File)  — ไฟล์ภาพ
//   folder (string, optional) — ชื่อ folder/type ที่จะเก็บ
//
// Security:
//   - ตรวจสอบชนิดไฟล์ (images only)
//   - จำกัดขนาด (1MB)
//   - เปลี่ยนชื่อเป็น UUID เพื่อป้องกัน path traversal
//   - folder จะถูก whitelist เพื่อกัน directory traversal (/..)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

// Bucket หลัก (rename จาก article-images -> images)
const BUCKET_NAME = "images";

// Whitelist folder ที่อนุญาต (กัน path traversal)
const ALLOWED_FOLDERS = new Set([
  "article-images",  // รูปบทความ — เก็บย่อยตามเดือน
  "site-settings",   // logo, favicon, og-image, support QR
  "hero-slides",     // banner หน้าแรก
  "categories",      // รูปหมวดหมู่
]);

export async function POST(request: NextRequest) {
  try {
    // ใช้ try-catch สำหรับ formData โดยเฉพาะ — ป้องกัน crash ถ้า body ใหญ่เกินไป
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formErr: any) {
      console.error("[Upload] formData() ล้มเหลว:", formErr.message);
      return NextResponse.json(
        { error: "ไม่สามารถอ่านข้อมูลที่ส่งมาได้ — ไฟล์อาจใหญ่เกินไป" },
        { status: 413 }
      );
    }

    const file = formData.get("file") as File | null;
    const folderRaw = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ — กรุณาใช้ field name 'file'" },
        { status: 400 }
      );
    }

    // Normalize folder & whitelist
    const folder = folderRaw.trim().replace(/^\/+|\/+$/g, "");
    if (folder && !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { error: `folder ที่ไม่ได้รับอนุญาต: ${folder}` },
        { status: 400 }
      );
    }

    // Log file info (debug)
    console.log(`[Upload] Received: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type}, folder: ${folder || "(root)"})`);

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `ประเภทไฟล์ไม่รองรับ: ${file.type}. รองรับ: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Build storage path (key) based on folder
    let key: string;
    if (folder === "article-images") {
      // แยกตามเดือน: article-images/2025/07/xxx.png
      const now = new Date();
      const yy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      key = `article-images/${yy}/${mm}/${uuid}`;
    } else if (folder) {
      // เช่น site-settings/xxx.png, hero-slides/xxx.png, categories/xxx.png
      key = `${folder}/${uuid}`;
    } else {
      // ไม่ระบุ folder → เก็บที่ root ของ bucket
      key = uuid;
    }

    // Upload to Supabase Storage (admin client = bypass RLS)
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(key, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error(`[Upload] Supabase upload error:`, error);
      return NextResponse.json(
        { error: `อัปโหลดไปยังที่เก็บรูปไม่สำเร็จ: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(key);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      filename: uuid,
      size: file.size,
    });
  } catch (err: any) {
    console.error("[Upload] Error:", err);
    return NextResponse.json(
      { error: err.message || "เกิดข้อผิดพลาดในการอัปโหลด — กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
