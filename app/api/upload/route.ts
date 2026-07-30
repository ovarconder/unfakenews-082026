// ============================================================
// POST /api/upload
// ============================================================
// อัปโหลดรูปภาพไปยัง Supabase Storage (bucket: article-images)
// รับ multipart/form-data พร้อม field name "file"
//
// Security:
//   - ตรวจสอบชนิดไฟล์ (images only)
//   - จำกัดขนาด (10MB)
//   - เปลี่ยนชื่อเป็น UUID เพื่อป้องกัน path traversal

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
const BUCKET_NAME = "article-images";

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

    if (!file) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ — กรุณาใช้ field name 'file'" },
        { status: 400 }
      );
    }

    // Log file info (debug)
    console.log(`[Upload] Received: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type})`);

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
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload to Supabase Storage (admin client = bypass RLS)
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
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
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
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
