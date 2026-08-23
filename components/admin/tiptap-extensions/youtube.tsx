// ============================================================
// Tiptap YouTube Extension + NodeView
// ============================================================
// ให้ WYSIWYG editor แสดงวิดีโอ YouTube เป็น thumbnail ที่คลิกได้
// (ใช้ YouTubeThumb component เดียวกับหน้า article สาธารณะ)
// เก็บ videoId ใน attrs — serialize กลับเป็น {% youtube VIDEO_ID %}
// ============================================================

"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import { YouTubeThumb } from "@/components/articles/youtube-thumb";

function YouTubeNodeView({ node }: { node: any }) {
  const videoId: string = node.attrs.videoId || "";
  return (
    <div
      className="relative my-4"
      data-type="youtube"
      data-video-id={videoId}
      contentEditable={false}
    >
      {videoId ? (
        <YouTubeThumb videoId={videoId} title="วิดีโอ YouTube" />
      ) : (
        <div className="text-white/40 text-sm border border-dashed border-white/20 rounded-lg p-4 text-center">
          ยังไม่มีวิดีโอ
        </div>
      )}
    </div>
  );
}

export const YouTubeExtension = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      videoId: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-video-id") || "",
        renderHTML: (attributes) => ({ "data-video-id": attributes.videoId || "" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="youtube"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "youtube" }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeNodeView);
  },
});
