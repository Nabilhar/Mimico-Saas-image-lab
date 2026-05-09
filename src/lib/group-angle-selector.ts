// lib/group-angle-selector.ts

import { COGNITIVE_LENSES, CognitiveLens } from './cognitive-lenses';
import { LENS_GROUPS, getLensGroup, getRandomVariant, LensGroupKey } from './lens-groups';
import { getNicheGroup, getAllNicheGroups } from './niche-to-group-map';

/**
 * GROUP-BASED ANGLE SELECTION PIPELINE
 * Updated version of angle-selector.ts
 * 
 * STEP 1: Niche → Look up lens group (primary)
 * STEP 2: Lens group → Get lenses
 * STEP 3: Select random lens from group
 * STEP 4: Get random variant of that lens
 * STEP 5: Get random variant of group context
 * 
 * Returns the complete context needed for prompt building
 * 
 * NOTE: Some niches belong to multiple groups (e.g., Music school is both GROUP_2 and GROUP_5).
 * By default, selectGroupAngle() uses the PRIMARY group (first in the array).
 * To use a different group for variation, call selectGroupAngleByVariant().
 */

export interface AngleSelection {
  lens: CognitiveLens;
  lensDefinition: string;
  groupContext: string;
  groupId: LensGroupKey;
  groupName: string;
}

/**
 * Select a lens angle based on niche and post type
 * Uses the 7-group system for consistent lens application across similar businesses
 * 
 * If a niche belongs to multiple groups, this uses the PRIMARY group.
 * For variation, call selectGroupAngleByVariant() with a specific group index.
 * 
 * @param niche - The business niche (e.g., "Hair salon", "Restaurant")
 * @param postType - The post type (e.g., "Tip of the Day", "Promotion")
 * @param recentHistory - Optional array of recently used lenses to avoid repetition
 * @returns Complete angle selection with lens, definition, and context
 */
export function selectGroupAngle(
  niche: string,
  postType: string,
  recentHistory?: CognitiveLens[]
): AngleSelection {
  // STEP 1: Get the primary lens group for this niche
  const groupId = getNicheGroup(niche);
  return selectGroupAngleByGroupId(groupId, recentHistory);
}

/**
 * Select a lens angle by a specific group ID
 * Useful when a niche maps to multiple groups and you want to use a different one
 * 
 * @param groupId - The specific lens group to use
 * @param recentHistory - Optional array of recently used lenses to avoid repetition
 * @returns Complete angle selection
 */
export function selectGroupAngleByGroupId(
  groupId: LensGroupKey,
  recentHistory?: CognitiveLens[]
): AngleSelection {
  const group = getLensGroup(groupId);

  // STEP 2: Get available lenses from this group
  let availableLenses = group.lenses as CognitiveLens[];

  // STEP 3: Filter out recently used lenses if history exists
  if (recentHistory && recentHistory.length > 0) {
    const usedLenses = new Set(recentHistory);
    availableLenses = availableLenses.filter(
      lens => !usedLenses.has(lens)
    );

    // If all lenses used, reset to full pool
    if (availableLenses.length === 0) {
      availableLenses = group.lenses as CognitiveLens[];
    }
  }

  // STEP 4: Select a random lens from available pool
  const selectedLens = availableLenses[
    Math.floor(Math.random() * availableLenses.length)
  ] as CognitiveLens;

  // STEP 5: Get random variant of the selected lens
  const lensData = COGNITIVE_LENSES[selectedLens];
  const lensDefinition = lensData.variants[
    Math.floor(Math.random() * lensData.variants.length)
  ];

  // STEP 6: Get random variant of the group context
  const groupContext = getRandomVariant(groupId);

  return {
    lens: selectedLens,
    lensDefinition,
    groupContext,
    groupId,
    groupName: group.groupName,
  };
}

/**
 * Select a lens angle using a specific variant of a niche's group
 * For niches that belong to multiple groups, this lets you pick which group to use
 * 
 * @param niche - The business niche
 * @param groupVariantIndex - Which group to use (0 = primary, 1 = secondary, etc.)
 * @param recentHistory - Optional array of recently used lenses
 * @returns Complete angle selection
 */
export function selectGroupAngleByVariant(
  niche: string,
  groupVariantIndex: number = 0,
  recentHistory?: CognitiveLens[]
): AngleSelection {
  const allGroups = getAllNicheGroups(niche);
  
  if (groupVariantIndex >= allGroups.length) {
    throw new Error(
      `Niche "${niche}" only has ${allGroups.length} group(s). ` +
      `Cannot use variant index ${groupVariantIndex}`
    );
  }

  const selectedGroupId = allGroups[groupVariantIndex];
  return selectGroupAngleByGroupId(selectedGroupId, recentHistory);
}

/**
 * Get the main context for a niche (primary, not variant)
 * Useful when you want consistent context across multiple generations
 * 
 * @param niche - The business niche
 * @returns The main context string for the niche's primary group
 */
export function getNicheMainContext(niche: string): string {
  const groupId = getNicheGroup(niche);
  const group = getLensGroup(groupId);
  return group.mainContext;
}

/**
 * Get all lenses available for a niche's primary group
 * Useful for UI display of what lenses apply to a niche
 * 
 * @param niche - The business niche
 * @returns Array of lenses in this niche's primary group
 */
export function getNicheLenses(niche: string): CognitiveLens[] {
  const groupId = getNicheGroup(niche);
  const group = getLensGroup(groupId);
  return group.lenses as CognitiveLens[];
}

/**
 * Get group info for a niche's primary group
 * Useful for displaying which group a niche belongs to
 * 
 * @param niche - The business niche
 * @returns The complete lens group config for this niche's primary group
 */
export function getNicheGroupInfo(niche: string) {
  const groupId = getNicheGroup(niche);
  return getLensGroup(groupId);
}

/**
 * Get ALL groups that a niche belongs to
 * For niches with multiple group mappings
 * 
 * @param niche - The business niche
 * @returns Array of all group IDs for this niche
 */
export function getNicheAllGroups(niche: string): LensGroupKey[] {
  return getAllNicheGroups(niche);
}
