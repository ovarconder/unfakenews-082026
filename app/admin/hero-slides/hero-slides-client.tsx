// ============================================================
// Admin - Hero Slides Client Component
// ============================================================

"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Edit3, Eye, EyeOff, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

interface HeroSlide {
  id: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
  image_url: string;
  image_alt_th: string | null;
  image_alt_en: string | null;
  cta_text_th: string | null;
  cta_text_en: string | null;
  cta_link: string | null;
  sort_order: number;
  is_active: boolean;
}

interface HeroSlidesClientProps {
  slides: HeroSlide[];
}

export default function HeroSlidesClient({ slides: initialSlides }: HeroSlidesClientProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/hero-slides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
      });
      if (res.ok) {
        setSlides(slides.map(s => s.id === id ? { ...s, is_active: !current } : s));
      }
    } catch (err) {
      console.error("Failed to toggle slide:", err);
    }
  };

  const moveSlide = async (id: string, direction: "up" | "down") => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === slides.length - 1) return;

    const newSlides = [...slides];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newSlides[idx].sort_order, newSlides[swapIdx].sort_order] = 
      [newSlides[swapIdx].sort_order, newSlides[idx].sort_order];
    [newSlides[idx], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[idx]];

    setSlides(newSlides);

    try {
      await fetch("/api/hero-slides/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: newSlides.map((s, i) => ({ id: s.id, sort_order: i })),
        }),
      });
    } catch (err) {
      console.error("Failed to reorder:", err);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("ลบ slide นี้?")) return;
    try {
      const res = await fetch(`/api/hero-slides?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSlides(slides.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">Hero Slides</h1>
          <p className="text-white/50 text-sm mt-1">จัดการสไลด์หน้าแรก (Banner Carousel)</p>
        </div>
        <Link
          href="/admin/hero-slides/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 text-[#0a1628] font-medium hover:bg-amber-300 transition-colors"
        >
          <Plus size={16} />
          เพิ่ม Slide
        </Link>
      </div>

      {slides.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p>ยังไม่มี Hero Slides</p>
          <Link href="/admin/hero-slides/new" className="text-amber-300 hover:text-amber-200 mt-2 inline-block">
            เพิ่ม Slide แรก
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`rounded-xl border p-4 transition-all ${
                slide.is_active
                  ? "bg-gradient-to-br from-[#0f1f3a] to-[#162545] border-white/10"
                  : "bg-[#0a1628]/50 border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 pt-2">
                  <button
                    onClick={() => moveSlide(slide.id, "up")}
                    disabled={idx === 0}
                    className="p-1 text-white/30 hover:text-amber-300 disabled:opacity-20"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <span className="text-xs text-white/40">{idx + 1}</span>
                  <button
                    onClick={() => moveSlide(slide.id, "down")}
                    disabled={idx === slides.length - 1}
                    className="p-1 text-white/30 hover:text-amber-300 disabled:opacity-20"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{slide.title_th}</span>
                    <span className="text-white/30">|</span>
                    <span className="text-white/60 text-sm">{slide.title_en}</span>
                    {!slide.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px]">ซ่อน</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    {slide.subtitle_th && <span className="truncate max-w-xs">{slide.subtitle_th}</span>}
                  </div>
                  {slide.image_url && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-white/30">Image:</span>
                      <span className="text-white/50 truncate max-w-sm">{slide.image_url}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(slide.id, slide.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      slide.is_active
                        ? "text-green-400 hover:bg-green-500/10"
                        : "text-white/30 hover:bg-white/5"
                    }`}
                    title={slide.is_active ? "ซ่อน" : "แสดง"}
                  >
                    {slide.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <Link
                    href={`/admin/hero-slides/${slide.id}`}
                    className="p-2 rounded-lg text-white/30 hover:text-amber-300 hover:bg-amber-300/10 transition-colors"
                  >
                    <Edit3 size={16} />
                  </Link>
                  <button
                    onClick={() => deleteSlide(slide.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
