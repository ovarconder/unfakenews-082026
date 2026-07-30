// ============================================================
// ArticleEditor JSX — แยกออกมาเพื่อป้องกัน SWC parser issue
// ============================================================
import React from "react";
import {
  Image, Bold, Italic, Heading2, Heading3, List, Link, Eye, Edit3, Save, Trash2, Upload,
  X, Check, AlertCircle, LayoutDashboard, Plus, Globe, BookMarked, ChevronDown, ChevronUp,
  RefreshCw
} from "lucide-react";
import { WysiwygEditor } from "./wysiwyg-editor";
import { ImageUploader } from "@/components/ui/image-uploader";
import { renderMarkdownPreview } from "@/components/admin/markdown-preview";

// ============================================================

interface ArticleEditorJSXProps {
  // Tab
  activeTab: "editor" | "preview";
  setActiveTab: (tab: "editor" | "preview") => void;
  useWysiwyg: boolean;
  setUseWysiwyg: (val: boolean) => void;
  
  // Title
  originalTitle: string;
  setOriginalTitle: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  autoSlug: boolean;
  setAutoSlug: (val: boolean) => void;
  onTitleChange?: (title: string) => void;
  error: string | null;
  setError: (err: string | null) => void;
  success: boolean;
  
  // Content
  content: string;
  useWysiwygEditor: boolean;
  handleWysiwygChange: (html: string) => void;
  contentRef: React.RefObject<HTMLTextAreaElement>;
  setContent: (val: string) => void;
  dropZoneRef: React.RefObject<HTMLDivElement>;
  handleImageDrop: (files: FileList) => void;
  
  // Insert modal
  showInsertModal: boolean;
  insertFiles: File[];
  insertAltTexts: string[];
  insertCaptions: string[];
  insertAlignments: string[];
  insertAsGallery: boolean;
  setShowInsertModal: (val: boolean) => void;
  setInsertAltTexts: (val: string[]) => void;
  setInsertCaptions: (val: string[]) => void;
  setInsertAlignments: (val: string[]) => void;
  setInsertAsGallery: (val: boolean) => void;
  uploadedUrlsRef: React.MutableRefObject<string[]>;
  insertImages: () => void;
  
  // Status
  roleLoading: boolean;
  status: string;
  featured: boolean;
  setFeatured: (val: boolean) => void;
  
  // Category
  categories: { id: string; nameTH: string; slug: string }[];
  
  // Author
  author: string;
  setAuthor: (val: string) => void;
  showAuthor: boolean;
  setShowAuthor: (val: boolean) => void;
  
  // Dates
  publishedAt: string;
  setPublishedAt: (val: string) => void;
  
  // Tags
  tags: string;
  setTags: (val: string) => void;
  
  // Excerpt
  originalExcerpt: string;
  setOriginalExcerpt: (val: string) => void;
  shortExcerpt: string;
  setShortExcerpt: (val: string) => void;
  longExcerpt: string;
  setLongExcerpt: (val: string) => void;
  socialCaption: string;
  setSocialCaption: (val: string) => void;
  
  // Image
  imageUrl: string;
  setImageUrl: (val: string) => void;
  imageAlt: string;
  setImageAlt: (val: string) => void;

  // Google Schema Markup
  googleSchemaMarkup: string;
  setGoogleSchemaMarkup: (val: string) => void;
  googleSchemaError: string | null;
  setGoogleSchemaError: (val: string | null) => void;
  
  // Wiki metadata
  entityName: string;
  setEntityName: (val: string) => void;
  entityType: string;
  setEntityType: (val: string) => void;
  wikidataId: string;
  setWikidataId: (val: string) => void;
  quickFacts: { label: string; value: string }[];
  glossary: { term: string; definition: string }[];
  updateQuickFact: (i: number, field: string, val: string) => void;
  removeQuickFact: (i: number) => void;
  addQuickFact: () => void;
  addGlossaryEntry: () => void;
  updateGlossaryEntry: (i: number, field: string, val: string) => void;
  removeGlossaryEntry: (i: number) => void;
  
  // Save
  saving: boolean;
  handleSave: () => Promise<void>;
  handleDelete?: () => void;
  
  // Insert control
  showInsertControls: boolean;
  setShowInsertControls: (val: boolean) => void;
  insertMarkdown: (prefix: string, suffix?: string) => void;
  
  // Insert file
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ArticleEditorJSX(props: ArticleEditorJSXProps) {
  const {
    activeTab, setActiveTab, useWysiwyg, setUseWysiwyg,
    error, setError, success,
    originalTitle, setOriginalTitle, slug, setSlug, autoSlug, setAutoSlug,
    content, useWysiwygEditor, handleWysiwygChange, contentRef, setContent,
    dropZoneRef, handleImageDrop,
    showInsertModal, insertFiles, insertAltTexts, insertCaptions, insertAlignments,
    insertAsGallery, setShowInsertModal, setInsertAltTexts, setInsertCaptions,
    setInsertAlignments, setInsertAsGallery, uploadedUrlsRef, insertImages,
    roleLoading, status, featured, setFeatured,
    categories,
    author, setAuthor, showAuthor, setShowAuthor,
    publishedAt, setPublishedAt,
    tags, setTags,
    originalExcerpt, setOriginalExcerpt, shortExcerpt, setShortExcerpt,
    longExcerpt, setLongExcerpt, socialCaption, setSocialCaption,
    imageUrl, setImageUrl, imageAlt, setImageAlt,
    googleSchemaMarkup, setGoogleSchemaMarkup, googleSchemaError, setGoogleSchemaError,
    entityName, setEntityName, entityType, setEntityType, wikidataId, setWikidataId,
    quickFacts, glossary, updateQuickFact, removeQuickFact, addQuickFact,
    addGlossaryEntry, updateGlossaryEntry, removeGlossaryEntry,
    saving, handleSave, handleDelete,
    showInsertControls, setShowInsertControls, insertMarkdown,
    fileInputRef, handleFileSelect, onTitleChange,
  } = props;

  return (
    <div className="space-y-6">
      {/* Error / Success Messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm">
          <Check size={16} />
          บันทึกสำเร็จ!
        </div>
      )}

      {/* ======== Title ======== */}
      <div>
        <label className="block text-white/70 text-sm mb-2">ชื่อบทความ *</label>
        <input
          type="text"
          value={originalTitle}
          onChange={(e) => {
            setOriginalTitle(e.target.value);
            if (autoSlug && onTitleChange) {
              onTitleChange(e.target.value);
            }
          }}
          placeholder="ชื่อบทความภาษาไทย"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 transition-all"
        />
      </div>

      {/* Slug */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/70 text-sm">Slug (URL path)</label>
          <button
            onClick={() => setAutoSlug(!autoSlug)}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              autoSlug
                ? "border-amber-400/30 text-amber-300 bg-amber-400/10"
                : "border-white/10 text-white/40 bg-white/[0.03]"
            }`}
          >
            {autoSlug ? "🔗 Auto" : "✏️ Manual"}
          </button>
        </div>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="url-friendly-name"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
        />
      </div>

      {/* ======== Tabs ======== */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
            activeTab === "editor"
              ? "bg-white/5 text-amber-300 border-t border-l border-r border-white/10"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <Edit3 size={14} />
          แก้ไข
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
            activeTab === "preview"
              ? "bg-white/5 text-amber-300 border-t border-l border-r border-white/10"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <Eye size={14} />
          ดูตัวอย่าง
        </button>
      </div>

      {/* ======== WYSIWYG toggle ======== */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-white/30">WYSIWYG</span>
        <button
          onClick={() => setUseWysiwyg(!useWysiwyg)}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            useWysiwyg ? "bg-amber-500" : "bg-white/10"
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
            useWysiwyg ? "translate-x-4" : ""
          }`} />
        </button>
      </div>

      {/* ======== Editor / Preview ======== */}
      {activeTab === "preview" ? (
        <div className="prose prose-invert max-w-none p-6 rounded-xl bg-white/5 border border-white/10 min-h-[400px]">
          {renderMarkdownPreview(content)}
        </div>
      ) : useWysiwygEditor ? (
        <div
          ref={dropZoneRef}
          className="relative"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropZoneRef.current) {
              dropZoneRef.current.classList.add("!border-amber-300/70", "!bg-amber-300/5");
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropZoneRef.current) {
              dropZoneRef.current.classList.remove("!border-amber-300/70", "!bg-amber-300/5");
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropZoneRef.current) {
              dropZoneRef.current.classList.remove("!border-amber-300/70", "!bg-amber-300/5");
            }
            if (e.dataTransfer.files.length > 0) {
              handleImageDrop(e.dataTransfer.files);
            }
          }}
        >
          <WysiwygEditor
            initialHtml={content}
            onChange={handleWysiwygChange}
            onImageDrop={handleImageDrop}
          />
          <div className="absolute inset-0 border-3 border-dashed border-transparent rounded-lg pointer-events-none transition-all duration-200" />
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className="relative"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropZoneRef.current) {
              dropZoneRef.current.classList.add("!border-amber-300/70", "!bg-amber-300/5");
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropZoneRef.current) {
              dropZoneRef.current.classList.remove("!border-amber-300/70", "!bg-amber-300/5");
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropZoneRef.current) {
              dropZoneRef.current.classList.remove("!border-amber-300/70", "!bg-amber-300/5");
            }
            if (e.dataTransfer.files.length > 0) {
              handleImageDrop(e.dataTransfer.files);
            }
          }}
        >
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`เขียนเนื้อหาที่นี่...`}
            rows={20}
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 font-mono text-sm leading-relaxed resize-y min-h-[400px]"
          />
          <div className="absolute inset-0 border-3 border-dashed border-transparent rounded-lg pointer-events-none transition-all duration-200" />
        </div>
      )}
      <p className="text-white/30 text-xs mt-1">
        💡 ลากรูปภาพมาวางในช่อง editor เพื่ออัปโหลดและแทรกรูปโดยอัตโนมัติ
      </p>

      {/* ======== Image Insert Modal ======== */}
      {showInsertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 bg-[#0d1b2a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {insertAsGallery ? "เพิ่มแกลเลอรีรูปภาพ" : "เพิ่มรูปภาพ"}
              </h3>
              <button onClick={() => setShowInsertModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className={`grid gap-4 ${insertFiles.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"}`}>
                {insertFiles.map((_file, i) => (
                  <div key={i} className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    <img
                      src={uploadedUrlsRef.current[i]}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <input
                      type="text"
                      value={insertAltTexts[i]}
                      onChange={(e) => {
                        const newAlt = [...insertAltTexts];
                        newAlt[i] = e.target.value;
                        setInsertAltTexts(newAlt);
                      }}
                      placeholder="Alt text (สำหรับ accessibility + SEO)"
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-300/50"
                    />
                    <input
                      type="text"
                      value={insertCaptions[i]}
                      onChange={(e) => {
                        const newCaption = [...insertCaptions];
                        newCaption[i] = e.target.value;
                        setInsertCaptions(newCaption);
                      }}
                      placeholder="Caption (ข้อความใต้รูป)"
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 text-xs focus:outline-none focus:border-cyan-300/50"
                    />
                    {!insertAsGallery && (
                      <div className="flex items-center gap-2">
                        <label className="text-white/40 text-[10px]">จัด:</label>
                        <select
                          value={insertAlignments[i]}
                          onChange={(e) => {
                            const newAlign = [...insertAlignments];
                            newAlign[i] = e.target.value as "center" | "left" | "right";
                            setInsertAlignments(newAlign);
                          }}
                          className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs"
                        >
                          <option value="center">กลาง</option>
                          <option value="left">ซ้าย</option>
                          <option value="right">ขวา</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== Status Badge ======== */}
      {roleLoading ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-white/50 text-sm">สถานะ:</span>
          <div className="animate-pulse w-20 h-5 bg-white/10 rounded" />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-white/50 text-sm">สถานะ:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            status === "published"
              ? "bg-green-500/15 text-green-400 border border-green-500/30"
              : status === "pending_review"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
              : status === "hidden"
              ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
              : "bg-white/10 text-white/50"
          }`}>
            {status === "published" ? "เผยแพร่" : status === "pending_review" ? "รอตรวจสอบ" : status === "hidden" ? "ซ่อน" : "ร่าง"}
          </span>
          <label className="flex items-center gap-1.5 ml-4 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded bg-white/10 border-white/20"
            />
            <span className="text-white/50 text-xs">Featured</span>
          </label>
          {/* Category */}
          <select
            value={categories.find(c => c.slug === "") ? "" : ""}
            onChange={(e) => {}}
            className="ml-auto px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs"
          >
            <option value="">ไม่มีหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.nameTH}</option>
            ))}
          </select>
        </div>
      )}

      {/* ======== Google Schema Markup (JSON-LD) ======== */}
      <details className="group rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-white/60 hover:text-white/80 text-sm font-medium transition-colors select-none">
          <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
          <BookMarked size={14} />
          Google Schema Markup (JSON-LD Structured Data)
          {googleSchemaMarkup.trim() && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              ✓ มีข้อมูล
            </span>
          )}
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-white/30 text-xs leading-relaxed">
            กำหนด Schema.org JSON-LD เพื่อให้ Google เข้าใจเนื้อหาบทความนี้ได้ดียิ่งขึ้น
            ค่าที่กรอกจะถูกนำไปแทรกใน <code className="text-amber-300/70 bg-white/5 px-1 rounded">&lt;script type="application/ld+json"&gt;</code>
            ของหน้าแสดงผลบทความ โดยจะถูก <strong className="text-white/60">merge รวมกับ Schema หลักของระบบ</strong>
            (Article, ImageObject, Entity Facts) อัตโนมัติ
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://schema.org/docs/schemas.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400/70 hover:text-amber-300 underline underline-offset-2"
            >
              📖 ดู Schema.org types
            </a>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400/70 hover:text-amber-300 underline underline-offset-2"
            >
              🔍 ทดสอบ Rich Results
            </a>
            <button
              type="button"
              onClick={() => {
                // Insert a basic Article schema template
                setGoogleSchemaMarkup(JSON.stringify({
                  "@type": "Article",
                  "headline": originalTitle || "ชื่อบทความ",
                  "description": shortExcerpt || originalExcerpt || "",
                  "datePublished": publishedAt,
                  "author": {
                    "@type": "Person",
                    "name": author || "ทีมงาน สยามเฮอริเทจ"
                  }
                }, null, 2));
              }}
              className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 border border-white/10 transition-colors"
            >
              📋 ใช้ Template
            </button>
            <button
              type="button"
              onClick={() => {
                // Format JSON beautifully
                try {
                  const parsed = JSON.parse(googleSchemaMarkup);
                  setGoogleSchemaMarkup(JSON.stringify(parsed, null, 2));
                } catch {
                  // ignore
                }
              }}
              className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 border border-white/10 transition-colors"
            >
              ✨ จัดรูปแบบ
            </button>
          </div>

          {/* Inline validation error */}
          {googleSchemaError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300/80 text-xs">
              <AlertCircle size={12} />
              {googleSchemaError}
            </div>
          )}

          <div className="relative">
            <textarea
              value={googleSchemaMarkup}
              onChange={(e) => {
                setGoogleSchemaMarkup(e.target.value);
                // Live validation on blur — we do it inline here
              }}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (!val) {
                  // Clear error if empty
                  if (googleSchemaError) setGoogleSchemaError(null);
                  return;
                }
                try {
                  JSON.parse(val);
                  if (googleSchemaError) setGoogleSchemaError(null);
                } catch {
                  setGoogleSchemaError("❌ JSON ไม่ถูกต้อง — มีข้อผิดพลาดที่ syntax");
                }
              }}
              placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  ...\n}`}
              rows={8}
              className="w-full px-3 py-2.5 bg-[#0a1628] border border-white/10 rounded-lg text-white text-xs font-mono leading-relaxed placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 transition-colors resize-y"
              spellCheck={false}
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-white/20 font-mono pointer-events-none">
              {googleSchemaMarkup.trim() ? `${new Blob([googleSchemaMarkup]).size} B` : ""}
            </div>
          </div>
        </div>
      </details>

      {/* ======== Actions ======== */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {handleDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm"
            >
              <Trash2 size={14} />
              ลบบทความ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
