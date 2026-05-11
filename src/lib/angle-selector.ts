// lib/angle-selector.ts

import { COGNITIVE_LENSES, CognitiveLens } from './cognitive-lenses';

/**
 * SIMPLIFIED ANGLE SELECTION
 * All 4 lenses available for every niche
 * Smart context in mode templates handles niche-specific translation
 * 
 * History tracking prevents lens repetition for variety
 */

export function selectAngle(
  recentHistory?: CognitiveLens[]
): {
  lens: CognitiveLens;
  lensDefinition: string;
} {
  // Get all 4 lenses
  const allLenses = Object.keys(COGNITIVE_LENSES) as CognitiveLens[];
  
  // Filter out recently used lenses if history exists
  let availableLenses = allLenses;
  
  if (recentHistory && recentHistory.length > 0) {
    const usedLenses = new Set(recentHistory);
    availableLenses = allLenses.filter(
      lens => !usedLenses.has(lens)
    );
    
    // If all lenses used, reset to full pool
    if (availableLenses.length === 0) {
      console.log("All lenses used in recent history, resetting pool");
      availableLenses = allLenses;
    }
  }

  // Random selection from available pool
  const selectedLens = availableLenses[
    Math.floor(Math.random() * availableLenses.length)
  ];

  // Get random variant from universal lens definition
  const lensData = COGNITIVE_LENSES[selectedLens];
  const lensDefinition = lensData.variants[
    Math.floor(Math.random() * lensData.variants.length)
  ];

  console.log(`Selected lens: ${selectedLens}`);
  console.log(`Available lenses were: ${availableLenses.join(", ")}`);

  return {
    lens: selectedLens,
    lensDefinition,
  };
}