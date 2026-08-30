// ============================================================
// Markdown Preview Renderer — ใช้ใน ArticleEditor
// ============================================================
// แยกออกมาเป็น Component เดี่ยวเพื่อป้องกัน SWC parser issues
// ============================================================

import React from "react";
import { ImageGallery, type GalleryImage } from "@/components/articles/image-gallery";
import { YouTubeThumb } from "@/components/articles/youtube-thumb";
import { parseYouTubeShortcode, parseYouTubeIframe } from "@/lib/youtube";
import { renderImageBlock } from "@/components/articles/image-block";
import { isImageBlockOpen, parseImageBlockOpen } from "@/lib/image-block";

const isImageLine = (line: string): boolean => /^!\[.*\]\(.*\)$/.test(line);
const isLinkLine = (line: string): boolean => /^\[.*\]\(.*\)$/.test(line);

/**
 * Render inline markdown ภายในบรรทัดเดียว: [text](url), **bold**, *italic*,
 * และ autolink URL ตรง ๆ (https://...) → ลิงก์แสดงโดเมน
 */
function renderInlineMd(text: string): React.ReactNode {
  // 1) Handle [text](url) ก่อน (ไม่แตะ image ![...](...) นอกเหนือ)
  const parts: React.ReactNode[] = [];
  const mdLink = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s<"')]+)/g;
  const boldRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

  const parseToNodes = (s: string, keyBase: string): React.ReactNode[] => {
    const arr: React.ReactNode[] = [];
    // bold/italic first
    const boldParts = s.split(boldRegex);
    boldParts.forEach((bp, bi) => {
      if (bp.startsWith("**") && bp.endsWith("**") && bp.length > 2) {
        arr.push(<strong key={`${keyBase}-b${bi}`}>{bp.slice(2, -2)}</strong>);
      } else if (bp.startsWith("*") && bp.endsWith("*") && bp.length > 1) {
        arr.push(<em key={`${keyBase}-i${bi}`}>{bp.slice(1, -1)}</em>);
      } else {
        // autolink URL
        const urlParts = bp.split(urlRegex);
        urlParts.forEach((up, ui) => {
          if (up.match(urlRegex)) {
            const host = (() => { try { return new URL(up).hostname.replace("www.", ""); } catch { return up; } })();
            arr.push(
              <a key={`${keyBase}-u${bi}-${ui}`} href={up} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 underline">
                {host}
              </a>
            );
          } else if (up) {
            arr.push(<React.Fragment key={`${keyBase}-t${bi}-${ui}`}>{up}</React.Fragment>);
          }
        });
      }
    });
    return arr;
  };

  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = mdLink.exec(text)) !== null) {
    const before = text.slice(last, m.index);
    if (before) parts.push(<React.Fragment key={k++}>{parseToNodes(before, `pre-${k}`)}</React.Fragment>);
    parts.push(
      <a key={k++} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 underline">
        {m[1]}
      </a>
    );
    last = m.index + m[0].length;
  }
  const rest = text.slice(last);
  if (rest) parts.push(<React.Fragment key={k++}>{parseToNodes(rest, `rest-${k}`)}</React.Fragment>);
  if (parts.length === 0) return text;
  return <>{parts}</>;
}

export function renderMarkdownPreview(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ============================================================
    // ★ YouTube embed — {% youtube VIDEO_ID %} หรือ <iframe ...>
    // ============================================================
    const ytShortcode = parseYouTubeShortcode(line);
    const ytIframe =
      line.trim().toLowerCase().startsWith("<iframe")
        ? parseYouTubeIframe(line)
        : null;
    if (ytShortcode || ytIframe) {
      const videoId = (ytShortcode || ytIframe)!.videoId;
      result.push(
        <YouTubeThumb key={`yt-${i}`} videoId={videoId} title="วิดีโอ YouTube" />
      );
      i++;
      continue;
    }

    // Gallery block
    if (line.trim() === "{% gallery %}") {
      const galleryImages: { src: string; alt: string }[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "{% endgallery %}") {
        const match = lines[i].match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          galleryImages.push({ src: match[2], alt: match[1] });
        }
        i++;
      }
      // Skip endgallery
      i++;

      if (galleryImages.length > 0) {
        // ★ ใช้ ImageGallery (Masonry + Lightbox) แบบเดียวกับหน้า article สาธารณะ
        result.push(
          <div key={`g-${i}`} className="my-6">
            <ImageGallery images={galleryImages as GalleryImage[]} />
          </div>
        );
      }
      continue;
    }

    // Image with alignment + width div wrapper (รองรับ center/left/right + ปรับขนาด)
    if (isImageBlockOpen(line)) {
      const { align, width } = parseImageBlockOpen(line);
      i++;
      let imgLine = lines[i] || "";
      let imgMatch = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
      let imgIdx = i;
      if (!imgMatch) {
        i++;
        imgIdx = i;
        imgLine = lines[i] || "";
        imgMatch = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
      }
      if (imgMatch) {
        // caption อาจอยู่ใน div หรืออยู่หลัง </div>
        let caption = "";
        let scan = imgIdx + 1;
        while (scan < lines.length) {
          const t = lines[scan].trim();
          if (t === "</div>") {
            scan++;
            continue;
          }
          if (/^\*[^*]+\*$/.test(t) && !t.startsWith("**")) {
            caption = t.slice(1, -1).trim();
          }
          break;
        }
        result.push(
          <div key={i}>
            {renderImageBlock({ src: imgMatch[2], alt: imgMatch[1], caption, align, width })}
          </div>
        );
        // skip remaining div lines if not already skipped
        while (i < lines.length && !lines[i].includes("</div>")) {
          i++;
        }
        i++;
        // ข้าม caption ที่อยู่นอก div (ถ้ามี)
        if (i < lines.length) {
          const t = lines[i].trim();
          if (/^\*[^*]+\*$/.test(t) && !t.startsWith("**")) {
            i++;
          }
        }
        continue;
      }
    }

    const hMatch = line.trim().match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const txt = hMatch[2].trim();
      if (level === 1) {
        result.push(<h1 key={i} className="text-3xl font-bold text-amber-300 mt-7 mb-3">{renderInlineMd(txt)}</h1>);
      } else if (level === 2) {
        result.push(<h2 key={i} className="text-2xl font-bold text-amber-200 mt-6 mb-3">{renderInlineMd(txt)}</h2>);
      } else if (level === 3) {
        result.push(<h3 key={i} className="text-xl font-semibold text-white mt-5 mb-2">{renderInlineMd(txt)}</h3>);
      } else {
        result.push(<h4 key={i} className="text-lg font-semibold text-white/90 mt-4 mb-2">{renderInlineMd(txt)}</h4>);
      }
      i++;
      continue;
    } else if (line.trim().startsWith(">")) {
      result.push(<h3 key={i} className="text-xl font-semibold text-white mt-5 mb-2">{line.slice(4)}</h3>);
      i++;
      continue;
    } else if (line.trim().startsWith(">")) {
      // Blockquote — รวมบรรทัดที่ขึ้นต้นด้วย > ต่อเนื่องกัน
      const quotes: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quotes.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      result.push(
        <blockquote
          key={i}
          className="border-l-4 border-amber-400/40 bg-white/[0.02] pl-4 py-2 my-3 italic text-white/70"
        >
          {quotes.map((q, qi) => (
            <div key={qi} className="last:mb-0">
              {renderInlineMd(q) || <br />}
            </div>
          ))}
        </blockquote>
      );
      continue;
    } else if (line.startsWith("**") && line.endsWith("**")) {
      result.push(<p key={i} className="font-bold text-white my-2">{line.replace(/\*\*/g, "")}</p>);
      i++;
      continue;
    } else if (line.startsWith("- ")) {
      result.push(<li key={i} className="text-white/80 ml-6 list-disc">{line.slice(2)}</li>);
    } else if (line.startsWith("1. ")) {
      result.push(<li key={i} className="text-white/80 ml-6 list-decimal">{line.slice(3)}</li>);
    } else if (isImageLine(line)) {
      const match = line.match(/!\[(.*)\]\((.*)\)/);
      if (match) {
        const alt = match[1];
        const src = match[2];
        let caption = "";
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith("*") && nextLine.endsWith("*") && !nextLine.startsWith("**")) {
            caption = nextLine.slice(1, -1).trim();
            i++;
          }
        }
        result.push(
          <div key={i} className="my-4">
            <div className="relative group">
              <img
                src={src}
                alt={alt}
                className="rounded-xl max-w-full mx-auto"
                loading="lazy"
              />
              {alt && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-black/70 text-white/80 text-[10px] pointer-events-none whitespace-nowrap">
                  {alt}
                </div>
              )}
            </div>
            {caption && (
              <p className="text-white/50 text-sm mt-1.5 text-center italic">{caption}</p>
            )}
          </div>
        );
      }
      i++;
      continue;
    } else if (isLinkLine(line)) {
      // บรรทัดที่เป็น [text](url) ล้วน → render เป็นลิงก์ (ผ่าน renderInlineMd)
      result.push(
        <p key={i} className="text-white/80 leading-relaxed mb-2">{renderInlineMd(line)}</p>
      );
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-3" />);
    } else {
      // บรรทัดธรรมดา — parse inline markdown ([text](url), **bold**, *italic*, autolink)
      result.push(<p key={i} className="text-white/80 leading-relaxed mb-2">{renderInlineMd(line)}</p>);
    }

    i++;
  }

  return result;
}
