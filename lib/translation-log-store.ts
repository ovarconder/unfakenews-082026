// ============================================================
// Translation Log Store — Client-side persistent log
// ============================================================
// เก็บประวัติการแปลใน sessionStorage เพื่อให้ user ดูย้อนหลังได้
// แม้จะเปลี่ยนหน้าไปแล้วก็ตาม

const STORAGE_KEY = "siam_translation_log";

export interface TranslationLogEntry {
  id: string;
  timestamp: string;
  slug: string;
  title: string;
  locale: string;
  tier: "1" | "2";
  status: "success" | "error" | "in_progress";
  message?: string;
  dirtyFields?: string[];
}

export interface TranslationBatchLog {
  id: string;
  timestamp: string;
  type: "auto_save" | "manual" | "batch_all" | "single_article";
  slug?: string;
  title?: string;
  locales: string[];
  results: {
    locale: string;
    status: "success" | "error" | "skipped";
    message?: string;
  }[];
  summary: { success: number; error: number; skipped: number };
}

// ============================================================
// Read log entries
// ============================================================
export function getTranslationLog(): TranslationBatchLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ============================================================
// Add a batch log entry
// ============================================================
export function addTranslationLog(entry: TranslationBatchLog): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getTranslationLog();
    existing.unshift(entry); // newest first
    // Keep max 50 entries
    const trimmed = existing.slice(0, 50);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage may be full, just ignore
  }
}

// ============================================================
// Clear log
// ============================================================
export function clearTranslationLog(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ============================================================
// Get latest batch log for a specific slug
// ============================================================
export function getLatestTranslationForSlug(slug: string): TranslationBatchLog | undefined {
  const logs = getTranslationLog();
  return logs.find(log => log.slug === slug);
}
