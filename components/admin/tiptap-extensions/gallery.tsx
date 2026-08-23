// ============================================================
// Tiptap Gallery Extension + NodeView
// ============================================================
// ให้ WYSIWYG editor แสดงแกลเลอรี (album) เป็น Masonry แบบเดียวกับ
// หน้า article สาธารณะ (ใช้ ImageGallery component เดียวกัน)
// เก็บรูปเป็น images[] attrs ใน node — serialize กลับเป็น
// {% gallery %} ... {% endgallery %} ผ่าน htmlToMarkdown
// ============================================================

"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import { ImageGallery, type GalleryImage } from "@/components/articles/image-gallery";

// ---- Render: ใช้ใน NodeView (editor) ----
function GalleryNodeView({ node }: { node: any }) {
  const images: GalleryImage[] = node.attrs.images || [];
  return (
    <div
      className="relative my-4"
      data-type="gallery"
      data-images={JSON.stringify(images)}
      contentEditable={false}
    >
      {images.length > 0 ? (
        <ImageGallery images={images} />
      ) : (
        <div className="text-white/40 text-sm border border-dashed border-white/20 rounded-lg p-4 text-center">
          ยังไม่มีรูปในแกลเลอรี
        </div>
      )}
    </div>
  );
}

export const GalleryExtension = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      images: {
        default: [] as GalleryImage[],
        parseHTML: (el) => {
          try {
            const raw = el.getAttribute("data-images");
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({ "data-images": JSON.stringify(attributes.images || []) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "gallery" }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  },
});
