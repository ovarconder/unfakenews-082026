// ============================================================
// Siam Heritage - Gemini AI Translation Service
// ============================================================
// Using Gemini API for SiamHeritage encyclopedia translations
//
// Architecture:
// - Single API Key from Google AI Studio
// - Gemini 2.0 Flash: High-volume, low-cost tasks (Tier 1 & Tier 2 summary)
// - Gemini 2.0 Pro: High-quality, on-demand content translation (Tier 2 full)
//
// Two separate system prompts:
//   1. CONTENT PROMPT — for main article body (title, excerpts, content)
//   2. STRUCTURED DATA PROMPT — for glossary, quick_facts, entity values
// ============================================================

import type { Locale } from "./locales";
import { LOCALE_NAMES } from "./locales";

// ============================================================
// Gemini API Configuration
// ============================================================

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Model names
// NOTE:
//  - gemini-2.0-flash / gemini-2.0-pro ถูก Google shut down แล้ว (404)
//  - gemini-2.5-flash / gemini-2.5-pro "no longer available to new users" (404)
//  - gemini-3.5-flash ยังใช้ได้ แต่ Google แนะนำให้ย้ายไป gemini-3.6-flash
// โมเดลที่ผู้ใช้ใหม่ใช้ได้ชัวร์คือกลุ่ม Gemini 3.x → ใช้ gemini-3.6-flash
const GEMINI_FLASH_MODEL = "gemini-3.6-flash"; // High-volume, low-cost (อัปเกรดจาก 3.5 ตามที่ Google แนะนำ)
const GEMINI_PRO_MODEL = "gemini-3.1-pro-preview"; // High-quality, on-demand

// max output tokens ที่โมเดลรองรับ
// Gemini 3.x เป็น "thinking model" — `thoughtSignature` กิน tokens ไปมหาศาล
// ถ้า maxOutputTokens น้อยเกินไป (เช่น 8192) → output text ถูกตัดกลาง (MAX_TOKENS)
// → JSON แตก → parse fail → error 500
// ใช้ค่า 65536 (outputTokenLimit ของ gemini-3.6-flash) เพื่อกันการ truncate
const GEMINI_MAX_OUTPUT_TOKENS = 65536;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set in environment variables.\n" +
      "Please add it to your .env.local file:\n" +
      'GEMINI_API_KEY=your-google-ai-studio-api-key'
    );
  }
  return key;
}

// ============================================================
// Model Selection Strategy
// ============================================================

export type GeminiModel = "flash" | "pro";

export function getModelForTask(task: {
  isFullContent: boolean;
  isTier2Lazy: boolean;
}): GeminiModel {
  if (task.isTier2Lazy) {
    // Tier 2 JIT (Just-in-Time) uses Pro for highest quality
    return "pro";
  }
  if (task.isFullContent) {
    // Tier 1 full content uses Flash (cost-effective)
    return "flash";
  }
  // Tier 2 summary uses Flash (cost-effective)
  return "flash";
}

function getModelName(model: GeminiModel): string {
  return model === "pro" ? GEMINI_PRO_MODEL : GEMINI_FLASH_MODEL;
}

// ============================================================
// Get target language name in English (for [TARGET_LANGUAGE] variable)
// ============================================================

function getTargetLanguage(locale: Locale): string {
  return LOCALE_NAMES[locale]?.english || "English";
}

// ============================================================
// System Prompt 1: Main Content (Title, Excerpts, Content)
// ============================================================

export function buildContentSystemPrompt(targetLocale: Locale): string {
  const targetLanguage = getTargetLanguage(targetLocale);

  return `You are an expert translator and cultural mediator specializing in Thai heritage, arts, and history for the "Siam Heritage" encyclopedia project.
Your task is to translate the provided Thai content into the target language specified in the variable: [${targetLanguage}].

### Translation Guidelines:
1. **Tone & Style:** Maintain an encyclopedic, respectful, and engaging tone appropriate for a cultural heritage platform.
2. **Natural Flow:** Avoid literal word-for-word translation. Prioritize the natural idiom, syntax, and flow of the [${targetLanguage}] while preserving the original historical and cultural context accurately.
3. **Cultural Terms:** For specific Thai cultural terms (e.g., ประเพณีลอยกระทง, ศาลา, เครื่องถม), use the accepted international term, transliterate with a brief explanation, or use the closest cultural equivalent that makes sense to a native speaker of [${targetLanguage}].
4. **Consistency:** Ensure the tone is consistent across the Title, Excerpt, and Full Content.

### Input Data (JSON format):
{
  "title": "[THAI_TITLE]",
  "short_excerpt": "[THAI_SHORT_EXCERPT]",
  "long_excerpt": "[THAI_LONG_EXCERPT]",
  "content": "[THAI_FULL_CONTENT]"
}

### Expected Output:
Return ONLY a valid JSON object matching the input structure, translated into [${targetLanguage}]. Do not include any markdown formatting (like \`\`\`json) or extra text outside the JSON.
{
  "title": "...",
  "short_excerpt": "...",
  "long_excerpt": "...",
  "content": "..."
}`;
}

// ============================================================
// System Prompt 2: Structured Data (Glossary, Quick Facts, Entity Values)
// ============================================================

export function buildStructuredDataSystemPrompt(targetLocale: Locale): string {
  const targetLanguage = getTargetLanguage(targetLocale);

  return `You are a precise data localization engine for the "Siam Heritage" encyclopedia. Your task is to translate and localize structured data from Thai into [${targetLanguage}].

### Strict Instructions for Structured Data:
1. **JSON Keys:** NEVER translate or modify the JSON keys or Entity identifiers. Translate ONLY the values.
2. **Glossary Terms:** Translate technical cultural terms, historical eras (e.g., อยุธยา, รัตนโกสินทร์), and proper nouns using globally recognized historical standards in [${targetLanguage}]. Do not attempt to visually translate or create new terms.
3. **Quick Facts:** Keep the translated facts concise, sharp, and factually accurate. Ensure units or formatting (e.g., dates, eras) align with the standards of [${targetLanguage}].
4. **No Hallucinations:** If a cultural term has a strict official translation (e.g., Royal Institute of Thailand standard), use it. Do not add descriptive fluff to the values.

### Input Data (JSON format):
{
  "glossary": [
    { "term": "THAI_TERM_1", "context": "CONTEXT_OR_DEFINITION_1" },
    { "term": "THAI_TERM_2", "context": "CONTEXT_OR_DEFINITION_2" }
  ],
  "quick_facts": {
    "fact_key_1": "THAI_VALUE_1",
    "fact_key_2": "THAI_VALUE_2"
  },
  "entity_values": {
    "entity_key_1": "THAI_VALUE_3",
    "entity_key_2": "THAI_VALUE_4"
  }
}

### Expected Output:
Return ONLY the translated JSON structure. Keep keys exactly as they are in the input. Translate only the values and term definitions into [${targetLanguage}]. No conversational text or markdown wrappers.`;
}

// ============================================================
// Gemini API Response Types
// ============================================================

interface GeminiContentResponse {
  title: string;
  short_excerpt: string;
  long_excerpt: string;
  content: string;
}

interface GeminiStructuredResponse {
  glossary?: Array<{ term: string; context: string }>;
  quick_facts?: Record<string, string>;
  entity_values?: Record<string, string>;
}

interface GeminiAPIResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  promptFeedback?: any;
}

// ============================================================
// Helper: Extract pure JSON from Gemini response
// ============================================================
// Gemini 3.x บางครั้งตอบเป็น markdown code block (```json ... ```) หรือมี
// text เกริ่น/ต่อท้าย หรือ JSON ถูกตัดกลางคัน — helper นี้ช่วยดึง & balance ให้
// ============================================================

function extractJSONText(rawText: string): string | null {
  if (!rawText) return null;
  const text = rawText.trim();

  // 1) ถอด markdown fenced code block ก่อน (```json ... ``` / ``` ... ```)
  let candidate = text.replace(/```[a-zA-Z]*\s*([\s\S]*?)```/g, "$1").trim();

  // 2) หาตำแหน่งหลักของ JSON (object { ... } หรือ array [ ... ])
  //    ก่อนอื่นลอง object { ... } (กรณีทั่วไป เช่น title/content/structured data)
  const firstOpenBrace = candidate.indexOf("{");
  const lastCloseBrace = candidate.lastIndexOf("}");
  if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
    const sub = candidate.slice(firstOpenBrace, lastCloseBrace + 1);
    const balancedObj = tryBalanceBraces(sub);
    if (balancedObj !== null) return balancedObj;
  }

  // 3) กรณี array [ ... ] — เช่น translateTags ที่ Gemini คืนเป็น array of strings
  const firstOpenBracket = candidate.indexOf("[");
  const lastCloseBracket = candidate.lastIndexOf("]");
  if (firstOpenBracket !== -1 && lastCloseBracket !== -1 && lastCloseBracket > firstOpenBracket) {
    const sub = candidate.slice(firstOpenBracket, lastCloseBracket + 1);
    const balancedArr = tryBalanceBrackets(sub);
    if (balancedArr !== null) return balancedArr;
  }

  // 4) check curly brace balance — ถ้าขาดปิด (ถูกตัด) → ดึงคู่ที่สมบูรณ์สุด
  const balanced = tryBalanceBraces(candidate);
  if (balanced !== null) return balanced;

  // 5) fallback: ลอง regex เดิม (คู่ { กับ } หลังสุด หรือคู่ [ กับ ] )
  const jsonObjMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjMatch) return jsonObjMatch[0];
  const jsonArrMatch = text.match(/\[[\s\S]*\]/);
  if (jsonArrMatch) return jsonArrMatch[0];

  return null;
}

/** นับ depth ของ { } โดยข้ามสตริง (handle escaped quotes) แล้วดึงคู่ที่ balance สมบูรณ์ */
function tryBalanceBraces(candidate: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return candidate.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** นับ depth ของ [ ] โดยข้ามสตริง (handle escaped quotes) แล้วดึงคู่ที่ balance สมบูรณ์ */
function tryBalanceBrackets(candidate: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        return candidate.slice(start, i + 1);
      }
    }
  }
  return null;
}

// ============================================================
// Call Gemini API with response_mime_type: application/json
// ============================================================

async function callGeminiAPI<T>(
  systemPrompt: string,
  userPrompt: string,
  model: GeminiModel
): Promise<T> {
  const modelName = getModelName(model);

  // retry สูงสุด 3 ครั้ง — กัน response ถูกตัด (MAX_TOKENS) / JSON แตก เป็นครั้งคราว
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Gemini] Calling ${modelName}... (attempt ${attempt}/${MAX_ATTEMPTS})`);

    const url = `${GEMINI_BASE_URL}/models/${modelName}:generateContent?key=${getApiKey()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n===== CONTENT TO TRANSLATE =====\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Low temperature for consistent, factual translations
          topP: 0.95,
          topK: 40,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, // ★ 65536 ไม่ใช่ 8192 — ป้องกัน truncate
          response_mime_type: "application/json", // Force JSON output
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error (${response.status}) [${modelName}]: ${errorText}`
      );
    }

    const data: GeminiAPIResponse = await response.json();

    // ★ ตรวจสอบ finishReason — ถ้าเป็น MAX_TOKENS แปลว่าถูกตัด → retry
    const finishReason = (data as any)?.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      console.warn(`[Gemini] ${modelName} returned MAX_TOKENS (truncated) on attempt ${attempt}. Retrying...`);
      // ให้ retry ใหม่โดยไม่ต้องรอ — ระบบ try/parse ด้านล่างจะจับ JSON แตกแล้ว retry ด้วย
      if (attempt < MAX_ATTEMPTS) {
        // ต่อนิดหน่อยก่อน retry
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
      // ถ้าเป็น attempt สุดท้ายจบ loop ไปตรวจ parse ด้านล่าง (จะทำให้ error ชัดขึ้น)
    }

    // Extract text from response — รองรับหลายรูปแบบของ part (Gemini 3.x)
    let text: string | undefined;
    const parts = data?.candidates?.[0]?.content?.parts;
    if (parts && parts.length > 0) {
      text = parts.find((p) => typeof (p as any).text === "string" && (p as any).text.length > 0)?.text as string | undefined;
    }

    if (!text) {
      console.error("[Gemini] Empty response. Full payload:", JSON.stringify(data).slice(0, 1000));
      if (attempt < MAX_ATTEMPTS) continue;
      throw new Error(
        `Gemini API returned empty response for model ${modelName}`
      );
    }

    // Hardened JSON extraction — รองรับ markdown wrapper, trailing text, truncated JSON
    const rawJson = extractJSONText(text);
    if (!rawJson) {
      console.error(`[Gemini] No JSON found. Raw response (first 800 chars):`, text.slice(0, 800));
      if (attempt < MAX_ATTEMPTS) continue;
      throw new Error(
        `Could not parse JSON from Gemini response for model ${modelName}`
      );
    }

    try {
      return JSON.parse(rawJson) as T;
    } catch (parseErr) {
      console.error(`[Gemini] JSON parse error on attempt ${attempt}. Raw JSON string:`, rawJson.slice(0, 500));
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue; // retry ใหม่
      }
      throw new Error(
        `Failed to parse Gemini response as JSON for model ${modelName} (after ${MAX_ATTEMPTS} attempts)`
      );
    }
  }

  throw new Error(
    `Failed to parse Gemini response as JSON for model ${modelName} (after ${MAX_ATTEMPTS} attempts)`
  );
}

// ============================================================
// Public API: Translate Article (Title + Excerpts + Content)
// Uses the CONTENT PROMPT
// ============================================================

export interface TranslateOptions {
  title: string;
  shortExcerpt: string;
  longExcerpt: string;
  content?: string;
  includeFullContent: boolean;
  isTier2Lazy?: boolean;
}

export async function translateArticleContent(
  targetLocale: Locale,
  options: TranslateOptions
): Promise<GeminiContentResponse> {
  const { title, shortExcerpt, longExcerpt, content, includeFullContent, isTier2Lazy } = options;

  const model = getModelForTask({
    isFullContent: includeFullContent,
    isTier2Lazy: isTier2Lazy ?? false,
  });

  const systemPrompt = buildContentSystemPrompt(targetLocale);

  const promptObj: Record<string, string> = {
    title,
    short_excerpt: shortExcerpt,
    long_excerpt: longExcerpt,
  };
  if (includeFullContent && content) {
    promptObj.content = content;
  }

  const userPrompt = JSON.stringify(promptObj, null, 2);

  console.log(
    `[Gemini] Translating article content to ${targetLocale} using ${getModelName(model)} (model: ${model})`
  );

  const result = await callGeminiAPI<GeminiContentResponse>(systemPrompt, userPrompt, model);
  return result;
}

// ============================================================
// Public API: Translate Structured Data (Glossary, Quick Facts, Entity Values)
// Uses the STRUCTURED DATA PROMPT
// ============================================================

export interface StructuredDataInput {
  glossary?: Array<{ term: string; context: string }>;
  quick_facts?: Record<string, string>;
  entity_values?: Record<string, string>;
}

export async function translateStructuredData(
  targetLocale: Locale,
  data: StructuredDataInput
): Promise<GeminiStructuredResponse> {
  // Always use Flash for structured data (low complexity, cheap)
  const systemPrompt = buildStructuredDataSystemPrompt(targetLocale);
  const userPrompt = JSON.stringify(data, null, 2);

  console.log(
    `[Gemini] Translating structured data to ${targetLocale} using ${GEMINI_FLASH_MODEL}`
  );

  const result = await callGeminiAPI<GeminiStructuredResponse>(
    systemPrompt,
    userPrompt,
    "flash"
  );

  // 🌟 คำแปล structured data บางครั้ง Gemini คืน field เป็น null/undefined
  //   (เช่น glossary ว่าง หรือ quick_facts ไม่มี) → normalize เป็นค่าที่ปลอดภัย
  const safeResult: GeminiStructuredResponse = {
    glossary: Array.isArray(result?.glossary) ? result.glossary : undefined,
    quick_facts: result?.quick_facts && typeof result.quick_facts === "object"
      ? { ...result.quick_facts }
      : undefined,
    entity_values: result?.entity_values && typeof result.entity_values === "object"
      ? { ...result.entity_values }
      : undefined,
  };

  return safeResult;
}

// ============================================================
// Legacy: Translate Article (Title + Excerpt + Content) — old interface
// Kept for backward compatibility, maps to new functions internally
// ============================================================

export async function translateArticle(
  targetLocale: Locale,
  options: { title: string; excerpt: string; content?: string; includeFullContent: boolean; isTier2Lazy?: boolean }
): Promise<{ title: string; excerpt: string; content?: string }> {
  const { title, excerpt, content, includeFullContent } = options;

  const result = await translateArticleContent(targetLocale, {
    title,
    shortExcerpt: excerpt,
    longExcerpt: excerpt,
    content,
    includeFullContent,
  });

  return {
    title: result.title,
    excerpt: result.short_excerpt || result.long_excerpt || excerpt,
    content: result.content,
  };
}

// ============================================================
// Public API: Translate Content Only (for Tier 2 JIT / Lazy Load)
// Uses Gemini Pro for highest quality
// ============================================================

export async function translateContentOnly(
  targetLocale: Locale,
  content: string
): Promise<{ content: string }> {
  const targetLanguage = getTargetLanguage(targetLocale);

  // Always use Pro for on-demand content translation
  const model: GeminiModel = "pro";
  const modelName = getModelName(model);

  const systemPrompt = `You are an expert translator and cultural mediator specializing in Thai heritage, arts, and history for the "Siam Heritage" encyclopedia project.
Your task is to translate the provided Thai content into the target language specified in the variable: [${targetLanguage}].

### Translation Guidelines:
1. **Tone & Style:** Maintain an encyclopedic, respectful, and engaging tone appropriate for a cultural heritage platform.
2. **Natural Flow:** Avoid literal word-for-word translation. Prioritize the natural idiom, syntax, and flow of the [${targetLanguage}] while preserving the original historical and cultural context accurately.
3. **Cultural Terms:** For specific Thai cultural terms (e.g., ประเพณีลอยกระทง, ศาลา, เครื่องถม), use the accepted international term, transliterate with a brief explanation, or use the closest cultural equivalent that makes sense to a native speaker of [${targetLanguage}].

### Input:
${content}

### Expected Output:
Return ONLY a valid JSON object:
{ "content": "translated content with markdown preserved" }`;

  const userPrompt = content;

  console.log(`[Gemini] Translating content only to ${targetLocale} using ${modelName}`);

  const result = await callGeminiAPI<{ content: string }>(systemPrompt, userPrompt, model);

  return {
    content: result.content ?? content,
  };
}

// ============================================================
// Public API: Translate Image Alt Texts
// Full translation for all locales — for Google Images + AI indexing
// ============================================================

export async function translateImageAlts(
  targetLocale: Locale,
  alts: Record<string, string>
): Promise<Record<string, string>> {
  if (Object.keys(alts).length === 0) return {};

  const targetLanguage = getTargetLanguage(targetLocale);

  const systemPrompt = `You are an expert translator specializing in Thai heritage imagery for Google Image Search and AI indexing.
Your task is to translate image alt texts from Thai into ${targetLanguage}.

### Strict Instructions:
1. Keep the "image key" (identifier like image URL or filename) EXACTLY as-is.
2. Translate ONLY the alt text values — make them descriptive, keyword-rich for Google Image Search.
3. Preserve proper nouns (place names, person names) using accepted international spellings.
4. Add relevant cultural context if the original Thai alt text is too brief.

### Input (JSON):
{ "image_key_1": "THAI_ALT_TEXT_1", "image_key_2": "THAI_ALT_TEXT_2" }

### Expected Output:
Return ONLY JSON with same keys, translated values: { "image_key_1": "TRANSLATED_ALT", ... }`;

  const userPrompt = JSON.stringify(alts, null, 2);

  console.log(`[Gemini] Translating image alts to ${targetLanguage} using ${GEMINI_FLASH_MODEL}`);

  const result = await callGeminiAPI<Record<string, string>>(systemPrompt, userPrompt, "flash");
  return result;
}

// ============================================================
// Public API: Translate Tags/Keywords
// - English tags: pass through as-is
// - Thai tags: translate -> deduplicate against existing English tags
// ============================================================

export async function translateTags(
  targetLocale: Locale,
  tags: string[],
  existingEnglishTags?: string[]
): Promise<string[]> {
  if (!tags || tags.length === 0) return [];

  const targetLanguage = getTargetLanguage(targetLocale);

  // Separate English vs Thai tags
  const thaiRegex = /[\u0E00-\u0E7F]/;
  const thaiTags = tags.filter(t => thaiRegex.test(t));
  const englishTags = tags.filter(t => !thaiRegex.test(t));

  // English tags pass through as-is
  const resultTags = [...englishTags];

  // If no Thai tags, return just English ones (deduplicated)
  if (thaiTags.length === 0) {
    return [...new Set(resultTags)];
  }

  const systemPrompt = `You are a tag/keyword localization engine.
Translate the following Thai tags into ${targetLanguage}.

### Rules:
1. Translate Thai cultural keywords appropriately (e.g., "\u0e41\u0e2b\u0e23\u0e48\u0e07\u0e1c\u0e32\u0e44\u0e2b\u0e21" -> "Phrae", "\u0E42\u0E02\u0E19\u0E44\u0E17\u0E22" -> "Khon Thai")
2. Return ONLY a JSON array of strings: ["translated_tag_1", "translated_tag_2"]
3. No additional text, no markdown wrappers.

### Input:
${JSON.stringify(thaiTags)}`;

  const userPrompt = JSON.stringify(thaiTags);

  try {
    console.log(`[Gemini] Translating ${thaiTags.length} Thai tags to ${targetLanguage} using ${GEMINI_FLASH_MODEL}`);
    const translated = await callGeminiAPI<unknown>(systemPrompt, userPrompt, "flash");

    // 🌟 Gemini บางครั้งคืนเป็น object { "tags": [...] } หรือ { "translated_tags": [...] }
    //   แทนที่จะเป็น array ตรง ๆ — normalize ให้เป็น array ของ string ก่อน spread
    let translatedArray: string[] = [];
    if (Array.isArray(translated)) {
      translatedArray = translated.filter((x): x is string => typeof x === "string");
    } else if (translated && typeof translated === "object") {
      const obj = translated as Record<string, unknown>;
      // ไล่ดูทุก key ที่ value เป็น array ของ string
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val) && val.every((x) => typeof x === "string")) {
          translatedArray = val as string[];
          break;
        } else if (typeof val === "string") {
          translatedArray.push(val);
        }
      }
    }

    // ถ้ายังได้ array ว่าง (Gemini คืน not parseable) → fallback
    if (translatedArray.length === 0 && thaiTags.length > 0) {
      console.warn("[Gemini] Tag translation returned empty/unexpected shape, using original Thai tags:", translated);
      return [...new Set([...resultTags, ...thaiTags])];
    }

    // Merge with existing English tags + deduplicate
    const allTranslated = [...resultTags, ...translatedArray];
    return [...new Set(allTranslated)];
  } catch (err) {
    // Fallback: return original tags if translation fails
    console.warn("[Gemini] Tag translation failed, returning original tags:", err);
    return [...new Set(resultTags)];
  }
}

// ============================================================
// Public API: Translate Google Schema Markup (JSON-LD)
// ============================================================
// แปลเฉพาะ "ข้อความ" ในค่าต่างๆ ของ JSON-LD ให้เป็น targetLanguage
// - คง key / @type / โครงสร้าง nesting ไว้เป๊ะ
// - ไม่แปล URL / email / ตัวเลข / boolean
// - guard null / empty / URL → ข้าม ไม่เรียก Gemini
// ============================================================

/** ตรวจว่า string เป็น URL/link หรือไม่ */
function isLikelyUrl(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return /^(https?:\/\/|www\.|mailto:|tel:|ftp:\/\/|data:|blob:|\/\/)/.test(trimmed);
}

/** Key ใน schema ที่เป็น URL/ลิงก์ — ควรข้ามการแปลค่า */
const SCHEMA_URL_KEYS = /^(url|image|images|thumbnailUrl|contentUrl|sameAs|mainEntityOfPage|isPartOf|screenshot|videourl|caption|embedurl|citation|source|creator|author|publisher|provider)$/i;

/**
 * แก้ path ของ URL ภายในเว็บให้ชี้เป็นภาษา-specific
 * เช่น  https://site.com/th/articles/slug  →  https://site.com/en/articles/slug
 * หรือ   /th/articles/slug                →  /en/articles/slug
 *
 * - แก้เฉพาะส่วน `/th/...` (หรือ `/{srcLocale}/...`) ที่เป็น path ภาษาไทย/เดิม
 * - ไม่แตะ URL ภายนอก (wikidata, official site, image CDN ฯลฯ)
 * - ถ้า URL ยังไม่มี path ภาษา → ปล่อยตามเดิม
 */
function rewriteInternalUrlPath(
  url: string,
  targetLocale: string
): string {
  if (!url || typeof url !== "string") return url;

  // แยก origin กับ path (รองรับทั้ง absolute และ relative)
  let origin = "";
  let path = url;
  try {
    // ถ้าเป็น absolute URL → แยก origin ออก
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      origin = u.origin;
      path = u.pathname + (u.search || "") + (u.hash || "");
    }
  } catch {
    // ไม่ใช่ URL ที่ parse ได้ → คืนเดิม
    return url;
  }

  // แทนที่ path ภาษาไทย/ภาษาแรก (เช่น /th/articles/, /th/...) → /{locale}/...
  // ใช้ regex ขับเคลื่อน ไม่ให้พลาด ครอบคลุม /th/, /en/, /ja/, /ko/ ...
  const langPathPattern = /^\/([a-z]{2})\//i;
  let newPath = path;
  if (langPathPattern.test(path)) {
    newPath = path.replace(langPathPattern, `/${targetLocale}/`);
  }
  // กรณี path ไม่มีภาษา เช่น /articles/slug (แค่ /en/) → เพิ่มภาษาเข้าไป (แต่ข้ามถ้าเป็น
  // path ที่ไม่ใช่บทความ เช่น /images/... static)

  return origin ? origin + newPath : newPath;
}

/**
 * เดิน recursive ผ่าน schema ทั้งหมด และแก้ URL path ให้เป็นภาษา-specific
 * - เข้าถึง field ที่เป็น URL ทั้ง absolute และ relative
 * - ใช้สำหรับ URL ภายในเว็บ (มี /th/ /en/ /ja/ ฯลฯ)
 */
function localizeSchemaUrls(
  node: unknown,
  targetLocale: string
): void {
  if (Array.isArray(node)) {
    node.forEach((item) => localizeSchemaUrls(item, targetLocale));
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      // ถ้า value เป็น string และดูเหมือน URL/link ภายในเว็บ → เปลี่ยน path ภาษา
      if (typeof val === "string") {
        const v = val.trim();
        // ดูเฉพาะ URL ที่มี /{lang}/ ใน path (ภาษา 2 ตัว) หรือ relative path ของบทความ
        if (
          (v.startsWith("/") || /^https?:\/\//i.test(v)) &&
          (/\/(th|en|zh|ja|ko|es|pt|fr|de|it|ru|hi|ms|vi|ar|tr)\//i.test(v) ||
            /\/articles\//i.test(v))
        ) {
          obj[key] = rewriteInternalUrlPath(v, targetLocale);
          continue;
        }
      }
      // recurse ลึกต่อไป (object/array)
      localizeSchemaUrls(val, targetLocale);
    }
  }
}

/**
 * แปล Google Schema Markup (JSON-LD) เป็น targetLocale
 * - เดิน recursive ผ่าน object/array
 * - แปลเฉพาะค่า string ที่ไม่ใช่ URL และไม่ใช่ key @ / URL / ตัวเลข
 * - ถ้าค่าเป็น null / empty string → ตัดทิ้ง ไม่ส่งไปแปล
 * - input null/empty → คืน null (ไม่แปล)
 */
export async function translateGoogleSchemaMarkup(
  targetLocale: Locale,
  schema: Record<string, unknown> | null | undefined
): Promise<Record<string, unknown> | null> {
  const targetLanguage = getTargetLanguage(targetLocale);

  // Guard: input ไม่มีค่า → ไม่แปล
  if (!schema || Object.keys(schema).length === 0) return null;
  if (typeof schema !== "object" || Array.isArray(schema)) return null;

  // 1) เดิน recursive เก็บข้อความที่ควรแปล (ไม่ใช่ URL / ตัวเลข / empty)
  const stringsToTranslate: { path: string; value: string }[] = [];

  const urlLikeKeys = SCHEMA_URL_KEYS;

  function collectStrings(node: unknown, path: string): void {
    if (Array.isArray(node)) {
      node.forEach((item, idx) => collectStrings(item, `${path}[${idx}]`));
      return;
    }
    if (node && typeof node === "object") {
      const obj = node as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const childKey = path ? `${path}.${key}` : key;
        // ข้าม key ที่เป็น URL/link (เช่น image, url, sameAs) — ไม่แปลค่ามัน
        if (urlLikeKeys.test(key)) continue;
        if (val === null || val === undefined || val === "") continue; // guard null/empty
        collectStrings(val, childKey);
      }
      return;
    }
    // primitive
    if (typeof node === "string") {
      const s = (node as string).trim();
      if (s && !isLikelyUrl(s) && !/^[\d\s.,%\-:/-]+$/.test(s)) {
        // ไม่ใช่ URL และไม่ใช่ตัวเลข/อักขระพิเศษ → ค่าข้อความที่ควรแปล
        stringsToTranslate.push({ path, value: s });
      }
    }
  }

  collectStrings(schema, "");

  // 2) ถ้าไม่มีข้อความต้องแปล → คืน schema เดิม (ไม่เรียก Gemini)
  //    แต่ยังต้องแก้อ URL path ให้เป็นภาษา-specific
  if (stringsToTranslate.length === 0) {
    const noTranslateResult = JSON.parse(JSON.stringify(schema));
    localizeSchemaUrls(noTranslateResult, targetLocale);
    return noTranslateResult;
  }

  const valuesToSend = stringsToTranslate.map((s) => s.value);

  const systemPrompt = `You are a precise data localization engine for the "Siam Heritage" encyclopedia JSON-LD structured data (Google Schema.org).
Translate ONLY the natural-language text values into ${targetLanguage}.
Keep ALL structural keys, @type, URLs, numeric values, and boolean values EXACTLY as-is.
Do NOT change the JSON key names, the array/object nesting structure, or the number of items.

### Input (JSON):
{ "values": ["value_1_to_translate", "value_2_to_translate", ...] }

### Expected Output:
Return ONLY a JSON object of the same shape with translated values:
{ "values": ["translated_value_1", "translated_value_2", ...] }
Keep the order and count exactly the same as input. No markdown wrappers or extra text.`;

  const userPrompt = JSON.stringify({ values: valuesToSend });

  try {
    console.log(`[Gemini] Translating ${valuesToSend.length} Google Schema text values to ${targetLanguage} using ${GEMINI_FLASH_MODEL}`);
    const translated = await callGeminiAPI<{ values?: unknown }>(systemPrompt, userPrompt, "flash");

    const tv = translated?.values;
    const translatedValues = Array.isArray(tv) ? tv as unknown[] : [];

    if (translatedValues.length !== stringsToTranslate.length) {
      console.warn(`[Gemini] Google Schema translation count mismatch (got ${translatedValues.length}, expected ${stringsToTranslate.length}), using original values`);
    }

    // map ผลลัพธ์กลับเข้าตำแหน่งเดิม (ถ้าขาด/เกิน ใช้ค่าเดิม)
    const translatedByPath: Record<string, string> = {};
    stringsToTranslate.forEach((s, idx) => {
      const cand = translatedValues[idx];
      translatedByPath[s.path] = (typeof cand === "string" && cand.trim()) ? cand.trim() : s.value;
    });

    const result: Record<string, unknown> = JSON.parse(JSON.stringify(schema));

    function applyTranslated(node: unknown, path: string): void {
      if (Array.isArray(node)) {
        node.forEach((item, idx) => applyTranslated(item, `${path}[${idx}]`));
        return;
      }
      if (node && typeof node === "object") {
        const obj = node as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const childKey = path ? `${path}.${key}` : key;
          // ข้าม key ที่เป็น URL/link + guard null
          if (urlLikeKeys.test(key)) continue;
          if (val === null || val === undefined) continue;
          if (translatedByPath[childKey] !== undefined && typeof val === "string") {
            obj[key] = translatedByPath[childKey];
          } else {
            applyTranslated(val, childKey);
          }
        }
      }
    }

    applyTranslated(result, "");

    // 🌍 แก้ path ของ URL ภายใน schema ให้ชี้ภาษา-specific (/th/ → /{locale}/)
    localizeSchemaUrls(result, targetLocale);

    return result;
  } catch (err) {
    console.warn("[Gemini] Google Schema translation failed, returning original:", err);
    const fallback = JSON.parse(JSON.stringify(schema));
    // ยังแก้ URL path ให้ถูกภาษาแม้การแปลล้มเหลว
    localizeSchemaUrls(fallback, targetLocale);
    return fallback;
  }
}
