// ============================================================
// Siam Heritage - YouTube Thumbnail Embed Component
// ============================================================
// แสดง thumbnail ของวิดีโอ YouTube (ดึงจาก img.youtube.com)
// คลิกที่รูป → เปิดวิดีโอ YouTube ในหน้าต่างใหม่
// ใช้ร่วมกันทั้ง editor preview และหน้า article สาธารณะ
// ============================================================

"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import {
  getYouTubeThumb,
  getYouTubeThumbFallback,
  getYouTubeWatchUrl,
} from "@/lib/youtube";

interface YouTubeThumbProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function YouTubeThumb({ videoId, title, className = "" }: YouTubeThumbProps) {
  const [imgError, setImgError] = useState(false);
  const thumbSrc = imgError ? getYouTubeThumbFallback(videoId) : getYouTubeThumb(videoId);
  const watchUrl = getYouTubeWatchUrl(videoId);

  const openVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(watchUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <a
      href={watchUrl}
      onClick={openVideo}
      target="_blank"
      rel="noopener noreferrer"
      title={title || "เปิดวิดีโอ YouTube"}
      className={`group relative block overflow-hidden rounded-xl my-6 bg-black/40 ${className}`}
    >
      <img
        src={thumbSrc}
        alt={title || "วิดีโอ YouTube"}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {/* Overlay + play button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
        <span className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
          <Play size={28} fill="white" className="text-white ml-1" />
        </span>
      </div>
      {/* Label */}
      <span className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        ▶ เปิดดูวิดีโอบน YouTube
      </span>
    </a>
  );
}
