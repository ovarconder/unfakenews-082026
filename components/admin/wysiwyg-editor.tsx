"use client";


import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useRef, useState, forwardRef, useImperativeHandle } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  X,
  LayoutDashboard,
  Youtube,
} from "lucide-react";
import { GalleryExtension } from "./tiptap-extensions/gallery";
import { YouTubeExtension } from "./tiptap-extensions/youtube";
import { extractYouTubeId } from "@/lib/youtube";

interface WysiwygEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  onImageDrop?: (files: FileList) => void | Promise<void>;
}

export interface WysiwygEditorHandle {
  getHTML: () => string;
}

export const WysiwygEditor = forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(
  function WysiwygEditor({ initialHtml, onChange, onImageDrop }, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-amber-300 hover:text-amber-200 underline" },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "rounded-xl max-w-full my-4 mx-auto" },
      }),
      Placeholder.configure({
        placeholder: "เริ่มเขียนเนื้อหาที่นี่...",
      }),
      GalleryExtension,
      YouTubeExtension,
      // Bubble menu extension - uses the ref element rendered in JSX
      // (configured below via plugin reference)
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-4",
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (onImageDrop && files && files.length > 0) {
          const hasImage = Array.from(files).some((f) => f.type.startsWith("image/"));
          if (hasImage) {
            event.preventDefault();
            void onImageDrop(files);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Expose an imperative handle so callers can read the current HTML on demand.
  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? "",
  }), [editor]);

  const insertImage = useCallback(() => {
    const url = window.prompt("ใส่ URL รูปภาพ:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // แทรกวิดีโอ YouTube — กรอก URL/Video ID → ฝังเป็น youtube node (NodeView)
  const insertYouTube = useCallback(() => {
    if (!editor) return;
    const input = window.prompt(
      "วาง URL หรือ Video ID ของ YouTube\n(เช่น https://youtube.com/watch?v=VIDEO_ID)"
    );
    if (!input || !input.trim()) return;
    const videoId = extractYouTubeId(input);
    if (!videoId) {
      alert("ไม่พบ Video ID ของ YouTube ในลิงก์ที่ให้มา กรุณาตรวจสอบอีกครั้ง");
      return;
    }
    editor.chain().focus().insertContent({
      type: "youtube",
      attrs: { videoId },
    }).run();
  }, [editor]);

  // แทรกแกลเลอรี (album) — กรอก URL รูปภาพหลายรูป (คั่นด้วย enter) + caption
  const insertGallery = useCallback(() => {
    if (!editor) return;
    const input = window.prompt(
      "วาง URL รูปภาพสำหรับแกลเลอรี\n(หลายรูปให้คั่นด้วยบรรทัดใหม่)\n\nรูปแบบ: URL|alt text"
    );
    if (!input || !input.trim()) return;
    const images = input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [src, ...altParts] = line.split("|");
        return { src: src.trim(), alt: altParts.join("|").trim() || undefined };
      })
      .filter((img) => img.src);

    if (images.length === 0) {
      alert("ไม่พบ URL รูปภาพ");
      return;
    }

    editor.chain().focus().insertContent({
      type: "gallery",
      attrs: { images },
    }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("ใส่ URL ลิงก์:", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  // Bubble menu state
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Show/hide bubble menu on selection change
  useEffect(() => {
    const handleSelection = () => {
      if (!editor || editor.isDestroyed) { setBubblePos(null); return; }
      const { from, to, empty } = editor.state.selection;
      if (empty || from === to) { setBubblePos(null); return; }
      // Only show for text selection (not for tables/images etc)
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setBubblePos(null); return; }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorEl = editor.view.dom;
      const editorRect = editorEl.getBoundingClientRect();
      setBubblePos({
        top: rect.top - editorRect.top - 48,
        left: rect.left - editorRect.left + rect.width / 2,
      });
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [editor]);

  if (!editor) return null;

  // Toolbar button helper
  const ToolBtn = ({ onClick, active, title, children }: {
    onClick: () => void;
    active?: boolean;
    title?: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
        active ? "text-amber-300 bg-amber-300/15" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-white/5 border-b border-white/10">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon size={16} />
        </ToolBtn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 size={16} />
        </ToolBtn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
          <ListOrdered size={16} />
        </ToolBtn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <ToolBtn onClick={setLink} active={editor.isActive("link")} title="Insert Link">
          <Link size={16} />
        </ToolBtn>
        <ToolBtn onClick={insertImage} title="Insert Image">
          <Image size={16} />
        </ToolBtn>
        <ToolBtn onClick={insertGallery} title="Insert Gallery (Album)">
          <LayoutDashboard size={16} />
        </ToolBtn>
        <ToolBtn onClick={insertYouTube} title="Insert YouTube">
          <Youtube size={16} />
        </ToolBtn>
        <div className="flex-1" />
      </div>

      {/* Bubble Menu - appears above text selection */}
      {bubblePos && (
        <div
          ref={bubbleRef}
          className="absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-2xl border border-white/15 bg-gray-900/95 backdrop-blur-md"
          style={{
            top: bubblePos.top,
            left: bubblePos.left,
            transform: "translateX(-50%)",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${editor?.isActive("bold") ? "text-amber-300 bg-amber-300/15" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${editor?.isActive("italic") ? "text-amber-300 bg-amber-300/15" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${editor?.isActive("underline") ? "text-amber-300 bg-amber-300/15" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Underline"
          >
            <UnderlineIcon size={14} />
          </button>
          <div className="w-px h-4 bg-white/15 mx-0.5" />
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded transition-colors ${editor?.isActive("heading", { level: 2 }) ? "text-amber-300 bg-amber-300/15" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Heading 2"
          >
            <Heading2 size={14} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded transition-colors ${editor?.isActive("heading", { level: 3 }) ? "text-amber-300 bg-amber-300/15" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Heading 3"
          >
            <Heading3 size={14} />
          </button>
          <div className="w-px h-4 bg-white/15 mx-0.5" />
          <button
            onClick={setLink}
            className={`p-1.5 rounded transition-colors ${editor?.isActive("link") ? "text-amber-300 bg-amber-300/15" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Insert Link"
          >
            <Link size={14} />
          </button>
          {editor?.isActive("link") && (
            <button
              onClick={unsetLink}
              className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Remove Link"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
});
