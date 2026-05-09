// lib/niche-to-group-map.ts

import { LensGroupKey } from './lens-groups';

/**
 * NICHE TO LENS GROUP MAPPING
 * Maps all 109+ covered niches to their appropriate lens group(s)
 * 
 * Some niches appear in multiple groups because they can use multiple lenses:
 * - Music school: GROUP_2 (early teaching method decision) + GROUP_5 (divergence of outcomes)
 * - Hair salon: GROUP_1 (hidden upstream cause) + GROUP_5 (divergence of teaching)
 * etc.
 * 
 * When a niche has multiple groups, selectPrimaryGroupForNiche() returns the PRIMARY group,
 * but you can also get all groups with getAllGroupsForNiche() if you want variation.
 * 
 * GROUP_1 (22 niches): Hidden Upstream Problem - Invisible Causality
 * GROUP_2 (25 niches): Early Decision Determines Downstream - Latent Point + Tradeoff Lock
 * GROUP_3 (18 niches): Choosing One Benefit Means Accepting Cost - Tradeoff Lock
 * GROUP_4 (11 niches): Hidden Constraint Determines What's Possible - Tradeoff Lock + Invisible Causality
 * GROUP_5 (12 niches): Identical Start, Different Path = Different Outcome - Divergence
 * GROUP_6 (7 niches): When It Happens Relative to Other Events - Latent Point
 * GROUP_7 (14 niches): Deep Focus Creates Different Capability - Divergence + Invisible Causality
 */

export const NICHE_TO_GROUPS_MAP: Record<string, LensGroupKey[]> = {
  // ────────────────────────────────────────────────────────────────
  // GROUP_1: HIDDEN UPSTREAM PROBLEM (22 niches)
  // Health & Wellness, Fitness, Beauty practices where cause ≠ symptom location
  // ────────────────────────────────────────────────────────────────
  
  // Health & Wellness (7)
  'Dentist': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Physiotherapist': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Chiropractor': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Optometrist': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Acupuncturist': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Dermatologist': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Massage therapist': ['GROUP_1_HIDDEN_UPSTREAM'],

  // Fitness & Recreation (9)
  'Gym / fitness centre': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Yoga studio': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Pilates studio': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Boxing gym': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Crossfit / HIIT studio': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Dance studio': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Martial arts school': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Swimming school': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Cycling studio': ['GROUP_1_HIDDEN_UPSTREAM'],

  // Beauty & Personal Care (6)
  'Hair salon': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Nail salon': ['GROUP_1_HIDDEN_UPSTREAM'],
  'Spa': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Medical aesthetics clinic': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Laser / skin clinic': ['GROUP_1_HIDDEN_UPSTREAM', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Esthetics school': ['GROUP_1_HIDDEN_UPSTREAM'],

  // ────────────────────────────────────────────────────────────────
  // GROUP_2: EARLY DECISION DETERMINES DOWNSTREAM (25 niches)
  // Food, Home Services, Real Estate, Education where early choice locks outcome
  // ────────────────────────────────────────────────────────────────

  // Food & Beverage (10)
  'Bakery': ['GROUP_2_EARLY_DECISION'],
  'Restaurant': ['GROUP_2_EARLY_DECISION'],
  'Café / coffee shop': ['GROUP_2_EARLY_DECISION'],
  'Pizza shop': ['GROUP_2_EARLY_DECISION', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Ramen shop / noodle bar': ['GROUP_2_EARLY_DECISION', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Cheese shop / fromagerie': ['GROUP_2_EARLY_DECISION', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Sushi restaurant': ['GROUP_2_EARLY_DECISION', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Butcher / deli': ['GROUP_2_EARLY_DECISION', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Dessert shop': ['GROUP_2_EARLY_DECISION', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Tea shop / tea bar': ['GROUP_2_EARLY_DECISION'],

  // Home Services - Structural (5)
  'Plumber': ['GROUP_2_EARLY_DECISION'],
  'Electrician': ['GROUP_2_EARLY_DECISION'],
  'HVAC / furnace repair': ['GROUP_2_EARLY_DECISION'],
  'Roofer': ['GROUP_2_EARLY_DECISION'],
  'Flooring installer': ['GROUP_2_EARLY_DECISION'],

  // Real Estate & Property (3)
  'Realtor / real estate agent': ['GROUP_2_EARLY_DECISION'],
  'Home builder': ['GROUP_2_EARLY_DECISION'],
  'Stager': ['GROUP_2_EARLY_DECISION'],

  // Education & Childcare (7)
  'Daycare / nursery': ['GROUP_2_EARLY_DECISION'],
  'Early childhood centre': ['GROUP_2_EARLY_DECISION'],
  'Tutoring centre': ['GROUP_2_EARLY_DECISION', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Music school': ['GROUP_2_EARLY_DECISION', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Art school / classes': ['GROUP_2_EARLY_DECISION', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Language school': ['GROUP_2_EARLY_DECISION', 'GROUP_5_DIVERGENCE'],  // Also divergence
  'Coding school for kids': ['GROUP_2_EARLY_DECISION'],

  // ────────────────────────────────────────────────────────────────
  // GROUP_3: CHOOSING ONE BENEFIT MEANS ACCEPTING SPECIFIC COST (18 niches)
  // Home Services, Automotive, Retail where tradeoffs between speed/quality/cost
  // ────────────────────────────────────────────────────────────────

  // Home Services - Non-structural (8)
  'Landscaper / lawn care': ['GROUP_3_TRADEOFF_CHOICE'],
  'Pest control': ['GROUP_3_TRADEOFF_CHOICE'],
  'House cleaner': ['GROUP_3_TRADEOFF_CHOICE'],
  'Painter': ['GROUP_3_TRADEOFF_CHOICE'],
  'Interior designer': ['GROUP_3_TRADEOFF_CHOICE'],
  'Smart home installer': ['GROUP_3_TRADEOFF_CHOICE'],
  'Security systems': ['GROUP_3_TRADEOFF_CHOICE'],
  'Window & door installer': ['GROUP_3_TRADEOFF_CHOICE'],

  // Automotive (5)
  'Auto repair shop': ['GROUP_3_TRADEOFF_CHOICE'],
  'Car detailing': ['GROUP_3_TRADEOFF_CHOICE'],
  'Tire shop': ['GROUP_3_TRADEOFF_CHOICE'],
  'Auto body / collision': ['GROUP_3_TRADEOFF_CHOICE'],
  'Auto parts store': ['GROUP_3_TRADEOFF_CHOICE'],

  // Retail (5)
  'Clothing boutique': ['GROUP_3_TRADEOFF_CHOICE'],
  'Shoe store': ['GROUP_3_TRADEOFF_CHOICE'],
  'Jewellery store': ['GROUP_3_TRADEOFF_CHOICE', 'GROUP_7_SPECIALIZATION'],  // Also specialization
  'Furniture store': ['GROUP_3_TRADEOFF_CHOICE'],
  'Specialty grocery': ['GROUP_3_TRADEOFF_CHOICE', 'GROUP_7_SPECIALIZATION'],  // Also specialization

  // ────────────────────────────────────────────────────────────────
  // GROUP_4: HIDDEN CONSTRAINT DETERMINES WHAT'S POSSIBLE (11 niches)
  // Professional Services, Technology where constraints lock capability
  // ────────────────────────────────────────────────────────────────

  // Professional Services (7)
  'Lawyer / law firm': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'Accountant / CPA': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'Financial advisor': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'Insurance broker': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'Mortgage broker': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'Business consultant': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'HR consultant': ['GROUP_4_HIDDEN_CONSTRAINT'],

  // Technology (4)
  'Web design agency': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'App developer': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'IT consulting': ['GROUP_4_HIDDEN_CONSTRAINT'],
  'Cybersecurity firm': ['GROUP_4_HIDDEN_CONSTRAINT'],

  // ────────────────────────────────────────────────────────────────
  // GROUP_5: IDENTICAL START, DIFFERENT PATH = DIFFERENT OUTCOME (12 niches)
  // Education, Fitness, Beauty where teaching method/coaching determines outcome
  // ────────────────────────────────────────────────────────────────

  // Education & Childcare (4)
  // Tutoring centre, Music school, Art school, Language school already in GROUP_2

  // Fitness & Recreation (5)
  // Gym, Yoga studio, Pilates studio, Martial arts school, Dance studio already in GROUP_1

  // Beauty & Personal Care (3)
  // Hair salon, Spa, Medical aesthetics clinic already in GROUP_1

  // ────────────────────────────────────────────────────────────────
  // GROUP_6: WHEN IT HAPPENS RELATIVE TO OTHER EVENTS (7 niches)
  // Events, Hospitality, Trades where timing relative to deadline matters
  // ────────────────────────────────────────────────────────────────

  // Events & Hospitality (4)
  'Event planner': ['GROUP_6_TIMING_MATTERS'],
  'Catering (events)': ['GROUP_6_TIMING_MATTERS'],
  'Venue rental': ['GROUP_6_TIMING_MATTERS'],
  'Hotel / B&B': ['GROUP_6_TIMING_MATTERS'],

  // Trades & Industrial (3)
  'Pool installation & service': ['GROUP_6_TIMING_MATTERS'],
  'Irrigation installer': ['GROUP_6_TIMING_MATTERS'],
  'Industrial cleaning': ['GROUP_6_TIMING_MATTERS'],

  // ────────────────────────────────────────────────────────────────
  // GROUP_7: DEEP FOCUS CREATES DIFFERENT CAPABILITY (14 niches)
  // Specialized Food, Retail, Services where deep expertise creates different outcome
  // ────────────────────────────────────────────────────────────────

  // Specialized Food & Beverage (6)
  // Sushi restaurant, Ramen shop, Pizza shop, Cheese shop, Butcher, Dessert shop already in GROUP_2

  // Specialized Retail (5)
  'Bookstore': ['GROUP_7_SPECIALIZATION'],
  'Toy store': ['GROUP_7_SPECIALIZATION'],
  // Jewellery store and Specialty grocery already in GROUP_3
  'Florist': ['GROUP_7_SPECIALIZATION'],

  // Specialized Services (3)
  'Tattoo studio': ['GROUP_7_SPECIALIZATION'],
  'Permanent makeup clinic': ['GROUP_7_SPECIALIZATION'],
  // Laser / skin clinic already in GROUP_1
};

/**
 * Helper function to get the PRIMARY lens group for a niche
 * If a niche maps to multiple groups, returns the first one (primary)
 * 
 * @param niche - The business niche
 * @returns The primary lens group key
 * @throws Error if niche not found in mapping
 */
export function getNicheGroup(niche: string): LensGroupKey {
  const groups = NICHE_TO_GROUPS_MAP[niche];
  if (!groups || groups.length === 0) {
    throw new Error(`Niche not found in mapping: ${niche}`);
  }
  return groups[0];  // Return primary (first) group
}

/**
 * Helper function to get ALL lens groups for a niche
 * Some niches can use multiple lenses depending on context
 * 
 * @param niche - The business niche
 * @returns Array of lens group keys for this niche
 * @throws Error if niche not found in mapping
 */
export function getAllNicheGroups(niche: string): LensGroupKey[] {
  const groups = NICHE_TO_GROUPS_MAP[niche];
  if (!groups || groups.length === 0) {
    throw new Error(`Niche not found in mapping: ${niche}`);
  }
  return groups;
}

/**
 * Get all niches for a specific group
 * @param groupKey - The lens group key
 * @returns Array of niches in that group
 */
export function getNichesInGroup(groupKey: LensGroupKey): string[] {
  return Object.entries(NICHE_TO_GROUPS_MAP)
    .filter(([_, groups]) => groups.includes(groupKey))
    .map(([niche, _]) => niche);
}

/**
 * Validate that all niches are covered
 * @returns Count of mapped niches
 */
export function getGroupCoverage(): number {
  return Object.keys(NICHE_TO_GROUPS_MAP).length;
}
