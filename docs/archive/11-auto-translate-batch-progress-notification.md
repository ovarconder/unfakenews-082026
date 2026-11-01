# Auto-Translate, Batch Translate, Progress & Notification System

> วันที่อัปเดต: 2025-06-01  
> หัวข้อ: Translation Auto-Save, Batch Translate, Progress UI, Notification Bell

---

## 📋 สารบัญ

1. [Architecture Overview](#1-architecture-overview)
2. [Auto-Translate หลัง Save (Article Editor)](#2-auto-translate-หลัง-save-article-editor)
3. [Batch Translate (Existing Articles)](#3-batch-translate-existing-articles)
4. [JIT Content Translation (Tier 2)](#4-jit-content-translation-tier-2)
5. [Progress & Toast System](#5-progress--toast-system)
6. [Notification System (Bell + History)](#6-notification-system-bell--history)
7. [Translation Dashboard (3 View Modes)](#7-translation-dashboard-3-view-modes)
8. [File Reference](#8-file-reference)
9. [Important Notes](#9-important-notes)

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         SYSTEM FLOW                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  WRITE FLOW                    READ FLOW                           │
│  ──────────                    ────────                            │
│                                                                    │
│  Article Editor          →   Article Detail                        │
│  ┌─────────────┐             ┌──────────────┐                     │
│  │ Save clicked │             │ User visits  │                     │
│  │ ↓ Save +     │             │ article page │                     │
│  │ Auto-Translate│            │ ↓ Check      │                     │
│  │ ↓ Add notif  │             │ translation   │                     │
│  └─────────────┘             │ status        │                     │
│                              │ ↓ If          │                     │
│  Admin Dashboard             │ "summary_only" │                     │
│  ┌──────────────────┐        │ ↓ Fetch JIT   │                     │
│  │ Translations:     │        │ via /api/     │                     │
│  │ - By Article     │        │ translate-    │                     │
│  │ - By Language    │        │ content/[slug] │                     │
│  │ - By Category    │        │ ↓ Cache to DB │                     │
│  │ Batch: All       │        │ ↓ Render      │                     │
│  │ Manual: Per slug │        └──────────────┘                     │
│  └──────────────────┘                                             │
│                                                                    │
│  NOTIFICATION SYSTEM                                               │
│  ┌──────────────────────────────────────┐                         │
│  │ addNotification() → sessionStorage   │                         │
│  │ → Bell Badge (sidebar, unread count) │                         │
│  │ → Dropdown (5 recent, hover)        │                         │
│  │ → /admin/notifications (history)     │                         │
│  └──────────────────────────────────────┘                         │
└────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Tier 1** | Full auto-translate (all fields including content) |
| **Tier 2** | Head/SEO only (title, excerpt, tags, entities) + JIT content |
| **JIT** | Just-in-Time — translates content on first read via `/api/translate-content/[slug]` |
| **Dirty Fields** | Only fields that changed since last save get re-translated |
| **AbortController** | Prevents duplicate translation calls when user clicks save rapidly |
| **Race condition** | Server-side: API completes even if client navigates away |
| **Persistent Log** | `sessionStorage` — survives page navigation, shared across tabs |

---

## 2. Auto-Translate หลัง Save (Article Editor)

**File:** `components/admin/article-editor.tsx`

### Flow

```
handleSave()
  ├── onSave() → บันทึกบทความลง DB
  ├── setSuccess(true)
  ├── setTranslating(true)
  ├── GET /api/settings/tiers → locale config
  ├── ตรวจสอบ dirtyFields (เทียบ initialData กับ current values)
  │   ├── title, short_excerpt, long_excerpt, content,
  │   ├── tags, entity_name, quick_facts, glossary
  ├── Loop ทุก locale (sequential เพื่อติดตาม progress)
  │   ├── Tier 1 → ส่ง dirtyFields ทั้งหมด
  │   ├── Tier 2 → ส่งเฉพาะ non-content fields
  │   └── POST /api/translate-new
  ├── setTranslateProgress("กำลังแปล: 3/14 (JA)")
  ├── done → addNotification({ type: "translation_done", ... })
  └── setTimeout (5s) → setTranslating(false)
```

### AbortController

```typescript
const translateAbort = new AbortController();

// ถ้า component unmount (เปลี่ยนหน้า)
useEffect(() => {
  return () => translateAbort.abort();
}, []);

// ใน loop translation
if (translateAbort.signal.aborted) break;
```

### Dirty Fields Logic

```typescript
const dirtyFields: string[] = [];
if (initialData) {
  if (initialData.originalTitle !== title) dirtyFields.push("title");
  if ((initialData.shortExcerpt || "") !== shortExcerpt.trim()) dirtyFields.push("short_excerpt");
  if ((initialData.longExcerpt || "") !== longExcerpt.trim()) dirtyFields.push("long_excerpt");
  if ((initialData.originalContent || "") !== content) dirtyFields.push("content");
  if (JSON.stringify(initialData.tags || []) !== JSON.stringify(tags)) dirtyFields.push("tags");
  if ((initialData.entityName || "") !== entityName.trim()) dirtyFields.push("entity_name");
  if (JSON.stringify(initialData.quickFacts || []) !== JSON.stringify(quickFacts)) dirtyFields.push("quick_facts");
  if (JSON.stringify(initialData.glossary || []) !== JSON.stringify(glossary)) dirtyFields.push("glossary");
}

// undefined = แปลทุกอย่าง (กรณีสร้างบทความใหม่ ไม่มี initialData)
const fieldsForLocale = dirtyFields.length > 0
  ? (tier === "2" ? dirtyFields.filter(f => f !== "content") : dirtyFields)
  : undefined;
```

---

## 3. Batch Translate (Existing Articles)

มี 3 จุดที่สามารถ Batch Translate ได้:

### 3.1 ที่หน้า `/admin/articles`

**File:** `app/admin/articles/article-list-client.tsx`

```tsx
<button onClick={batchTranslateAll}> <!-- ปุ่ม "แปลทั้งหมด" ที่หัวตาราง -->
```

**พฤติกรรม:**  
- Sequential (ทีละบทความ) — ป้องกัน API rate limit  
- แสดง progress bar  
- สร้าง notification เมื่อเสร็จ

### 3.2 ที่หน้า `/admin/translations`

**File:** `components/admin/translation-dashboard.tsx`

```tsx
// ปุ่ม "Batch Translate" ใน toolbar
<button onClick={batchTranslateAll}>
  <Languages size={12} />
  แปลทั้งหมด
</button>
```

**พฤติกรรม:**  
- เฉพาะบทความที่ `overallStatus !== "complete"`  
- ใช้ `buildArticleStatus()` เพื่อเช็คสถานะล่าสุดจาก DB  
- Loop ทุกภาษา → POST /api/translate-new  
- สร้าง log + notification

### 3.3 ที่หน้า `/admin/translations` (By Language View)

```tsx
// ปุ่ม "แปลทั้งหมด" ต่อภาษา
<button onClick={() => localeArticles.forEach(a => triggerTranslate(a, locale))}>
  แปลทั้งหมด
</button>
```

---

## 4. JIT Content Translation (Tier 2)

**File:** `components/articles/article-detail.tsx`

### Flow

```tsx
useEffect(() => {
  if (locale === "th") return;
  if (!article) return;
  
  // ถ้า translationStatus เป็น "summary_only" หรือ "pending"
  if ((article.translationStatus === "summary_only" || article.translationStatus === "pending") && article.content) {
    let cancelled = false;
    
    fetch(`/api/translate-content/${article.slug}?locale=${locale}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success && data.content) {
          setStateArticle(prev => prev ? {
            ...prev,
            content: data.content,
            translationStatus: "complete",
          } : null);
        }
      })
      .catch(err => console.warn("[JIT] Failed:", err))
      .finally(() => { if (!cancelled) setTranslating(false); });
    
    return () => { cancelled = true; };
  }
}, [article?.slug, locale, article?.translationStatus]);
```

### Server-side (API)

**File:** `app/api/translate-content/[slug]/route.ts`

```
GET /api/translate-content/{slug}?locale=en

Response:
{
  success: true,
  content: "Translated content...",
  cached: true|false,   // true = เคยแปลแล้ว
  fromTier2: true,       // JIT translation
  translatingInProgress: false,
  imageAlts?: { ... }    // แปล alt text ของรูปภาพ
}
```

---

## 5. Progress & Toast System

**File:** `components/admin/translation-toast.tsx`

### Toast Types

| Status | Icon | Color | Duration | Action |
|--------|------|-------|----------|--------|
| `translating` | Spinner | Blue | จนเสร็จ | แสดง progress bar |
| `done` | Check | Green | 8 วิ | ✅ แปลครบ 14 ภาษา |
| `error` | Alert | Red | 8 วิ | ❌ แปลไม่สำเร็จ |

### UI Components

```
┌──────────────────────────────────────────────┐
│  🔄  กำลังแปลภาษา                [X]         │
│      "ชื่อบทความ..."                          │
│      ┌──────────────────────────┐            │
│      │ กำลังแปล: 3/14 (EN)    3/14 │            │
│      └████████░░░░░░░░░░░░░░░░░┘            │
│      ดูประวัติการแปล →                        │
└──────────────────────────────────────────────┘
```

### Persistent History (Bottom-left)

```
┌──────────────────────────────────────────────┐
│  🕐  ประวัติการแปล                    [ล้าง][X]│
├──────────────────────────────────────────────┤
│  ✅ แปล "..."            Auto  วันที่         │
│     ✓3 ✗1             EN ZH JA               │
│                                             │
│  ✅ แปล "..."            Batch วันที่          │
│     ✓12                ทั้งหมด 14 ภาษา        │
└──────────────────────────────────────────────┘
```

### Cross-component Communication

ใช้ `CustomEvent` เพื่อส่ง translation state จาก Dashboard → Toast:

```typescript
// TranslationDashboard -> dispatch
window.dispatchEvent(new CustomEvent("translation-progress", {
  detail: { title, slug, progress, doneCount, totalCount, status }
}));

// Parent page -> listen
useEffect(() => {
  const handler = (e: CustomEvent) => setActiveTranslation(e.detail);
  window.addEventListener("translation-progress", handler);
  return () => window.removeEventListener("translation-progress", handler);
}, []);
```

---

## 6. Notification System (Bell + History)

### Store

**File:** `lib/notification-store.ts`

```typescript
interface AppNotification {
  id: string;              // unique ID
  timestamp: string;       // ISO date
  type: "translation_done" | "translation_error" | "translation_progress" | "article_published" | "system";
  title: string;
  message: string;
  slug?: string;           // link to article
  read: boolean;           // unread = true by default
  category?: string;       // for filtering
}
```

**Storage:** `sessionStorage` (key: `siam_notifications`)  
**Max entries:** 200 (newest first)  
**Real-time sync:** `window.dispatchEvent(new CustomEvent("notification-update"))`

### API

| Function | Description |
|----------|-------------|
| `getNotifications()` | Get all notifications |
| `addNotification(notif)` | Add new notification (top of list) |
| `markAsRead(id)` | Mark single as read |
| `markAllAsRead()` | Mark all as read |
| `clearNotifications()` | Clear all |
| `getUnreadCount()` | Count unread |
| `getRecentNotifications(limit)` | Get latest N |

### Bell Component

**File:** `components/admin/notification-bell.tsx`

```
Sidebar (ใต้ Logo)
  ┌──────────────────────┐
  │  🔔 (3)  การแจ้งเตือน  │  ← Bell Icon + Badge
  └──────────────────────┘
          ↓ Hover (300ms delay)
  ┌──────────────────────────────┐
  │  🔔 การแจ้งเตือน    [อ่านทั้งหมด]│
  ├──────────────────────────────┤
  │  ◉ ✅ แปล "..."              │  ← Unread = amber bg + dot
  │      เสร็จ 14 ภาษา           │
  │      5 นาทีที่แล้ว   🔵 auto │
  ├──────────────────────────────┤
  │  ◯ ❌ แปล "..." ล้มเหลว      │  ← Read = dim
  │      ...                     │
  ├──────────────────────────────┤
  │  → ดูทั้งหมด                  │
  └──────────────────────────────┘
```

### History Page

**File:** `app/admin/notifications/page.tsx`

**URL:** `/admin/notifications`

| Feature | Description |
|---------|-------------|
| Filter | All / Unread / Read / Translation Done / Translation Error |
| Unread indicator | Amber left border + dot |
| Type icon | ✅ CheckCircle (done), ❌ AlertCircle (error), 🔄 Globe (progress) |
| Time | Relative ("5 นาทีที่แล้ว") + absolute on hover |
| Link | "ดูบทความ →" link to article editor |
| Mark as read | Single button + "อ่านทั้งหมด" |
| Clear | "ล้างทั้งหมด" with confirmation |

---

## 7. Translation Dashboard (3 View Modes)

**File:** `components/admin/translation-dashboard.tsx`

**URL:** `/admin/translations`

### View Mode: By Article

```
┌──────────────────────────────────────────────┐
│  📄 บทความ  🌐 ภาษา  🗂️ หมวดหมู่  [ค้นหา...]     │
├──────────────────────────────────────────────┤
│  🟢🟢🟡⚪⚪⚪⚪⚪+6  ชื่อบทความ        [แปล][▼] │
│  /slug · หมวดหมู่                             │
├──────────────────────────────────────────────┤
│  [Expanded]                                   │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐              │
│  │EN │ │ZH │ │JA │ │KO │ │VI │              │
│  │T1 │ │T1 │ │T1 │ │T2 │ │T2 │              │
│  │Full│ │Full│ │Sum│ │Pen│ │Pen│              │
│  └───┘ └───┘ └───┘ └───┘ └───┘              │
└──────────────────────────────────────────────┘
```

### View Mode: By Language

```
┌──────────────────────────────────────────────┐
│  🌐 English (English)        Tier 1          │
│  ████████████░░░░░░░  12/20 บทความ  [แปลทั้งหมด]│
├──────────────────────────────────────────────┤
│  ◉ ชื่อบทความ 1                    [แปล]     │
│  ◯ ชื่อบทความ 2                    [แปล]     │
│  ◉ ชื่อบทความ 3                    [แปล]     │
│  ...                                         │
└──────────────────────────────────────────────┘
```

### View Mode: By Category

```
┌──────────────────────────────────────────────┐
│  🗂️ มรดกไทย (Thai Heritage)     5 บทความ   │
├──────────────────────────────────────────────┤
│  ชื่อบทความ 1      🟢🟢🟡⚪⚪  [แปล]        │
│  ชื่อบทความ 2      🟢🟢🟢🟢🟢  [แปล]        │
│  ชื่อบทความ 3      ⚪⚪⚪⚪⚪  [แปล]        │
│  ดูทั้งหมด 5 บทความ →                         │
└──────────────────────────────────────────────┘
```

---

## 8. File Reference

### New Files

| File | Size | Purpose |
|------|------|---------|
| `lib/notification-store.ts` | ~4KB | Notification CRUD + sessionStorage |
| `components/admin/notification-bell.tsx` | ~6KB | Bell icon + badge + dropdown |
| `app/admin/notifications/page.tsx` | ~8KB | Full history page with filters |
| `components/admin/translation-dashboard.tsx` | ~20KB | 3-view dashboard + batch + progress |
| `components/admin/translation-toast.tsx` | ~6KB | Toast + persistent history panel |
| `lib/translation-log-store.ts` | ~3KB | Translation log CRUD + sessionStorage |
| `app/api/admin/translations/status/route.ts` | ~3KB | API: get translation status per locale |

### Modified Files

| File | Changes |
|------|---------|
| `components/admin/admin-sidebar.tsx` | Added NotificationBell + Nav item |
| `components/admin/article-editor.tsx` | Auto-translate + Dirty Fields + AbortController + AddNotification |
| `components/articles/article-detail.tsx` | JIT auto-load + Markdown bold/italic fix |
| `app/admin/articles/article-list-client.tsx` | Batch translate + Notification replacing alert() |
| `app/admin/translations/page.tsx` | Rewritten: uses TranslationDashboard + Toast |

---

## 9. Important Notes

### 9.1 Race Condition Prevention

| Issue | Solution |
|-------|----------|
| User clicks save rapidly | `AbortController` — aborts previous fetch |
| User navigates away while translating | Server API completes anyway; notification saved to sessionStorage |
| User opens multiple tabs | sessionStorage is per-tab, but notification-update event syncs |
| User clicks batch translate + single translate | `translating` Set prevents concurrent operations |

### 9.2 Storage Limits

| Store | Location | Max | Cleanup |
|-------|----------|-----|---------|
| Notification | `sessionStorage` | 200 | Oldest dropped |
| Translation Log | `sessionStorage` | 50 | Oldest dropped |

### 9.3 beforeunload Protection

```typescript
useEffect(() => {
  if (translating.size === 0) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "กำลังแปลบทความอยู่ หากออกตอนนี้งานแปลอาจไม่สมบูรณ์";
    return e.returnValue;
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [translating.size]);
```

### 9.4 Future Improvements

- [ ] **Toast position**: Make configurable (bottom-right vs top-right)
- [ ] **Sound notification**: Optional sound on translation complete
- [ ] **Email notification**: Send email for long-running batch jobs
- [ ] **Real-time progress**: Use Server-Sent Events or WebSocket
- [ ] **Cross-tab sync**: Use BroadcastChannel API instead of polling
- [ ] **Sound notification**: Optional chime on translation complete
- [ ] **Mark read on scroll**: Auto-mark visible notifications as read

---

*End of document*

---

## 附录: Font System & Article Title Style (อัปเดต 2025-06-01)

### Font Stack (ลำดับความสำคัญ)

| ภาษา | Heading (h1-h6) | Body |
|------|-----------------|------|
| **ไทย** | `Prompt` → sans-serif | `Noto Sans Thai` → sans-serif |
| **อังกฤษ/อื่นๆ** | `Prompt` → `Playfair Display` → Georgia → serif | `Noto Serif` → Georgia → serif |

> **เปลี่ยนเมื่อ 2025-06-01:** Heading ทั้งหมดเปลี่ยนจาก `Playfair Display` เป็น `Prompt` เป็นค่าเริ่มต้น  
> `Playfair Display` ยังคงเป็น fallback สำหรับภาษาอังกฤษ

### Article Hero Title — centralized CSS class

**File:** `app/globals.css`

```css
.article-hero-title {
  font-family: var(--font-prompt), "Prompt", var(--font-playfair), Georgia, "Times New Roman", serif;
  font-size: clamp(1.5rem, 5vw, 2.5rem);   /* responsive: 24px → 40px */
  line-height: 1.4;
  font-weight: bold;
  color: white;
  max-width: 56rem;
  margin-bottom: 1.5rem;
}

[lang="th"] .article-hero-title {
  font-family: var(--font-prompt), "Prompt", sans-serif;
}
```

**ใช้ใน component:**
```tsx
<h1 className="article-hero-title">{article.title}</h1>
```

**ข้อดี:**
- แก้ style ที่ `globals.css` ที่เดียว
- Responsive auto ด้วย `clamp()`
- Mobile: `1.5rem` (24px) → Desktop: `2.5rem` (40px)
- Font family ถูกต้องตามภาษา

### ไฟล์ที่เปลี่ยน `font-serif` → `font-prompt`

| File | Elements |
|------|----------|
| `components/articles/article-card.tsx` | h3 titles (featured & regular) |
| `components/articles/articles-page.tsx` | h1 page title |
| `components/articles/excerpt-section.tsx` | excerpt paragraph |
| `components/articles/wiki-hero-section.tsx` | h1 hero title (ใช้ `.article-hero-title`) |
| `components/home/home-page.tsx` | h2 section titles |
| `components/contact/contact-page.tsx` | h1 page title |
| `components/about/about-page.tsx` | h1, h2, h3 titles |
| `components/microsite/microsite-article-detail.tsx` | h2, h3 titles |
| `components/microsite/microsite-home-content.tsx` | h2, h3 titles |
| `app/microsite/[slug]/[lang]/articles/page.tsx` | h1, h3 titles |
| `app/microsite/[slug]/[lang]/about/page.tsx` | h1 title |
| `app/[lang]/privacy/page.tsx` | h1 title |
