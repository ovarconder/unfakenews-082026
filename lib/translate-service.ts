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
const GEMINI_FLASH_MODEL = "gemini-2.0-flash"; // High-volume, low-cost
const GEMINI_PRO_MODEL = "gemini-2.0-pro"; // High-quality, on-demand

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
// Call Gemini API with response_mime_type: application/json
// ============================================================

async function callGeminiAPI<T>(
  systemPrompt: string,
  userPrompt: string,
  model: GeminiModel
): Promise<T> {
  const modelName = getModelName(model);
  const url = `${GEMINI_BASE_URL}/models/${modelName}:generateContent?key=${getApiKey()}`;

  console.log(`[Gemini] Calling ${modelName}...`);

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
        maxOutputTokens: 8192,
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

  // Extract text from response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      `Gemini API returned empty response for model ${modelName}`
    );
  }

  // With response_mime_type: application/json, the response should be clean JSON.
  // Still handle possible markdown wrapping just in case.
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`[Gemini] Raw response (first 500 chars):`, text.slice(0, 500));
    throw new Error(
      `Could not parse JSON from Gemini response for model ${modelName}`
    );
  }

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (parseErr) {
    console.error(`[Gemini] JSON parse error. Raw JSON string:`, jsonMatch[0].slice(0, 300));
    throw new Error(
      `Failed to parse Gemini response as JSON for model ${modelName}`
    );
  }
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
  return result;
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
    const translatedArray = await callGeminiAPI<string[]>(systemPrompt, userPrompt, "flash");

    // Merge with existing English tags + deduplicate
    const allTranslated = [...resultTags, ...translatedArray];
    return [...new Set(allTranslated)];
  } catch (err) {
    // Fallback: return original tags if translation fails
    console.warn("[Gemini] Tag translation failed, returning original tags:", err);
    return [...new Set(resultTags)];
  }
}
