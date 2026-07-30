// ============================================================
// Admin: Edit Hero Slide
// ============================================================
// ใช้ form เดียวกับสร้างใหม่ แต่ pre-fill ค่าเดิม

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { HeroSlideEditor } from "@/components/admin/hero-slide-editor";
import type { HeroSlideRow } from "@/lib/supabase-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditHeroSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: slide } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("id", id)
    .single();

  if (!slide) {
    notFound();
  }

  const heroSlide = slide as HeroSlideRow;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-white">แก้ไข Slide</h1>
        <p className="text-white/50 text-sm mt-1">
          แก้ไข Slide: {heroSlide.title_th}
          <span className="text-white/30 ml-2 font-mono text-xs">/{heroSlide.id.slice(0, 8)}</span>
        </p>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
        <HeroSlideEditor
          initialData={{
            id: heroSlide.id,
            title_th: heroSlide.title_th,
            title_en: heroSlide.title_en,
            subtitle_th: heroSlide.subtitle_th || "",
            subtitle_en: heroSlide.subtitle_en || "",
            image_url: heroSlide.image_url,
            cta_text_th: heroSlide.cta_text_th || "",
            cta_text_en: heroSlide.cta_text_en || "",
            cta_link: heroSlide.cta_link || "",
            is_active: heroSlide.is_active,
          }}
        />
      </div>
    </div>
  );
}
