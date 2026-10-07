// ============================================================
// Hero Banner - Image Carousel
// ============================================================
// ดึง slides จาก Supabase (hero_slides table)
// เวียนรูป 5-6 หัวข้ออัตโนมัติ
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/locales";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";

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
}

interface HeroBannerProps {
  locale: Locale;
}

export function HeroBanner({ locale }: HeroBannerProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    try {
      const res = await fetch("/api/hero-slides");
      const data = await res.json();
      if (data.slides) {
        setSlides(data.slides);
      }
    } catch (err) {
      console.error("Failed to fetch hero slides:", err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);
  const goNext = useCallback(() => setCurrent((prev) => (prev + 1) % slides.length), [slides.length]);
  const goPrev = useCallback(() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length), [slides.length]);

  if (loading) {
    // กำลังโหลดสไลด์ → แสดง spinner (ไม่โชว์ชื่อเว็บ fallback กลางจอ)
    return (
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-bg">
        <div
          className="animate-spin w-10 h-10 border-2 border-brand-primary/40 border-t-transparent rounded-full"
          role="status"
          aria-label="Loading"
        />
      </section>
    );
  }

  if (slides.length === 0) {
    // ไม่มีสไลด์เลย → ซ่อน banner ทั้งหมด
    return null;
  }

  const slide = slides[current];
  const title = locale === "th" ? slide.title_th : slide.title_en;
  const subtitle = locale === "th" ? slide.subtitle_th : slide.subtitle_en;
  const ctaText = locale === "th" ? slide.cta_text_th : slide.cta_text_en;
  const altText = locale === "th" ? slide.image_alt_th : slide.image_alt_en;

  return (
    <section className="relative min-h-[85vh] flex items-end justify-center overflow-hidden bg-brand-bg">
      {/* Background Image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${slide.image_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg-secondary/65 via-brand-bg-secondary/50 to-brand-bg/30 z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 text-center px-4 pb-28 pt-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-brand-primary/50" />
          <div className="w-2 h-2 rotate-45 bg-brand-primary/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-brand-primary/50" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-kanit font-bold text-white mb-6 leading-tight animate-fade-in">
          <span className="font-kanit text-brand-gradient">
            {title}
          </span>
        </h1>

        {subtitle && (
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {ctaText && slide.cta_link && (
          <Link
            href={slide.cta_link}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg font-semibold bg-brand-gradient-hover transition-all duration-300 shadow-lg shadow-brand-primary/20"
          >
            {ctaText}
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        )}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-brand-primary transition-all backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-brand-primary transition-all backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`transition-all duration-300 ${
                idx === current
                  ? "text-amber-300 scale-110"
                  : "text-white/30 hover:text-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              <Circle
                size={idx === current ? 10 : 8}
                fill={idx === current ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      )}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-bg to-transparent z-10" />
    </section>
  );
}
