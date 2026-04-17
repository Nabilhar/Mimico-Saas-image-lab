// src/lib/frameworks.ts

export type Framework = "PAS" | "BAB" | "AIDA";
export type PurchaseType = "pain-driven" | "lifestyle" | "considered-purchase";

export const BUSINESS_ARCHETYPES: Record<string, PurchaseType> = {
  "Health & Wellness":      "pain-driven",
  "Home Services":          "pain-driven",
  "Automotive":             "pain-driven",
  "Trades & Industrial":    "pain-driven",
  "Food & Beverage":        "lifestyle",
  "Beauty & Personal Care": "lifestyle",
  "Fitness & Recreation":   "lifestyle",
  "Retail":                 "lifestyle",
  "Pets":                   "lifestyle",
  "Events & Hospitality":   "lifestyle",
  "Professional Services":  "considered-purchase",
  "Real Estate & Property": "considered-purchase",
  "Education & Childcare":  "considered-purchase",
  "Technology":             "considered-purchase",
};

const matrix: Record<string, Record<PurchaseType, Framework>> = {
  "5 Tips":             { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
  "Promotion / offer":  { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
  "Local event / news": { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
};

export function getFramework(category: string, postType: string, voice: string): Framework {
  if (postType === "Myth-busting")      return "PAS";
  if (postType === "Behind the scenes") return "BAB";
  if (voice === "The Hustler")          return "PAS";

  const archetype = (BUSINESS_ARCHETYPES[category] || "lifestyle") as PurchaseType;
  return matrix[postType]?.[archetype] || "PAS";
}
