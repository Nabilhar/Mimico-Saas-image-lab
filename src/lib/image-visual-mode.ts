// lib/image-visual-mode.ts
//
// Maps business category → visual mode for multimodal image generation.
// Used by image-mode-templates-multimodal.ts to select the right hero strategy.
//
// "product"    → business produces a photographable output (food, item, vehicle, renovation)
//                Hero: the finished result of the technique/process
//
// "experience" → the "product" is a state, service, or session (wellness, fitness, beauty, advice)
//                Hero: the tools/setup arranged with craft precision in the workspace

export type VisualMode = "product" | "experience";

const CATEGORY_VISUAL_MODE: Record<string, VisualMode> = {
  // PRODUCT — the camera can show the finished result without showing a person
  "Food & Beverage":        "product",
  "Retail":                 "product",
  "Automotive":             "product",
  "Home Services":          "product",
  "Real Estate & Property": "product",
  "Events & Hospitality":   "product",
  "Trades & Industrial":    "product",

  // EXPERIENCE — the result is invisible or lives on a person's body/face
  "Health & Wellness":      "experience",
  "Beauty & Personal Care": "experience",
  "Fitness & Recreation":   "experience",
  "Professional Services":  "experience",
  "Education & Childcare":  "experience",
  "Pets":                   "experience",
  "Technology":             "experience",
};

/**
 * Returns the visual mode for a given business category.
 * Falls back to "product" for unknown categories (safer default — 
 * a product shot is always usable, a tools-only shot might confuse).
 */
export function getVisualMode(category: string): VisualMode {
  return CATEGORY_VISUAL_MODE[category] ?? "product";
}
