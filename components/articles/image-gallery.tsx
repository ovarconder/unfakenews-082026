// ============================================================
// Image Gallery + Lightbox — ใช้ในหน้าแสดงบทความ (Article Detail)
// ============================================================
// - แสดงรูปเป็น Masonry (Pinterest) ที่จัดลำดับด้วย JavaScript
//   ไปยังคอลัมน์ที่สั้นที่สุด โดยใช้สัดส่วนจริงของแต่ละรูป
// - LazyLoad: ใช้ IntersectionObserver โหลดรูปเมื่อเลื่อนเข้าจอ
//   (โหลดล่วงหน้า 200px) — ประหยัด bandwidth
// - คลิกรูป → เปิด lightbox ดูรูปใหญ่ พร้อมปุ่มปิด/ก่อนหน้า/ถัดไป
// - รองรับ keyboard (Esc / ← / →)
// ============================================================

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** คำนวณจำนวนคอลัมน์ตามความกว้างหน้าจอ */
function getColumnCount(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

/** ใช้ breakpoint ง่ายๆ ผ่านการฟัง resize */
function useColumnCount(): number {
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const calculate = () => setCols(getColumnCount(window.innerWidth));
    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, []);

  return cols;
}

// ============================================================
// หนึ่งรูปใน Masonry — LazyLoad ด้วย IntersectionObserver และ
// แจ้งสัดส่วน (aspect ratio) จาก onLoad ให้ Masonry ใช้จัดเรียง
// ============================================================
function MasonryItem({
  img,
  onRatio,
}: {
  img: GalleryImage;
  onRatio: (ratio: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // IntersectionObserver — โหลดเมื่อเลื่อนเข้า viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // โหลดล่วงหน้า 200px ก่อนเข้า
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    setLoaded(true);
    if (el.naturalWidth > 0) {
      onRatio(el.naturalWidth / el.naturalHeight);
    }
  };

  return (
    <div
      ref={ref}
      className="group relative block w-full overflow-hidden rounded-lg cursor-zoom-in mb-4 bg-white/[0.03]"
      title={img.alt}
      aria-label={img.alt || "ดูรูปภาพ"}
    >
      {/* Placeholder กัน layout shift ก่อนภาพโหลด (fallback 4:3) */}
      {!loaded && (
        <div className="w-full aspect-[4/3] animate-pulse bg-white/5" />
      )}

      {inView && (
        <img
          src={img.src}
          alt={img.alt || ""}
          loading="lazy"
          onLoad={handleLoad}
          className={`w-full h-auto block rounded-lg transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* alt overlay on hover */}
      {img.alt && (
        <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-full bg-gradient-to-t from-black/80 to-transparent p-2">
            <span className="text-white/80 text-xs line-clamp-2">{img.alt}</span>
          </div>
        </div>
      )}

      {/* Maximize icon on hover */}
      <span className="absolute top-2 right-2 bg-black/50 text-white/90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <ChevronRight size={12} className="rotate-45" />
      </span>
    </div>
  );
}

/**
 * Image Gallery — JS Masonry + LazyLoad + Lightbox
 *
 * จัดเรียงรูปไปยังคอลัมน์ที่ "สั้นที่สุด" ด้วย JavaScript (แบบ Pinterest)
 * โดยใช้สัดส่วนจริง (aspect ratio) ของแต่ละรูปที่โหลดเสร็จ
 */
export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const cols = useColumnCount();
  const [ratios, setRatios] = useState<Record<number, number>>({});

  const recordRatio = useCallback((idx: number, ratio: number) => {
    setRatios((prev) => (prev[idx] === ratio ? prev : { ...prev, [idx]: ratio }));
  }, []);

  // จัดเรียงรูปเป็นคอลัมน์ (ไปยังคอลัมน์ที่สั้นที่สุด)
  const columns = useMemo(() => {
    const colsArr: { idx: number }[][] = Array.from({ length: cols }, () => []);
    const heights = new Array<number>(cols).fill(0);

    images.forEach((img, idx) => {
      const ratio = ratios[idx] || 4 / 3; // fallback ก่อนรู้สัดส่วน
      const height = 1 / ratio;

      let minCol = 0;
      for (let c = 1; c < cols; c++) {
        if (heights[c] < heights[minCol]) minCol = c;
      }
      colsArr[minCol].push({ idx });
      heights[minCol] += height;
    });

    return colsArr;
  }, [images, ratios, cols]);

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

  return (
    <>
      <div className="my-6">
        <div className="flex gap-4 items-start">
          {columns.map((col, cIdx) => (
            <div key={cIdx} className="flex-1 min-w-0 flex flex-col">
              {col.map(({ idx }) => {
                const img = images[idx];
                return (
                  <div key={idx} onClick={() => open(idx)}>
                    <MasonryItem img={img} onRatio={(r) => recordRatio(idx, r)} />
                  </div>
                );
              })}
            </div>
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
