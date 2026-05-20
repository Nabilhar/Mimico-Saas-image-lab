// lib/category-selector.ts

import type { PostType } from './mode-templates';

/**
 * Categories per post type. These rotate to ensure variety across posts.
 * Post types not in this map (e.g., Promotion / offer) don't have rotation.
 */
export const POST_TYPE_CATEGORIES: Partial<Record<PostType, string[]>> = {
  "Tip of the Day": [
    "Technique",
    "Timing",
    "Selection",
    "Care / storage",
    "Pairing / combining",
    "Troubleshooting",
    "Tools / setup",
  ],

  "Behind the scenes": [
    "Early prep",
    "Active craft",
    "Wait / passive time",
    "The fix",
    "The discard",
    "Repetition",
    "End of day",
  ],

  "Community moment": [
    "Pre-opening / setup",
    "Peak / rush",
    "Lull / quiet",
    "Solo customer",
    "Positive interraction with customer",
    "Weather-shaped",
  ],

  "Local event / news": [
    "Preparation pattern",
    "Decision pattern",
    "Space shift",
    "Repeated question",
    "Timing observation",
    "Season / weather impact",
  ],
  // "Promotion / offer" intentionally omitted — user-driven, no rotation
};

/**
 * Select a category for the given post type, avoiding recently used ones.
 * Returns null for post types without rotation (Promotion).
 *
 * If all categories have been used recently, resets and picks from the full pool.
 */
export function selectCategory(
  postType: PostType,
  recentCategories: string[] = []
): string | null {
  const categories = POST_TYPE_CATEGORIES[postType];
  if (!categories || categories.length === 0) return null;

  const available = categories.filter(c => !recentCategories.includes(c));
  const pool = available.length > 0 ? available : categories;

  return pool[Math.floor(Math.random() * pool.length)];
}