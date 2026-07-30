// ============================================================
// EnhancedImage — Component รูปภาพพร้อม Alt Text แบบบังคับ
// ============================================================
// - บังคับใส่ Alt Text ทุกครั้ง (ถ้าไม่มี ให้ Fallback)
// - รองรับ Next.js <Image> และ <img> fallback
// - ตรวจจับ alt ว่างและแจ้งเตือนใน dev mode
// - แสดง Caption และ Credit ได้
// ============================================================

"use client";

import { useState } from "react";

interface EnhancedImageProps {
  src: string;
  /** คำอธิบายรูปภาพ (required — ห้ามปล่อยว่าง เว้นแต่ decorative=true) */
  alt: string;
  /** คำอธิบายเพิ่มเติมสำหรับ accessibility */
  detailed?: string;
  /** Caption ใต้รูป */
  caption?: string;
  /** Decorational image? (ถ้า true จะใช้ alt="" + aria-hidden) */
  decorative?: boolean;
  /** Credit / Attribution */
  credit?: string;
  /** Width/Height สำหรับ layout stability */
  width?: number;
  height?: number;
  /** CSS class */
  className?: string;
  /** Object fit */
  objectFit?: "cover" | "contain" | "fill";
  /** Loading strategy */
  priority?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Aspect ratio (default: "16/9") */
  aspectRatio?: string;
  /** Show a subtle gradient overlay at bottom */
  hasGradient?: boolean;
}

/**
 * ตรวจสอบ Alt Text อย่างเข้มงวด
 * - ถ้า decorative=true อนุญาต alt="" ได้
 * - ถ้า decorative=false (default) และ alt="" → แจ้งเตือน + ใช้ fallback
 */
function validateAlt(alt: string, decorative: boolean, src: string): string {
  if (decorative) {
    // Decorative images must have empty alt
    return "";
  }

  if (!alt || alt.trim() === "") {
    // In development, warn about missing alt text
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️ [EnhancedImage] Missing alt text for: ${src}. Using fallback.`);
    }
    return `Image: ${src.split("/").pop()?.split(".")[0] || "content image"}`;
  }

  // Check if alt is too generic (less than 3 meaningful chars)
  if (alt.trim().length < 5) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️ [EnhancedImage] Alt text too short ("${alt}") for: ${src}. Consider adding more context.`);
    }
  }

  return alt.trim();
}

export default function EnhancedImage({
  src,
  alt,
  detailed,
  caption,
  decorative = false,
  credit,
  width,
  height,
  className = "",
  objectFit = "cover",
  priority = false,
  onClick,
  aspectRatio,
  hasGradient = false,
}: EnhancedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const validatedAlt = validateAlt(alt, decorative, src);
  const isDecorative = decorative || validatedAlt === "";

  // Fallback for broken images
  if (error) {
    return (
      <figure className={`relative overflow-hidden bg-[#0a1628] rounded-lg ${className}`}>
        <div
          className="flex items-center justify-center"
          style={{
            aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : "16/9"),
          }}
        >
          <div className="text-center p-4">
            <svg
              className="w-8 h-8 mx-auto mb-2 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-white/30 text-xs">{validatedAlt || "Image unavailable"}</p>
          </div>
        </div>
        {caption && (
          <figcaption className="px-3 py-2 text-white/40 text-[10px] leading-relaxed">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure
      className={`relative overflow-hidden rounded-lg bg-[#0a1628] ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
      role={isDecorative ? "presentation" : undefined}
      aria-hidden={isDecorative ? true : undefined}
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
        }}
      >
        <img
          src={src}
          alt={validatedAlt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-full transition-all duration-500
            ${objectFit === "cover" ? "object-cover" : ""}
            ${objectFit === "contain" ? "object-contain" : ""}
            ${objectFit === "fill" ? "object-fill" : ""}
            ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}
          `}
          style={{ objectFit }}
        />

        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f3a] to-[#0a1628] animate-pulse" />
        )}

        {/* Gradient overlay */}
        {hasGradient && loaded && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#060e1a]/80 via-transparent to-transparent pointer-events-none" />
        )}
      </div>

      {/* Caption */}
      {(caption || detailed || credit) && (
        <figcaption className="px-3 py-2 space-y-1">
          {caption && (
            <p className="text-white/50 text-xs leading-relaxed">{caption}</p>
          )}
          {detailed && (
            <p className="text-white/30 text-[10px] leading-relaxed">
              <span className="sr-only">รายละเอียดภาพ: </span>
              {detailed}
            </p>
          )}
          {credit && (
            <p className="text-white/20 text-[9px]">
              📷 {credit}
            </p>
          )}
        </figcaption>
      )}

      {/* Screen reader only: detailed description */}
      {detailed && (
        <span className="sr-only" role="note">
          คำอธิบายเพิ่มเติม: {detailed}
        </span>
      )}
    </figure>
  );
}

/**
 * HOC: สร้าง EnhancedImage พร้อม alt fallback ที่บังคับ
 * ใช้เพื่อป้องกันการลืมใส่ alt
 */
export function withStrictAlt(
  props: EnhancedImageProps
): EnhancedImageProps {
  if (!props.alt && !props.decorative) {
    const fallbackAlt = `Image: ${props.src.split("/").pop()?.split(".")[0] || "article image"}`;
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[StrictAlt] Missing alt text! Using fallback: "${fallbackAlt}"\n` +
        `  → src: ${props.src}\n` +
        `  → Set 'decorative={true}' if this is a purely decorative image.`
      );
    }
    return { ...props, alt: fallbackAlt };
  }
  return props;
}
