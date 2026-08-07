// ============================================================
// Image Gallery + Lightbox — ใช้ในหน้าแสดงบทความ (Article Detail)
// ============================================================
// - แสดงรูปเป็นตาราง (grid) เมื่อมีมากกว่า 1 รูป
// - คลิกรูป → เปิด lightbox ดูรูปใหญ่ พร้อมปุ่มปิด/ก่อนหน้า/ถัดไป
// - รองรับ keyboard (Esc / ← / →)
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface GalleryImage {
  src: string;
  alt?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

/**
 * Lightbox ส่วนตัว — พรีวิวรูปใหญ่แบบ fullscreen พร้อม navigation
 */
function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
}) {
  // Lock body scroll + keyboard navigation
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onNavigate]);

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
        {index + 1} / {images.length}
      </div>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Full image */}
      <div
        className="max-w-[92vw] max-h-[85vh] px-4 flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt || ""}
          className="max-w-full max-h-[75vh] object-contain rounded-lg"
        />
        {current.alt && (
          <p className="text-white/60 text-sm text-center max-w-2xl">{current.alt}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Image Gallery — แสดง grid ของรูปภาพ พร้อม lightbox
 */
export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = useCallback((idx: number) => setLightboxIndex(idx), []);
  const close = useCallback(() => setLightboxIndex(null), []);
  const navigate = useCallback(
    (dir: 1 | -1) => {
      setLightboxIndex((prev) => {
        if (prev === null) return prev;
        const len = images.length;
        return (prev + dir + len) % len;
      });
    },
    [images.length]
  );

  // หยุด responsive grid ตามจำนวนรูป (เหมือนกับที่ editor ใช้)
  const gridClass =
    images.length <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : images.length === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <>
      <div className="my-6">
        <div className={`grid gap-3 ${gridClass}`}>
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => open(idx)}
              className="group relative overflow-hidden rounded-lg aspect-square cursor-zoom-in"
              title={img.alt}
              aria-label={img.alt || "ดูรูปภาพ"}
            >
              <img
                src={img.src}
                alt={img.alt || ""}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {img.alt && (
                <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-white/80 text-xs line-clamp-1">{img.alt}</span>
                  </div>
                </div>
              )}
              {/* Maximize icon on hover */}
              <span className="absolute top-2 right-2 bg-black/50 text-white/90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={12} className="rotate-45" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={close}
          onNavigate={navigate}
        />
      )}
    </>
  );
}
