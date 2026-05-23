// lib/post-history.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostType } from './mode-templates';

/**
 * Fetch recent post history for variety tracking.
 * Returns both recent categories (for rotation) and summaries (for topic dedup).
 */
export async function getRecentPostHistory(
  supabase: SupabaseClient,
  business_id: string,
  business_name: string,
  postType: PostType,
  options: {
    summaryLimit?: number;    // How many summaries to fetch (default 5)
    categoryLimit?: number;   // How many categories to track for rotation (default 3)
  } = {}
): Promise<{ categories: string[]; summaries: string[] }> {
  const { summaryLimit = 5, categoryLimit = 3 } = options;

  const { data, error } = await supabase
    .from('community_posts')
    .select('content_category, content_summary, created_at')
    .eq('business_id', business_id)
    .eq('business_name', business_name.trim())
    .eq('post_type', postType)
    .order('created_at', { ascending: false })
    .limit(summaryLimit);

  if (error) {
    console.error('[post-history] Failed to fetch history:', error.message);
    return { categories: [], summaries: [] };
  }
  if (!data) return { categories: [], summaries: [] };

  const categories = data
    .slice(0, categoryLimit)
    .map(d => d.content_category)
    .filter(Boolean) as string[];

  const summaries = data
    .map(d => d.content_summary)
    .filter(Boolean) as string[];

  return { categories, summaries };
}

/**
 * Offerings from recent posts, most recent first (deduped, stable order).
 * Used to rotate which offering is shown in the next prompt.
 */
export async function getRecentOfferingsInOrder(
  supabase: SupabaseClient,
  business_id: string,
  business_name: string,
  postLimit: number = 5
): Promise<string[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('offerings_referenced')
    .eq('business_id', business_id)
    .eq('business_name', business_name.trim())
    .order('created_at', { ascending: false })
    .limit(postLimit);

  if (error || !data) return [];

  const ordered: string[] = [];
  for (const row of data) {
    for (const raw of row.offerings_referenced || []) {
      const name = typeof raw === 'string' ? raw.trim() : '';
      if (
        name &&
        !ordered.some((o) => o.toLowerCase() === name.toLowerCase())
      ) {
        ordered.push(name);
      }
    }
  }
  return ordered;
}

/** @deprecated Use getRecentOfferingsInOrder — kept for callers that only need a flat set */
export async function getRecentOfferings(
  supabase: SupabaseClient,
  business_id: string,
  business_name: string,
  limit: number = 5
): Promise<string[]> {
  return getRecentOfferingsInOrder(supabase, business_id, business_name, limit);
}

/**
 * Format an array of summaries into the bullet list the prompt expects.
 */
export function formatRecentSummaries(summaries: string[]): string {
  if (summaries.length === 0) {
    return "None yet — this is one of the first posts for this mode.";
  }
  return summaries.map(s => `- "${s}"`).join("\n");
}