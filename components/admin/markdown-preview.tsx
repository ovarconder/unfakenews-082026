// ============================================================
// Markdown Preview Renderer — ใช้ใน ArticleEditor
// ============================================================
// แยกออกมาเป็น Component เดี่ยวเพื่อป้องกัน SWC parser issues
// ============================================================

import React from "react";

const isImageLine = (line: string): boolean => /^!\[.*\]\(.*\)$/.test(line);
const isLinkLine = (line: string): boolean => /^\[.*\]\(.*\)$/.test(line);

export function renderMarkdownPreview(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

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
        result.push(
          <div key={`g-${i}`} className="my-6">
            <div className={`grid gap-3 ${
              galleryImages.length <= 2
                ? "grid-cols-1 sm:grid-cols-2"
                : galleryImages.length === 3
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
            }`}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => window.open(img.src, "_blank")}
                  className="group relative overflow-hidden rounded-lg aspect-square"
                  title={img.alt || undefined}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {img.alt && (
                    <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                        <span className="text-white/80 text-xs">{img.alt}</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      }
      continue;
    }

    // Image with alignment div wrapper
    if (line.match(/<div class="image-(left|right)">/)) {
      const align = line.match(/image-(left|right)/)?.[1] || "center";
      i++;
      let imgLine = lines[i] || "";
      let imgMatch = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
      if (!imgMatch) {
        // try next line
        i++;
        imgLine = lines[i] || "";
        imgMatch = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
      }
      if (imgMatch) {
        // Check for caption after
        let caption = "";
        const nextIdx = i + 1;
        if (nextIdx < lines.length) {
          const nextLine = lines[nextIdx].trim();
          if (nextLine.startsWith("*") && nextLine.endsWith("*") && !nextLine.startsWith("**")) {
            caption = nextLine.slice(1, -1).trim();
            i = nextIdx + 1; // skip caption + </div>
          }
        }
        result.push(
          <div key={i} className={`my-4 ${align === "left" ? "float-left mr-4" : "float-right ml-4"} max-w-[40%]`}>
            <div className="relative group">
              <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-xl w-full" />
              {imgMatch[1] && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-black/70 text-white/80 text-[10px] pointer-events-none whitespace-nowrap">
                  {imgMatch[1]}
                </div>
              )}
            </div>
            {caption && (
              <p className="text-white/50 text-xs mt-1 text-center italic">{caption}</p>
            )}
          </div>
        );
        // skip remaining div lines if not already skipped
        while (i < lines.length && !lines[i].includes("</div>")) {
          i++;
        }
        i++;
        continue;
      }
    }

    if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="text-2xl font-bold text-amber-200 mt-6 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      result.push(<h3 key={i} className="text-xl font-semibold text-white mt-5 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      result.push(<p key={i} className="font-bold text-white my-2">{line.replace(/\*\*/g, "")}</p>);
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
      const match = line.match(/\[(.*)\]\((.*)\)/);
      if (match) {
        result.push(
          <a key={i} href={match[2]} className="text-amber-300 hover:text-amber-200 underline">
            {match[1]}
          </a>
        );
      }
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-3" />);
    } else {
      result.push(<p key={i} className="text-white/80 leading-relaxed mb-2">{line}</p>);
    }

    i++;
  }

  return result;
}
