// ====================================================================
// Admin: Create New Hero Slide
// ====================================================================
// หน้าเดียวกันกับ edit แต่ไม่ต้องมีค่าอะไรมา pre-fill
// มีฟีเจอร์: เลือกบทความมาแปะเป็น slide (ดึงชื่อ + ภาพปก + ลิงก์)

import { HeroSlideEditor } from "@/components/admin/hero-slide-editor";

export const dynamic = "force-dynamic";

export default function NewHeroSlidePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-white">สร้าง Slide ใหม่</h1>
        <p className="text-white/50 text-sm mt-1">
          สร้าง Hero Slide สำหรับ Banner หน้าแรก
        </p>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        <HeroSlideEditor />
      </div>
    </div>
  );
}
