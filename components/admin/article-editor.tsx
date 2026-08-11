// ============================================================
// Siam Heritage - Article Editor
// ============================================================
// Rich text editor with:
//   - Markdown editing
//   - Live preview
//   - Drag & drop image upload
//   - Auto slug generation
//   - Category management
//   - Featured toggle
//   - Publish date picker

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import type { ArticleMaster } from "@/lib/types";
import type { UserRole } from "@/lib/auth-types";
import { hasPermission } from "@/lib/auth-types";
import { WysiwygEditor } from "./wysiwyg-editor";
import { adminFetch } from "@/lib/use-admin-fetch";
import { addNotification } from "@/lib/notification-store";
import { ImageGallery, type GalleryImage } from "@/components/articles/image-gallery";
import {
  Image,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Link,
  Eye,
  Edit3,
  Save,
  Trash2,
  X,
  Check,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ArticleEditorProps {
  initialData?: ArticleMaster;
  onSave: (data: ArticleFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export interface ArticleFormData {
  slug: string;
  originalTitle: string;
  originalExcerpt: string;
  originalContent: string;
  category: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  featured?: boolean;
  tags?: string[];
  status: "draft" | "pending_review" | "published" | "hidden" | "deleted";
  showAuthor?: boolean;

  // Wiki-Style Metadata
  entityName?: string;
  entityType?: "person" | "place" | "tradition" | "object" | "event" | "concept" | "other";
  wikidataId?: string;
  quickFacts?: { label: string; value: string }[];
  glossary?: { term: string; definition: string }[];
  shortExcerpt?: string;
  longExcerpt?: string;
  socialCaption?: string;

  // Image Metadata
  imageCredit?: string;
  imagePhotographer?: string;
  imageSourceUrl?: string;
  imageYear?: string;

  // Google Schema Markup
  googleSchemaMarkup?: Record<string, unknown> | null;
}

// ============================================================
// Helper Function
// ============================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F\s-]/g, "") // keep Thai chars
    .replace(/[\s]+/g, "-")
    .replace(/[\u0E00-\u0E7F]/g, "") // remove Thai for ASCII slug
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ============================================================
// Image Upload Handler
// ============================================================

async function uploadImage(file: File): Promise<string> {
  if (file.size > 1 * 1024 * 1024) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `ไฟล์ใหญ่เกินไป (${sizeMB}MB) — กรุณาเลือกรูปที่เล็กกว่า 1MB\n` +
      `💡 แนะนำ: ใช้ WebP หรือ JPEG คุณภาพ 80% ความกว้างไม่เกิน 1200px`
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  // 📁 จัดเก็บรูปบทความ (รวมทั้งรูปในเนื้อหา + gallery) แยกตามปี/เดือน
  //    ที่ article-images/YYYY/MM/ — ไม่รวมกันที่ root ของ bucket
  //    เหมือนกลไกเดิมที่แยก folder เพื่อการจัดการ
  formData.append("folder", "article-images");
  const res = await fetch("/api/upload", { method: "POST", body: formData });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || `อัปโหลดล้มเหลว (HTTP ${res.status})`);
    } catch {
      throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดพลาด (HTTP ${res.status})`);
    }
  }

  const data = await res.json();
  return data.url;
}

// ============================================================
// Main Editor Component
// ============================================================

export function ArticleEditor({ initialData, onSave, onDelete }: ArticleEditorProps) {
  // 1. Declare All State first to avoid TDZ (Temporal Dead Zone) Errors
  const [title, setTitle] = useState(initialData?.originalTitle || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugAuto, setSlugAuto] = useState(!initialData); 
  const [content, setContent] = useState(initialData?.originalContent || "");
  const [excerpt, setExcerpt] = useState(initialData?.originalExcerpt || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [author, setAuthor] = useState(initialData?.author || "");
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt || new Date().toISOString().split("T")[0]
  );
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [imageCredit, setImageCredit] = useState(initialData?.imageCredit || "");
  const [imagePhotographer, setImagePhotographer] = useState(initialData?.imagePhotographer || "");
  const [imageSourceUrl, setImageSourceUrl] = useState(initialData?.imageSourceUrl || "");
  const [imageYear, setImageYear] = useState(initialData?.imageYear || "");
  const [googleSchemaMarkup, setGoogleSchemaMarkup] = useState(
    initialData?.googleSchemaMarkup ? JSON.stringify(initialData.googleSchemaMarkup, null, 2) : ""
  );
  const [googleSchemaError, setGoogleSchemaError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [showAuthor, setShowAuthor] = useState(initialData?.showAuthor !== false);
  const [categoriesList, setCategoriesList] = useState<{ nameTH: string }[]>([]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await adminFetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          if (data.categories) {
            setCategoriesList(data.categories);
            // If categories exist and none selected, auto-select first
            if (data.categories.length > 0 && !category) {
              setCategory(data.categories[0].nameTH);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Wiki-Style Metadata States
  const [entityName, setEntityName] = useState(initialData?.entityName || "");
  const [entityType, setEntityType] = useState<"person" | "place" | "tradition" | "object" | "event" | "concept" | "other">(initialData?.entityType || "tradition");
  const [wikidataId, setWikidataId] = useState(initialData?.wikidataId || "");
  const [quickFacts, setQuickFacts] = useState<{ label: string; value: string }[]>(initialData?.quickFacts || []);
  const [glossary, setGlossary] = useState<{ term: string; definition: string }[]>(initialData?.glossary || []);
  const [shortExcerpt, setShortExcerpt] = useState(initialData?.shortExcerpt || "");
  const [longExcerpt, setLongExcerpt] = useState(initialData?.longExcerpt || "");
  const [socialCaption, setSocialCaption] = useState(initialData?.socialCaption || "");

  // Role management States
  const [userRole, setUserRole] = useState<"writer" | "editor" | "admin" | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Image Insert Modal States (Plain metadata to securely transfer references)
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [insertFileNames, setInsertFileNames] = useState<string[]>([]);
  const [insertAltTexts, setInsertAltTexts] = useState<string[]>([]);
  const [insertCaptions, setInsertCaptions] = useState<string[]>([]);
  const [insertAlignments, setInsertAlignments] = useState<("center" | "left" | "right")[]>([]);
  const [insertAsGallery, setInsertAsGallery] = useState(false);

  // UI Flow States
  const [previewMode, setPreviewMode] = useState(false);
  const [wysiwygMode, setWysiwygMode] = useState(true);
  const [status, setStatus] = useState<"draft" | "pending_review" | "published" | "hidden" | "deleted">(initialData?.status === "published" ? "published" : "draft");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<string | null>(null);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const wysiwygEditorRef = useRef<{ getHTML: () => string }>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const uploadedUrlsRef = useRef<string[]>([]);

  // 2. Handlers and Effects
  const addQuickFact = () => {
    setQuickFacts([...quickFacts, { label: "", value: "" }]);
  };
  const updateQuickFact = (index: number, field: string, value: string) => {
    setQuickFacts(prev => prev.map((qf, i) => i === index ? { ...qf, [field]: value } : qf));
  };
  const removeQuickFact = (index: number) => {
    setQuickFacts(prev => prev.filter((_, i) => i !== index));
  };

  const addGlossaryEntry = () => {
    setGlossary([...glossary, { term: "", definition: "" }]);
  };
  const updateGlossaryEntry = (index: number, field: string, value: string) => {
    setGlossary(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };
  const removeGlossaryEntry = (index: number) => {
    setGlossary(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUserRole(data.user?.role || null);
      })
      .catch(() => setUserRole(null))
      .finally(() => setRoleLoading(false));
  }, []);

  const canReview = userRole ? hasPermission(userRole, "article:review") : false;
  const canPublish = userRole ? hasPermission(userRole, "article:publish") : false;
  const canEditAny = userRole ? hasPermission(userRole, "article:edit_any") : false;

  useEffect(() => {
    if (slugAuto && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugAuto]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };

  const openInsertModal = (asGallery = false) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = asGallery;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      setUploading(true);
      setError(null);
      try {
        const urls: string[] = [];
        for (const file of files) {
          const url = await uploadImage(file);
          urls.push(url);
        }
        uploadedUrlsRef.current = urls;
        const names = urls.map(u => decodeURIComponent(u.split('/').pop() || 'image.jpg'));
        setInsertFileNames(names);
        setInsertAltTexts(files.map(() => ""));
        setInsertCaptions(files.map(() => ""));
        setInsertAlignments(files.map(() => "center"));
        setInsertAsGallery(asGallery);
        setShowInsertModal(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const insertImages = () => {
    if (insertFileNames.length === 0) return;

    if (insertAsGallery && insertFileNames.length > 1) {
      const galleryLines = [
        "{% gallery %}",
        ...insertFileNames.map((_name, i) => {
          return `  ![${insertAltTexts[i] || "รูป"}](${uploadedUrlsRef.current[i]})`;
        }),
        "{% endgallery %}",
      ];
      const markdown = "\n" + galleryLines.join("\n") + "\n";
      insertAtCursor(markdown);
    } else {
      const blocks = insertFileNames.map((_name, i) => {
        const url = uploadedUrlsRef.current[i];
        const alt = insertAltTexts[i] || "รูป";
        const caption = insertCaptions[i]?.trim();
        const align = insertAlignments[i];
        let md = "";
        if (align === "center") {
          md = `![${alt}](${url})`;
        } else {
          md = `<div class="image-${align}">\n![${alt}](${url})\n</div>`;
        }
        if (caption) {
          md += `\n*${caption}*`;
        }
        return md;
      });
      const markdown = "\n" + blocks.join("\n\n") + "\n";
      insertAtCursor(markdown);
    }

    setShowInsertModal(false);
    setInsertFileNames([]);
    setInsertAltTexts([]);
    setInsertCaptions([]);
    setInsertAlignments([]);
    setInsertAsGallery(false);
  };

  const handleInsertFilesPick = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadImage(file);
        urls.push(url);
      }
      uploadedUrlsRef.current = urls;
      const names = urls.map(u => decodeURIComponent(u.split('/').pop() || 'image.jpg'));
      setInsertFileNames(names);
      setInsertAltTexts(files.map(() => ""));
      setInsertCaptions(files.map(() => ""));
      setInsertAlignments(files.map(() => "center"));
      setInsertAsGallery(files.length > 1);
      setShowInsertModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const markdownToHtml = (md: string): string => {
    let html = md
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/^\d+\. (.+)/gm, '<li>$1</li>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-w-full my-4 mx-auto" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-amber-300 underline">$1</a>')
      .replace(/\n$/, '');
    if (!html.startsWith('<p>')) html = '<p>' + html;
    if (!html.endsWith('</p>')) html = html + '</p>';
    return html;
  };

  const htmlToMarkdown = (html: string): string => {
    let md = html
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '$1')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '')
      .replace(/<li>(.*?)<\/li>/gi, '- $1')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<div[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n');
    return md.trim();
  };

  const handleWysiwygChange = useCallback((html: string) => {
    const md = htmlToMarkdown(html);
    setContent(md);
  }, []);

  const insertAtCursor = (text: string) => {
    if (contentRef.current) {
      const start = contentRef.current.selectionStart;
      const end = contentRef.current.selectionEnd;
      const newContent = content.slice(0, start) + text + content.slice(end);
      setContent(newContent);
    } else {
      setContent((prev) => prev + text);
    }
  };

  const handleImageDrop = useCallback(async (files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    await handleInsertFilesPick(imageFiles);
  }, [content]);

  const handleSlugChange = (value: string) => {
    setSlugAuto(false);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("กรุณากรอกชื่อบทความ");
      return;
    }
    if (!content.trim()) {
      setError("กรุณากรอกเนื้อหาบทความ");
      return;
    }
    if (!slug.trim()) {
      setError("กรุณากรอก slug");
      return;
    }

    // === Validate Google Schema Markup (ถ้ามีค่า) ===
    let parsedSchema: Record<string, unknown> | null = null;
    if (googleSchemaMarkup.trim()) {
      try {
        parsedSchema = JSON.parse(googleSchemaMarkup.trim());
        if (typeof parsedSchema !== "object" || parsedSchema === null || Array.isArray(parsedSchema)) {
          setError("❌ Google Schema Markup ต้องเป็น JSON Object {...} เท่านั้น (ไม่ใช่ Array หรือ string เปล่า)");
          setSaving(false);
          return;
        }
      } catch {
        setError("❌ Google Schema Markup เป็น JSON ที่ไม่ถูกต้อง กรุณาตรวจสอบรูปแบบ");
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({
        slug,
        originalTitle: title,
        originalExcerpt: excerpt || content.slice(0, 200).replace(/[#*\n]/g, ""),
        originalContent: content,
        category,
        author: author || "ทีมงาน UnFake News",
        publishedAt,
        imageUrl: imageUrl || undefined,
        imageCredit: imageCredit.trim() || undefined,
        imagePhotographer: imagePhotographer.trim() || undefined,
        imageSourceUrl: imageSourceUrl.trim() || undefined,
        imageYear: imageYear.trim() || undefined,
        featured,
        tags: tags.length > 0 ? tags : undefined,
        status,
        showAuthor,
        entityName: entityName.trim() || undefined,
        entityType,
        wikidataId: wikidataId.trim() || undefined,
        quickFacts: quickFacts.filter(f => f.label.trim() && f.value.trim()).length > 0
          ? quickFacts.filter(f => f.label.trim() && f.value.trim())
          : undefined,
        glossary: glossary.filter(g => g.term.trim() && g.definition.trim()).length > 0
          ? glossary.filter(g => g.term.trim() && g.definition.trim())
          : undefined,
        shortExcerpt: shortExcerpt.trim() || undefined,
        longExcerpt: longExcerpt.trim() || undefined,
        socialCaption: socialCaption.trim() || undefined,
        googleSchemaMarkup: parsedSchema,
      });
      setSuccess(true);

      // ★ ไม่ auto-translate อัตโนมัติหลังบันทึกอีกต่อไป
      //   (เปลี่ยนเป็นกด "แปลอัตโนมัติ" ทีละภาษาด้วยตนเอง ที่ edit-client)
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix = "") => {
    if (!contentRef.current) return;
    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const selected = content.slice(start, end);
    const newText = prefix + selected + suffix;
    const newContent = content.slice(0, start) + newText + content.slice(end);
    setContent(newContent);

    setTimeout(() => {
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  const isImageLine = (line: string): boolean => /^!\[.*\]\(.*\)$/.test(line);
  const isLinkLine = (line: string): boolean => /^\[.*\]\(.*\)$/.test(line);

  function renderPreview(text: string) {
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
        i++; // Skip endgallery

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

      // Image with alignment div wrapper
      if (line.match(/<div class="image-(left|right)">/)) {
        const align = line.match(/image-(left|right)/)?.[1] || "center";
        i++;
        let imgLine = lines[i] || "";
        let imgMatch = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
        if (!imgMatch) {
          i++;
          imgLine = lines[i] || "";
          imgMatch = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
        }
        if (imgMatch) {
          let caption = "";
          const nextIdx = i + 1;
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (nextLine.startsWith("*") && nextLine.endsWith("*") && !nextLine.startsWith("**")) {
              caption = nextLine.slice(1, -1).trim();
              i = nextIdx + 1; 
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

  // 3. UI JSX Structure
  return (
    <div className="space-y-6">
      {/* ============================================================
          Error Popup (sticky) — แสดงเป็น modal กลางจอ ค้างไว้จนกว่าผู้ใช้ปิด
        ============================================================ */}
      {error && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setError(null)}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-2xl bg-[#1a2440] border border-red-500/40 shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg mb-1">บันทึกบทความไม่สำเร็จ</h3>
                <p className="text-red-300/90 text-sm leading-relaxed break-words whitespace-pre-wrap">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="shrink-0 text-white/50 hover:text-white transition-colors"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm font-medium hover:bg-white/15 transition-colors"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setSaving(false);
                  // กลับไปด้านบน เพื่อให้แก้ไขข้อมูลที่ขาดได้ง่าย
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black text-sm font-semibold hover:bg-amber-300 transition-colors"
              >
                ลองบันทึกอีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm">
          <Check size={16} />
          บันทึกสำเร็จ!
        </div>
      )}

      <div>
        <label className="block text-white/70 text-sm mb-2">ชื่อบทความ *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ใส่ชื่อบทความ..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 focus:bg-white/10 transition-all text-lg"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/70 text-sm">Slug (URL)</label>
          <button
            onClick={() => setSlugAuto(!slugAuto)}
            className={`text-xs px-2 py-1 rounded ${
              slugAuto ? "bg-amber-300/20 text-amber-300" : "bg-white/10 text-white/50"
            }`}
          >
            {slugAuto ? "Auto" : "Manual"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-sm">/th/articles/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="article-slug"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 font-mono text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">หมวดหมู่</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-300/50"
          >
            <option value="">เลือกหมวดหมู่...</option>
            {categoriesList.map((cat) => (
              <option key={cat.nameTH} value={cat.nameTH}>
                {cat.nameTH}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">ผู้เขียน</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="ชื่อผู้เขียน"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">วันที่เผยแพร่</label>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-300/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showAuthor}
            onChange={(e) => setShowAuthor(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
        </label>
        <span className="text-white/70 text-sm">แสดงชื่อผู้เขียนในบทความ</span>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
        </label>
        <span className="text-white/70 text-sm">ปักหมุดเป็นบทความแนะนำ (Featured)</span>
      </div>

      {/* Editor Content Area */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !previewMode ? "bg-amber-400 text-[#0a1628]" : "text-white/60 hover:bg-white/5"
              }`}
            >
              <Edit3 size={14} /> แก้ไข
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                previewMode ? "bg-amber-400 text-[#0a1628]" : "text-white/60 hover:bg-white/5"
              }`}
            >
              <Eye size={14} /> ดูตัวอย่าง
            </button>
          </div>

          {!previewMode && (
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/5">
                <button
                  onClick={() => setWysiwygMode(true)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    wysiwygMode ? "bg-white/10 text-amber-300" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  WYSIWYG
                </button>
                <button
                  onClick={() => setWysiwygMode(false)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    !wysiwygMode ? "bg-white/10 text-amber-300" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  Markdown
                </button>
              </div>

              {!wysiwygMode && (
                <div className="flex items-center gap-1 border-l border-white/10 pl-4">
                  <button onClick={() => insertMarkdown("**", "**")} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="ตัวหนา"><Bold size={14} /></button>
                  <button onClick={() => insertMarkdown("*", "*")} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="ตัวเอียง"><Italic size={14} /></button>
                  <button onClick={() => insertMarkdown("## ")} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="หัวข้อ 2"><Heading2 size={14} /></button>
                  <button onClick={() => insertMarkdown("### ")} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="หัวข้อ 3"><Heading3 size={14} /></button>
                  <button onClick={() => insertMarkdown("- ")} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="รายการแบบจุด"><List size={14} /></button>
                  <button onClick={() => insertMarkdown("[", "](url)")} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="ลิงก์"><Link size={14} /></button>
                  <button onClick={() => openInsertModal(false)} className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white" title="แทรกรูปภาพ"><Image size={14} /></button>
                  <button onClick={() => openInsertModal(true)} className="p-1.5 hover:bg-white/5 rounded text-amber-400/80 hover:text-amber-300" title="แทรกแกลเลอรีรูปภาพ"><LayoutDashboard size={14} /></button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 min-h-[400px]">
          {previewMode ? (
            <div className="prose prose-invert max-w-none">
              {renderPreview(content)}
            </div>
          ) : wysiwygMode ? (
            <WysiwygEditor
              ref={wysiwygEditorRef}
              initialHtml={markdownToHtml(content)}
              onChange={handleWysiwygChange}
              onImageDrop={handleImageDrop}
            />
          ) : (
            <div
              ref={dropZoneRef}
              className="relative h-full min-h-[400px]"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={async (e) => {
                e.preventDefault(); e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  await handleImageDrop(e.dataTransfer.files);
                }
              }}
            >
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="เขียนเนื้อหาบทความที่นี่ (รองรับ Markdown หรือลากรูปมาวางเพื่ออัปโหลด)..."
                className="w-full h-full min-h-[400px] bg-transparent border-none resize-y text-white placeholder-white/20 focus:outline-none font-mono text-sm leading-relaxed"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-lg z-10">
                  <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
                  <span className="text-white/80 text-sm">กำลังอัปโหลดรูปภาพ...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Wiki-Style Data Management Section */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/5 space-y-6">
        <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
          <LayoutDashboard size={18} /> ข้อมูลเชิงวิกิ (Wiki-Style Metadata)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">ชื่อวัตถุ/เอนทิตี (Entity Name)</label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="เช่น ต้มยำกุ้ง, วัดพระแก้ว"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">ประเภทเอนทิตี</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none"
            >
              <option value="person">บุคคล (Person)</option>
              <option value="place">สถานที่ (Place)</option>
              <option value="tradition">ประเพณี/วัฒนธรรม (Tradition)</option>
              <option value="object">สิ่งของ/วัตถุมงคล (Object)</option>
              <option value="event">เหตุการณ์ทางประวัติศาสตร์ (Event)</option>
              <option value="concept">แนวคิด/ภูมิปัญญา (Concept)</option>
              <option value="other">อื่น ๆ (Other)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">Wikidata ID</label>
          <input
            type="text"
            value={wikidataId}
            onChange={(e) => setWikidataId(e.target.value)}
            placeholder="เช่น Q1055 (ถ้ามี)"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono placeholder-white/30 focus:outline-none"
          />
        </div>

        {/* Quick Facts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white/70 text-sm font-medium">ข้อมูลสรุปย่อ (Quick Facts)</label>
            <button
              type="button"
              onClick={addQuickFact}
              className="text-xs px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-all border border-amber-400/20"
            >
              + เพิ่มข้อมูล
            </button>
          </div>
          <div className="space-y-2">
            {quickFacts.map((qf, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <input
                  type="text"
                  value={qf.label}
                  onChange={(e) => updateQuickFact(idx, "label", e.target.value)}
                  placeholder="หัวข้อ (เช่น ผู้คิดค้น, ยุคสมัย)"
                  className="w-1/3 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                />
                <input
                  type="text"
                  value={qf.value}
                  onChange={(e) => updateQuickFact(idx, "value", e.target.value)}
                  placeholder="รายละเอียดข้อมูล"
                  className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => removeQuickFact(idx)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Glossary Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white/70 text-sm font-medium">คำศัพท์ประจำบทความ (Glossary)</label>
            <button
              type="button"
              onClick={addGlossaryEntry}
              className="text-xs px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-all border border-amber-400/20"
            >
              + เพิ่มคำศัพท์
            </button>
          </div>
          <div className="space-y-2">
            {glossary.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <input
                  type="text"
                  value={g.term}
                  onChange={(e) => updateGlossaryEntry(idx, "term", e.target.value)}
                  placeholder="คำศัพท์"
                  className="w-1/3 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white font-medium"
                />
                <input
                  type="text"
                  value={g.definition}
                  onChange={(e) => updateGlossaryEntry(idx, "definition", e.target.value)}
                  placeholder="คำอธิบาย/ความหมาย"
                  className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => removeGlossaryEntry(idx)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Image Management Section */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/5 space-y-4">
        <h3 className="text-base font-semibold text-white">รูปภาพหน้าปกบทความ (Featured Image)</h3>
        <ImageUploader value={imageUrl} onChange={setImageUrl} folder="article-images" />

        {imageUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-white/50 text-xs mb-1">เครดิตรูปภาพ (Image Credit)</label>
              <input type="text" value={imageCredit} onChange={(e) => setImageCredit(e.target.value)} placeholder="เช่น สำนักหอจดหมายเหตุ" className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white" />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">ช่างภาพ (Photographer)</label>
              <input type="text" value={imagePhotographer} onChange={(e) => setImagePhotographer(e.target.value)} placeholder="ชื่อช่างภาพ" className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white" />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">URL แหล่งที่มา (Source URL)</label>
              <input type="text" value={imageSourceUrl} onChange={(e) => setImageSourceUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">ปีที่ถ่ายภาพ (Year)</label>
              <input type="text" value={imageYear} onChange={(e) => setImageYear(e.target.value)} placeholder="เช่น พ.ศ. 2500 หรือ ค.ศ. 1957" className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Tags Input Area */}
      <div>
        <label className="block text-white/70 text-sm mb-2">แท็ก (Tags) <span className="text-white/30 text-xs">(กด Enter หรือลูกน้ำเพื่อเพิ่ม)</span></label>
        <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-lg min-h-[46px] items-center">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 bg-white/10 text-white/90 px-2.5 py-1 rounded-md text-sm">
              #{tag}
              <button onClick={() => removeTag(tag)} className="text-white/40 hover:text-white"><X size={12} /></button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length === 0 ? "เพิ่มแท็ก..." : ""}
            className="flex-1 bg-transparent border-none text-white focus:outline-none px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Excerpt Summary Textarea */}
      <div>
        <label className="block text-white/70 text-sm mb-2">คำโปรยย่อ (Excerpt) <span className="text-white/30 text-xs">(เว้นว่างไว้ถ้าระบบดึงข้อมูลอัตโนมัติ)</span></label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="สรุปย่อบทความสั้น ๆ ประดับหน้าพรีวิว..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 min-h-[80px] text-sm leading-relaxed"
        />
      </div>

      {/* Social Media Content Planning */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/5 space-y-4">
        <h3 className="text-base font-semibold text-white">เนื้อหาสำหรับโซเชียลมีเดีย (Social Summaries)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs mb-1.5">คำโปรยแบบสั้น (Short Snippet - เช่น Twitter/X)</label>
            <textarea value={shortExcerpt} onChange={(e) => setShortExcerpt(e.target.value)} placeholder="คำโปรยความยาวไม่เกิน 150-280 ตัวอักษร..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white min-h-[70px]" />
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1.5">คำโปรยแบบยาว (Long Snippet - เช่น Threads/Facebook)</label>
            <textarea value={longExcerpt} onChange={(e) => setLongExcerpt(e.target.value)} placeholder="สรุปเนื้อหาสำคัญ สำหรับการเขียนแชร์ลงกระทู้หรือคอมมูนิตี้..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white min-h-[70px]" />
          </div>
        </div>
        <div>
          <label className="block text-white/60 text-xs mb-1.5">แคปชั่นโซเชียลหลัก (Social Caption พร้อมใช้งาน)</label>
          <textarea value={socialCaption} onChange={(e) => setSocialCaption(e.target.value)} placeholder="วางโครงแคปชั่นพร้อมแฮชแท็กที่เตรียมไว้แชร์..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white min-h-[60px]" />
        </div>
      </div>

      {/* ======== Google Schema Markup (JSON-LD Structured Data) ======== */}
      <details className="group rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-white/60 hover:text-white/80 text-sm font-medium transition-colors select-none">
          <svg className={`w-3.5 h-3.5 group-open:rotate-180 transition-transform text-white/40`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          Google Schema Markup (JSON-LD Structured Data)
          {googleSchemaMarkup.trim() && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 ml-1">
              ✓ มีข้อมูล
            </span>
          )}
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-white/30 text-xs leading-relaxed">
            กำหนด Schema.org JSON-LD ที่กำหนดเองสำหรับบทความนี้
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
                setGoogleSchemaMarkup(JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  "headline": title || "ชื่อบทความ",
                  "description": excerpt || "",
                  "datePublished": publishedAt,
                  "author": {
                    "@type": "Person",
                    "name": author || "ทีมงาน UnFake News"
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
                try {
                  const parsed = JSON.parse(googleSchemaMarkup);
                  setGoogleSchemaMarkup(JSON.stringify(parsed, null, 2));
                } catch {
                  // ignore
                }
              }}
              className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 border border-white/10 transition-colors"
            >
              ✨ จัดรูปแบบ JSON
            </button>
          </div>

          {googleSchemaError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300/80 text-xs">
              <AlertCircle size={12} />
              {googleSchemaError}
            </div>
          )}

          <div className="relative">
            <textarea
              value={googleSchemaMarkup}
              onChange={(e) => setGoogleSchemaMarkup(e.target.value)}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (!val) {
                  setGoogleSchemaError(null);
                  return;
                }
                try {
                  JSON.parse(val);
                  setGoogleSchemaError(null);
                } catch {
                  setGoogleSchemaError("❌ JSON ไม่ถูกต้อง — มีข้อผิดพลาดที่ syntax");
                }
              }}
              placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "...",\n  ...\n}`}
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

      {/* Save Actions and Permissions Area */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <label className="block text-white/50 text-sm whitespace-nowrap">สถานะบทความ:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none"
          >
            <option value="draft">📥 ร่าง (Draft)</option>
            {canReview && <option value="pending_review">👀 รอการตรวจทาน (Pending Review)</option>}
            {canPublish && <option value="published">🚀 เผยแพร่ทันที (Published)</option>}
            <option value="hidden">🔒 ซ่อนไว้ (Hidden)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={handleSave}
            disabled={saving || translating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>

        {/* 🔄 Progress bar — แสดงขณะกำลังแปล */}
        {translateProgress && (
          <div className="mt-3 p-3 rounded-lg border text-sm flex items-center gap-2 animate-fadeIn
            ${translateProgress.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300'
            : translateProgress.startsWith('⚠️') ? 'bg-amber-500/10 border-amber-400/20 text-amber-300'
            : translateProgress.startsWith('⏹️') ? 'bg-red-500/10 border-red-400/20 text-red-300'
            : 'bg-blue-500/10 border-blue-400/20 text-blue-300'}"
          >
            {translating && !translateProgress.startsWith('✅') && !translateProgress.startsWith('⚠️') && !translateProgress.startsWith('⏹️') ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-current rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </>
            ) : (
              <span className="flex-shrink-0">{translateProgress.startsWith('✅') ? '✓' : '!'}</span>
            )}
            <span className="flex-1">{translateProgress}</span>
          </div>
        )}
      </div>

      {/* Image Insertion Modal UI Overlay */}
      {showInsertModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-semibold text-white">
                {insertAsGallery ? "⚙️ ตั้งค่าแกลเลอรีรูปภาพ" : "⚙️ ตั้งค่ารูปภาพที่แทรก"}
              </h3>
              <button onClick={() => setShowInsertModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {insertFileNames.map((name, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-mono truncate max-w-[70%]">{name}</span>
                    <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded">รูปที่ {i + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/50 text-xs mb-1">คำอธิบายรูปภาพ (Alt Text)</label>
                      <input
                        type="text"
                        value={insertAltTexts[i] || ""}
                        onChange={(e) => {
                          const updated = [...insertAltTexts];
                          updated[i] = e.target.value;
                          setInsertAltTexts(updated);
                        }}
                        placeholder="สำหรับ Screen Reader / SEO"
                        className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded text-xs text-white"
                      />
                    </div>
                    {!insertAsGallery && (
                      <div>
                        <label className="block text-white/50 text-xs mb-1">จัดวาง (Alignment)</label>
                        <select
                          value={insertAlignments[i]}
                          onChange={(e) => {
                            const updated = [...insertAlignments];
                            updated[i] = e.target.value as any;
                            setInsertAlignments(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded text-xs text-white"
                        >
                          <option value="center">ตรงกลาง (กว้างเต็ม)</option>
                          <option value="left">ชิดซ้าย (Float Left)</option>
                          <option value="right">ชิดขวา (Float Right)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {!insertAsGallery && (
                    <div>
                      <label className="block text-white/50 text-xs mb-1">คำบรรยายใต้ภาพ (Caption - ตัวเอียงใต้รูป)</label>
                      <input
                        type="text"
                        value={insertCaptions[i] || ""}
                        onChange={(e) => {
                          const updated = [...insertCaptions];
                          updated[i] = e.target.value;
                          setInsertCaptions(updated);
                        }}
                        placeholder="พิมพ์อธิบายใต้รูปภาพย่อ..."
                        className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() => setShowInsertModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-all text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={insertImages}
                className="px-5 py-2 rounded-lg bg-amber-400 text-[#0a1628] font-semibold hover:bg-amber-300 transition-all text-sm"
              >
                แทรกลงในเนื้อหา ({insertFileNames.length} รูป)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleEditor;