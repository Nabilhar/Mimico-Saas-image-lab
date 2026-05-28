import { resolveZoneFocus, ZONE_LABELS, type ZoneKey } from "@/lib/post-type-zone-focus";

// Maps zone keys to their column names in the businesses table
const ZONE_TO_COLUMN: Record<ZoneKey, string> = {
  entrance:       "entrance_photo_url",
  customer_space: "customer_space_photo_url",
  work_space:     "work_space_photo_url",
};

export interface ZonePhotoResult {
  photoUrl: string | null;
  zoneKey: ZoneKey | null;
  zoneLabel: string | null;
  fallbackReason?: string;
}

/**
 * Selects the appropriate zone photo URL for image generation
 * based on the post type's zone focus priority.
 *
 * Priority: first zone in resolveZoneFocus() that has a saved photo URL.
 * Falls back gracefully if no photo found.
 */
export async function selectZonePhoto(
  supabase: any,
  userId: string,
  postType: string,
  zoneOverride?: ZoneKey | ZoneKey[]
): Promise<ZonePhotoResult> {

  // 1. Resolve which zones to try, in priority order
  const zoneKeys = resolveZoneFocus(postType, zoneOverride);

  if (zoneKeys.length === 0) {
    return {
      photoUrl:  null,
      zoneKey:   null,
      zoneLabel: null,
      fallbackReason: `No zone configured for post type: "${postType}"`,
    };
  }

  // 2. Fetch photo URL columns for the active business
  const { data: business, error } = await supabase
    .from("businesses")
    .select("entrance_photo_url, customer_space_photo_url, work_space_photo_url")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[selectZonePhoto] Supabase error:", error.message);
    return {
      photoUrl:  null,
      zoneKey:   null,
      zoneLabel: null,
      fallbackReason: `Database error: ${error.message}`,
    };
  }

  if (!business) {
    return {
      photoUrl:  null,
      zoneKey:   null,
      zoneLabel: null,
      fallbackReason: "No active business found for this user",
    };
  }

  // 3. Try each zone in priority order — return first with a saved URL
  for (const zoneKey of zoneKeys) {
    const column  = ZONE_TO_COLUMN[zoneKey];
    const photoUrl = business[column] as string | null;

    if (photoUrl) {
      console.log(`[selectZonePhoto] ✅ Found ${ZONE_LABELS[zoneKey]} photo for "${postType}"`);
      return {
        photoUrl,
        zoneKey,
        zoneLabel: ZONE_LABELS[zoneKey],
      };
    }
  }

  // 4. No photo found for any zone in the priority list
  const triedZones = zoneKeys.map(k => ZONE_LABELS[k]).join(", ");
  console.warn(`[selectZonePhoto] ⚠️ No photo found for zones: ${triedZones}`);
  return {
    photoUrl:  null,
    zoneKey:   zoneKeys[0],  // Return primary zone so caller knows which was tried
    zoneLabel: ZONE_LABELS[zoneKeys[0]],
    fallbackReason: `No photo uploaded for: ${triedZones}`,
  };
}