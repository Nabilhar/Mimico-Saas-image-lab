import type { PostType } from "@/lib/mode-templates";

/** Keys match `businesses.zones` and profile photo labels */
export type ZoneKey = "entrance" | "customer_space" | "work_space";

export const ZONE_LABELS: Record<ZoneKey, string> = {
  entrance: "Entrance",
  customer_space: "Customer area",
  work_space: "Work area",
};

/**
 * Which zone(s) to inject into the image architect prompt per post type.
 * Edit this map to test combinations — one zone = focused context, array = multiple.
 */
export const POST_TYPE_ZONE_FOCUS: Record<PostType, ZoneKey | ZoneKey[]> = {
  "Behind the scenes": "work_space",
  "Community moment": "customer_space",
  "Local event / news": "entrance",
  "Promotion / offer": ["customer_space", "entrance"],
  "Tip of the Day": "work_space",
  "Myth-busting": "work_space",
};

export function normalizeZoneFocus(
  focus: ZoneKey | ZoneKey[] | undefined
): ZoneKey[] {
  if (!focus) return [];
  return Array.isArray(focus) ? focus : [focus];
}

/**
 * Resolve which zones to show. Request `zoneFocus` overrides the config (for testing).
 */
export function resolveZoneFocus(
  postType: string,
  override?: ZoneKey | ZoneKey[]
): ZoneKey[] {
  const fromOverride = normalizeZoneFocus(override);
  if (fromOverride.length > 0) return fromOverride;

  const configured = POST_TYPE_ZONE_FOCUS[postType as PostType];
  return normalizeZoneFocus(configured);
}
