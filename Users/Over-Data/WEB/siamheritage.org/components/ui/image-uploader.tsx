// ============================================================
// ImageUploader — Reusable File Upload Component
// ============================================================
// ใช้กับ settings (logo, favicon, og-image), articles, hero slides etc.
//
// Props:
//   value: string    — current image URL/path
//   onChange: (url: string) => void — callback when image uploaded/changed
//   label?: string   — field label
//   accept?: string  — accepted mime types
//   maxSizeMB?: number
//   bucket?: string  — Supabase bucket (default: article-images)
//   className?: string
//   previewWidth?: number  — width of preview box in px
//   previewHeight?: number
// ============================================================

"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image, AlertCircle, Check } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  bucket?: string;
  className?: string;
  previewWidth?: number;
  previewHeight?: number;
}

export function ImageUploader({
  value,
  onChange,
  label,
  accept = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
  maxSizeMB = 10,
  bucket,
  className = "",
  previewWidth = 160,
  previewHeight = 100,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    // Validate
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large (max ${maxSizeMB}MB)`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [onChange, maxSizeMB]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const hasImage = value && value !== "";

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-white/70 text-xs">{label}</label>
      )}

      {/* Clickable preview area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${dragOver ? "border-amber-400 bg-amber-400/10" : "border-white/20 hover:border-amber-400/50 hover:bg-white/5"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
        style={{ width: "100%", height: previewHeight + 20 }}
      >
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full" />
              <span className="text-sm">Uploading...</span>
            </div>
          </div>
        ) : hasImage ? (
          <>
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-contain p-2"
              style={{ maxHeight: previewHeight }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-sm bg-black/60 px-3 py-1.5 rounded-lg">
                <Upload size={14} />
                Change
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
            <Image size={24} className="mb-1" />
            <p className="text-xs">Drop image or click to upload</p>
          </div>
        )}
      </div>

      {/* URL input as fallback */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/logo/... or https://..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-300/50"
        />
        {hasImage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="px-2 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
            title="Remove image"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
          <AlertCircle size={12} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Max size hint */}
      <p className="text-white/30 text-[10px]">
        Supported: JPG, PNG, GIF, WebP (max {maxSizeMB}MB)
      </p>
    </div>
  );
}
