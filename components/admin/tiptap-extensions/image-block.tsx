// ============================================================
// Tiptap Image Block Extension + NodeView
// ============================================================
// ให้ WYSIWYG editor แสดงภาพเดี่ยวที่ปรับขนาดได้ (align + width)
// โดยใช้ Component เดียวกับ renderer (renderImageBlock)
// ทำให้ข้อมูล align/width/caption ไม่หายเมื่อสลับ Markdown <-> WYSIWYG
// ============================================================

"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import { renderImageBlock } from "@/components/articles/image-block";
import type { ImageAlign, ImageWidth } from "@/lib/image-block";

interface ImageBlockAttrs {
  src: string;
  alt: string;
  caption: string;
  align: ImageAlign;
  width: ImageWidth;
}

function ImageBlockNodeView({ node }: { node: any }) {
  const attrs = node.attrs as ImageBlockAttrs;
  return (
    <div
      contentEditable={false}
      data-type="imageBlock"
      data-src={attrs.src}
      data-alt={attrs.alt}
      data-caption={attrs.caption}
      data-align={attrs.align}
      data-width={attrs.width}
      className="relative my-4"
    >
      {renderImageBlock({
        src: attrs.src,
        alt: attrs.alt,
        caption: attrs.caption,
        align: attrs.align,
        width: attrs.width,
      })}
    </div>
  );
}

export const ImageBlockExtension = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-src") || "",
        renderHTML: (attributes) => ({ "data-src": (attributes as any).src || "" }),
      },
      alt: {
        default: "",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-alt") || "",
        renderHTML: (attributes) => ({ "data-alt": (attributes as any).alt || "" }),
      },
      caption: {
        default: "",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-caption") || "",
        renderHTML: (attributes) => ({ "data-caption": (attributes as any).caption || "" }),
      },
      align: {
        default: "center" as ImageAlign,
        parseHTML: (el) => ((el as HTMLElement).getAttribute("data-align") as ImageAlign) || "center",
        renderHTML: (attributes) => ({ "data-align": (attributes as any).align || "center" }),
      },
      width: {
        default: "full" as ImageWidth,
        parseHTML: (el) => ((el as HTMLElement).getAttribute("data-width") as ImageWidth) || "full",
        renderHTML: (attributes) => ({ "data-width": (attributes as any).width || "full" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="imageBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "imageBlock" }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockNodeView);
  },
});

// Helper สำหรับ insertContent ของ imageBlock
export function imageBlockContent(attrs: ImageBlockAttrs) {
  return { type: "imageBlock", attrs };
}
