import { resolveZoneFocus, ZONE_LABELS, type ZoneKey } from "@/lib/post-type-zone-focus";

const ZONE_KEYS: ZoneKey[] = ["entrance", "customer_space", "work_space"];

/** Flat strings for image architect prompts — place individually in template literals */
export type ImageBrandVariables = {
  color_mood: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  logo_colors: string;

  entrance_arrangement: string;
  entrance_focal: string;
  entrance_materials: string;
  entrance_lighting: string;
  entrance_activity: string;
  entrance_color_dominant: string;
  entrance_color_supporting: string;
  entrance_color_accent: string;
  entrance_color_materials: string;

  customer_space_arrangement: string;
  customer_space_focal: string;
  customer_space_materials: string;
  customer_space_lighting: string;
  customer_space_activity: string;
  customer_space_color_dominant: string;
  customer_space_color_supporting: string;
  customer_space_color_accent: string;
  customer_space_color_materials: string;

  work_space_arrangement: string;
  work_space_focal: string;
  work_space_materials: string;
  work_space_lighting: string;
  work_space_activity: string;
  work_space_color_dominant: string;
  work_space_color_supporting: string;
  work_space_color_accent: string;
  work_space_color_materials: string;

  /** Aliases for the zone chosen by POST_TYPE_ZONE_FOCUS (or zoneFocus override) */
  zone_label: string;
  zone_arrangement: string;
  zone_focal: string;
  zone_materials: string;
  zone_lighting: string;
  zone_activity: string;
  zone_color_dominant: string;
  zone_color_supporting: string;
  zone_color_accent: string;
  zone_color_materials: string;
};

function zoneFields(zones: any, key: ZoneKey): Partial<ImageBrandVariables> {
  const z = zones?.[key];
  const p = key as string;
  return {
    [`${p}_arrangement`]: z?.layout?.spatial_arrangement || "",
    [`${p}_focal`]: z?.layout?.focal_feature || "",
    [`${p}_materials`]: z?.layout?.materials_finishes || "",
    [`${p}_lighting`]: z?.layout?.lighting_mood || "",
    [`${p}_activity`]: z?.layout?.activity_zone || "",
    [`${p}_color_dominant`]: z?.colors?.dominant || "",
    [`${p}_color_supporting`]: z?.colors?.supporting || "",
    [`${p}_color_accent`]: z?.colors?.accent || "",
    [`${p}_color_materials`]: z?.colors?.materials_palette || "",
  } as Partial<ImageBrandVariables>;
}

function emptyZoneAliases(): Pick<
  ImageBrandVariables,
  | "zone_label"
  | "zone_arrangement"
  | "zone_focal"
  | "zone_materials"
  | "zone_lighting"
  | "zone_activity"
  | "zone_color_dominant"
  | "zone_color_supporting"
  | "zone_color_accent"
  | "zone_color_materials"
> {
  return {
    zone_label: "",
    zone_arrangement: "",
    zone_focal: "",
    zone_materials: "",
    zone_lighting: "",
    zone_activity: "",
    zone_color_dominant: "",
    zone_color_supporting: "",
    zone_color_accent: "",
    zone_color_materials: "",
  };
}

function formatLogoColorsInline(logoColors: any): string {
  if (!logoColors) return "";
  if (typeof logoColors === "string") return logoColors;
  const parts: string[] = [];
  if (logoColors.wordmark_primary) parts.push(logoColors.wordmark_primary);
  if (logoColors.graphic_secondary) parts.push(logoColors.graphic_secondary);
  if (logoColors.background) parts.push(`background: ${logoColors.background}`);
  return parts.join(", ");
}

export function buildBrandVariables(
  brandIdentity: any,
  postType: string,
  options?: {
    zoneFocusOverride?: ZoneKey | ZoneKey[];
    includeLogoColors?: boolean;
  }
): ImageBrandVariables {
  const zones = brandIdentity?.zones;

  const vars: Record<string, string> = {
    color_mood: brandIdentity?.color_theme?.description || "",
    color_primary: brandIdentity?.color_theme?.primary || "",
    color_secondary: brandIdentity?.color_theme?.secondary || "",
    color_accent: brandIdentity?.color_theme?.accent || "",
    logo_colors: options?.includeLogoColors
      ? formatLogoColorsInline(brandIdentity?.business_visuals?.logoColors)
      : "",
  };

  for (const key of ZONE_KEYS) {
    Object.assign(vars, zoneFields(zones, key));
  }

  const [focused] = resolveZoneFocus(postType, options?.zoneFocusOverride);
  if (!focused) {
    return { ...(vars as ImageBrandVariables), ...emptyZoneAliases() };
  }

  const f = focused;
  return {
    ...(vars as ImageBrandVariables),
    zone_label: ZONE_LABELS[f],
    zone_arrangement: vars[`${f}_arrangement`] ?? "",
    zone_focal: vars[`${f}_focal`] ?? "",
    zone_materials: vars[`${f}_materials`] ?? "",
    zone_lighting: vars[`${f}_lighting`] ?? "",
    zone_activity: vars[`${f}_activity`] ?? "",
    zone_color_dominant: vars[`${f}_color_dominant`] ?? "",
    zone_color_supporting: vars[`${f}_color_supporting`] ?? "",
    zone_color_accent: vars[`${f}_color_accent`] ?? "",
    zone_color_materials: vars[`${f}_color_materials`] ?? "",
  };
}
