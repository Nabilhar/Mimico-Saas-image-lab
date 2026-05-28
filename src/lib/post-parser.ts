// lib/post-parser.ts

import type { PostType } from './mode-templates';

export interface ParsedPost {
  content: string;
  hashtags: string[];
  content_category: string | null;
  content_summary: string | null;
  offerings_referenced: string[];
  // Mode-specific
  event_referenced?: string;
  hook_used?: 'user_provided' | 'system_generated';
}

/**
 * Maps post type to the labels we expect in the AI output.
 * Promotion has no category — it's user-driven, not rotation-driven.
 */
const OUTPUT_LABELS: Record<PostType, { category: string; summary: string }> = {
  "Myth-busting":       { category: "MYTH_CATEGORY",   summary: "MYTH_TOPIC" },
  "Tip of the Day":     { category: "TIP_CATEGORY",   summary: "TIP_TOPIC" },
  "Behind the scenes":  { category: "MOMENT_TYPE",    summary: "MOMENT_SUMMARY" },
  "Community moment":   { category: "SCENE_TYPE",     summary: "SCENE_SUMMARY" },
  "Local event / news": { category: "SCENE_TYPE",     summary: "OBSERVATION_SUMMARY" },
  "Promotion / offer":  { category: "",               summary: "OPENING_OBSERVATION" },
};

/**
 * Extract a "LABEL: value" line from the AI response.
 * Case-insensitive label match. Returns trimmed value or null.
 */
function extractField(text: string, label: string): string | null {
  if (!label) return null;
  const regex = new RegExp(`^${label}\\s*:\\s*(.+?)$`, 'mi');
  return text.match(regex)?.[1]?.trim() ?? null;
}

/**
 * Parse an offerings line into an array of trimmed strings.
 * Handles "none", empty values, bracketed lists, and comma-separated.
 */
function parseOfferings(raw: string | null): string[] {
  if (!raw) return [];
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === 'none' || cleaned === '[]' || cleaned === '') return [];
  const stripped = raw.replace(/^\[|\]$/g, '');
  return stripped.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse an AI-generated post response into structured fields.
 *
 * Designed for soft failures — missing fields return null/empty rather
 * than throwing. The caller decides whether to log warnings or fail.
 *
 * Note: Rotated content_category and offerings_referenced are chosen
 * server-side in the generate route; this parser is used for summaries,
 * post body, and mode-specific fields (event, hook, etc.).
 */
export function parseGeneratedPost(
  rawResponse: string,
  postType: PostType,
): ParsedPost {
  const labels = OUTPUT_LABELS[postType];

  // Metadata fields
  const content_category = extractField(rawResponse, labels.category);
  const content_summary = extractField(rawResponse, labels.summary);
  const offerings_referenced = parseOfferings(
    extractField(rawResponse, 'OFFERINGS_REFERENCED')
  );

  // Post body — everything after "POST:"
  // Falls back to the whole response if POST: marker is missing
  let postMatch = rawResponse.match(/POST:\s*([\s\S]+?)$/i);

  if (!postMatch) {
    // Legacy fallback — handles <<<POST_BEGIN>>>...<<<POST_END>>>
    postMatch = rawResponse.match(/<<<POST_BEGIN>>>\s*([\s\S]+?)\s*<<<POST_END>>>/i);
  }
  
  const fullPost = postMatch?.[1]?.trim() ?? rawResponse;

  // Separate hashtags from body
  const hashtags = fullPost.match(/#\w+/g) ?? [];
  const content = fullPost.replace(/#\w+/g, '').trim();

  const result: ParsedPost = {
    content,
    hashtags,
    content_category,
    content_summary,
    offerings_referenced,
  };

  // Mode-specific fields
  if (postType === 'Local event / news') {
    const eventRef = extractField(rawResponse, 'EVENT_REFERENCED');
    if (eventRef) result.event_referenced = eventRef;
  }

  if (postType === 'Promotion / offer') {
    const hookUsed = extractField(rawResponse, 'HOOK_USED');
    if (hookUsed === 'user_provided' || hookUsed === 'system_generated') {
      result.hook_used = hookUsed;
    }
  }

  return result;
}

/**
 * Validate offerings against the known list. Returns matched offerings
 * normalized to their short name (text before em dash).
 *
 * Brand discovery stores offerings as "Short Name — long description".
 * The AI extracts just the short name. This function reconciles them
 * and stores the canonical short name for cleaner variety tracking.
 */
export function validateOfferings(
  extracted: string[],
  knownOfferings: string[]
): string[] {
  // Normalize known offerings to their short names (text before em dash)
  const knownShortNames = knownOfferings.map(o => {
    const splitIndex = o.indexOf('—');
    return splitIndex !== -1 ? o.substring(0, splitIndex).trim() : o.trim();
  });

  const result: string[] = [];
  for (const extractedItem of extracted) {
    const normalized = extractedItem.toLowerCase().trim();
    // Find a known short name that matches (either direction substring)
    const match = knownShortNames.find(known => {
      const knownLower = known.toLowerCase();
      return (
        knownLower === normalized ||
        knownLower.includes(normalized) ||
        normalized.includes(knownLower)
      );
    });
    if (match) {
      result.push(match); // Store the canonical short name from the known list
    }
  }

  return [...new Set(result)]; // dedupe
}