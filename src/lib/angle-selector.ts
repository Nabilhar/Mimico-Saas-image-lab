// lib/angle-selector.ts

import { COGNITIVE_LENSES, CognitiveLens } from './cognitive-lenses';
import { CATEGORY_LENS_MAP } from './lens-mapping';

/**
 * ANGLE SELECTION PIPELINE
 * STEP 1: Lens selects causal lens
 * STEP 2: PAS provides temporal structure
 * STEP 3: Category provides surface context only
 */

export function selectAngle(
  category: string,
  postType: string,
  recentHistory?: string[]
): {
  lens: CognitiveLens;
  lensDefinition: string;
  categoryContext: string;
} {
  // Get available lenses for this category
  const categoryLenses = CATEGORY_LENS_MAP[category];
  
  if (!categoryLenses) {
    throw new Error(`No lens mapping found for category: ${category}`);
  }

  // Filter out recently used lenses if history exists
  let availableLenses = categoryLenses;
  
  if (recentHistory && recentHistory.length > 0) {
    const usedLenses = new Set(recentHistory);
    availableLenses = categoryLenses.filter(
      mapping => !usedLenses.has(mapping.lens)
    );
    
    // If all lenses used, reset to full pool
    if (availableLenses.length === 0) {
      availableLenses = categoryLenses;
    }
  }

  // Random selection from available pool
  const selectedMapping = availableLenses[
    Math.floor(Math.random() * availableLenses.length)
  ];

  // Get random variant from universal lens definition
  const lensData = COGNITIVE_LENSES[selectedMapping.lens];
  const lensDefinition = lensData.variants[
    Math.floor(Math.random() * lensData.variants.length)
  ];

  // Get random context from category mapping
  const categoryContext = selectedMapping.context[
    Math.floor(Math.random() * selectedMapping.context.length)
  ];

  return {
    lens: selectedMapping.lens,
    lensDefinition,
    categoryContext,
  };
}