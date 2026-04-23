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

  export function getFrameworkTipsStructure(framework: Framework): string {
    
    //Narative
    const structures: Record<Framework, string> = {
      PAS: `
      STRUCTURE FOR PAS + 5 TIPS:

      [PROBLEM OPENING]
      One sharp sentence naming a specific pain point in this neighbourhood.
      Make it concrete and local — not generic.

      [TRANSITION]
      Bridge from problem to solution: "Here's what actually works:"

      [THE 5 TIPS — Numbered List]
      Each tip is ONE punchy, actionable sentence.
      Each tip should directly solve part of the problem you named.
      Tips should feel like they come from real experience.

      Format:
      1. [Tip 1 — actionable sentence]
      2. [Tip 2 — actionable sentence]
      3. [Tip 3 — actionable sentence]
      4. [Tip 4 — actionable sentence]
      5. [Tip 5 — actionable sentence]

      [SOLVE CLOSING]
      One sentence tying the tips back to the problem and your business.
      Show how your business makes this solution real.
      End with a clear CTA.
          `,

          BAB: `
      STRUCTURE FOR BAB + 5 TIPS:

      [BEFORE OPENING]
      One relatable sentence placing the reader in their ordinary reality.
      Make it specific to this neighbourhood and this moment.

      [TRANSITION]
      Bridge from before to after: "Here's how to get there:"

      [THE 5 TIPS — Numbered List]
      Each tip is ONE actionable sentence that moves them toward the "after" state.
      Tips should feel like steps on a journey.

      Format:
      1. [Tip 1 — actionable sentence toward the after state]
      2. [Tip 2 — actionable sentence toward the after state]
      3. [Tip 3 — actionable sentence toward the after state]
      4. [Tip 4 — actionable sentence toward the after state]
      5. [Tip 5 — actionable sentence toward the after state]

      [AFTER CLOSING]
      One sensory, specific sentence showing life after applying these tips.
      Then one sentence showing how your business makes this transformation real.
      End with a warm, low-pressure CTA.
          `,

          AIDA: `
      STRUCTURE FOR AIDA + 5 TIPS:

      [ATTENTION HOOK]
      One bold, surprising statement about these 5 tips.
      Make it specific to this neighbourhood and this moment.
      It should make someone stop scrolling.

      [INTEREST — Why Now]
      One sentence explaining why these tips matter RIGHT NOW in this community.
      Is it seasonal? Timely? A local trend?

      [DESIRE — The 5 Tips]
      Each tip is ONE actionable sentence.
      Tips should build on each other, creating progression.
      Each tip should answer: "What's in it for me?"

      Format:
      1. [Tip 1 — actionable sentence + benefit]
      2. [Tip 2 — actionable sentence + benefit]
      3. [Tip 3 — actionable sentence + benefit]
      4. [Tip 4 — actionable sentence + benefit]
      5. [Tip 5 — actionable sentence + benefit]

      [ACTION — CTA]
      One direct call-to-action.
      Pick ONE action only: DM, click, call, or book.
      Reference your business as the natural next step.
      Make it easy and low-friction.
          `
    };

    return structures[framework];
  }

  export const POST_TYPE_CTA_OVERRIDE: Partial<Record<string, string>> = {
    "Promotion / offer": `CTA OVERRIDE (supersedes framework CTA rule): The only action is to show this post on their phone when they arrive. Phrase it warmly — e.g., "Just show this post to the team when you stop by." No links, no DMs, no booking.`,
    "Local event / news": `CTA OVERRIDE: The only action is to stop by on their way to or from the event. No links, no booking.`,
  };

  //Visual
  export const FRAMEWORK_POST_TYPE_COMBINATIONS = {
    "PAS_5 Tips": `Show the solution state or the benefit of applying the tips. Visual should feel instructive and clear.`,
    "PAS_Myth-busting": `Show the truth/solution state. Visual should feel authoritative and confident.`,
    "PAS_Behind the Scenes": `Show the solution process or the work that solves the problem. Visual should feel authentic and revealing.`,
    "PAS_Promotion": `Show the solution or benefit being offered. Visual should feel inviting and accessible.`,
    "PAS_Local Event": `Show the solution or opportunity at the event. Visual should feel timely and community-connected.`,
  
    "BAB_5 Tips": `Show the "after" state of applying the tips. Visual should feel instructive and aspirational.`,
    "BAB_Myth-busting": `Show the transformation from wrong belief to correct understanding. Visual should feel authoritative.`,
    "BAB_Behind the Scenes": `Show the transformation moment or the "after" of the work. Visual should feel intimate and revealing.`,
    "BAB_Promotion": `Show the "after" state of using the offer. Visual should feel inviting and warm.`,
    "BAB_Local Event": `Show the community transformation or connection at the event. Visual should feel community-first.`,
  
    "AIDA_5 Tips": `Show an attention-grabbing tip or the desire-building result. Visual should feel compelling and clear.`,
    "AIDA_Myth-busting": `Show the surprising truth or the striking difference. Visual should feel bold and credible.`,
    "AIDA_Behind the Scenes": `Show an attention-grabbing moment or desire-building detail of the work. Visual should feel intimate and revealing.`,
    "AIDA_Promotion": `Show an attention-grabbing element of the offer or desire-building detail. Visual should feel compelling and warm.`,
    "AIDA_Local Event": `Show an attention-grabbing element of the event or desire-building detail. Visual should feel timely and community-connected.`
  };
  
  export const getSeason = (month: string) => {
  const seasons: Record<string, string> = {
    January: "Winter", February: "Winter", March: "Spring", April: "Spring",
    May: "Spring", June: "Summer", July: "Summer", August: "Summer",
    September: "Fall", October: "Fall", November: "Fall", December: "Winter"
  };
  return seasons[month] || "Spring";
  };

  // Visual
  export const SEASONALITY_CONTEXT = {
    "Winter": {
      visual_elements: "Possible snow/frost, bare trees, cool tones, warm interior contrast",
      lighting_mood: "Cool or warm interior lighting, intimate, reflective",
      time_of_day_guidance: "Evening: Warm interior lighting. Morning: Fresh, cool daylight."
    },
    "Spring": {
      visual_elements: "New growth, fresh colors, awakening quality, lighter mood",
      lighting_mood: "Fresh, bright daylight with new growth visible",
      time_of_day_guidance: "Morning: Fresh, bright daylight. Afternoon: Golden hour warmth."
    },
    "Summer": {
      visual_elements: "Bright, high energy, outdoor activity, vibrant colors",
      lighting_mood: "Bright daylight, outdoor energy, vibrant colors",
      time_of_day_guidance: "Afternoon: Bright daylight, high energy. Morning: Fresh, awakening light."
    },
    "Fall": {
      visual_elements: "Warm tones, harvest elements, golden light, nostalgic mood",
      lighting_mood: "Golden light, warm tones, nostalgic mood",
      time_of_day_guidance: "Afternoon: Golden hour warmth. Morning: Crisp, cool light."
    }
  };
  
  //Visual
  export const SEASONAL_NICHE_CONTEXT: Record<string, Record<string, string>> = {
    "Winter": {
      "Health & Wellness": "Winter is recovery season. Show cozy, warm interiors. Emphasize indoor wellness (yoga, massage, therapy). Highlight warm lighting, blankets, comfort.",
      "Home Services": "Winter is crisis season. Show emergency preparedness (heating, plumbing, insulation). Emphasize reliability and quick response. Use warm, reassuring lighting.",
      "Automotive": "Winter is maintenance season. Show tire changes, winter prep, salt spray cleanup. Emphasize durability and protection. Use industrial, bright lighting.",
      "Food & Beverage": "Winter is comfort food season. Show warm drinks, hearty meals, cozy seating. Emphasize warmth and gathering. Use golden, intimate lighting.",
      "Beauty & Personal Care": "Winter is self-care season. Show moisturizing, skin protection, hydration treatments. Emphasize nourishment and glow. Use soft, flattering lighting.",
      "Fitness & Recreation": "Winter is indoor season. Show gym equipment, indoor classes, swimming pools. Emphasize energy and movement. Use bright, energetic lighting.",
      "Retail": "Winter is gift-giving season. Show curated displays, wrapped items, festive arrangements. Emphasize discovery and gifting. Use warm, inviting lighting.",
      "Professional Services": "Winter is planning season. Show offices, consultations, planning sessions. Emphasize expertise and forward-thinking. Use professional, clear lighting.",
      "Real Estate & Property": "Winter is viewing season. Show properties with snow, winter landscaping, cozy interiors. Emphasize warmth and potential. Use natural daylight.",
      "Education & Childcare": "Winter is indoor learning season. Show classrooms, activities, warm environments. Emphasize engagement and care. Use bright, welcoming lighting.",
    },
    "Spring": {
      "Health & Wellness": "Spring is renewal season. Show outdoor practice, fresh air, new beginnings. Emphasize rejuvenation and energy. Use soft, golden morning light.",
      "Home Services": "Spring is refresh season. Show outdoor work, landscaping, renovation. Emphasize transformation and renewal. Use bright, natural daylight.",
      "Automotive": "Spring is cleaning season. Show car washing, detailing, maintenance. Emphasize cleanliness and care. Use bright, clear daylight.",
      "Food & Beverage": "Spring is fresh ingredient season. Show seasonal produce, outdoor seating, patio dining. Emphasize freshness and lightness. Use bright, airy lighting.",
      "Beauty & Personal Care": "Spring is renewal season. Show outdoor treatments, fresh skincare, light makeup. Emphasize natural beauty and freshness. Use soft, natural light.",
      "Fitness & Recreation": "Spring is outdoor season. Show running, cycling, outdoor classes, parks. Emphasize energy and movement. Use bright, energetic daylight.",
      "Retail": "Spring is refresh season. Show new collections, seasonal displays, outdoor shopping. Emphasize discovery and newness. Use bright, inviting light.",
      "Professional Services": "Spring is growth season. Show new projects, team collaboration, outdoor meetings. Emphasize momentum and opportunity. Use natural, professional lighting.",
      "Real Estate & Property": "Spring is selling season. Show properties with blooming gardens, outdoor spaces, curb appeal. Emphasize potential and beauty. Use golden, warm daylight.",
      "Education & Childcare": "Spring is outdoor learning season. Show outdoor classes, nature activities, playgrounds. Emphasize exploration and growth. Use bright, natural daylight.",
    },
    "Summer": {
      "Health & Wellness": "Summer is active season. Show outdoor yoga, water activities, beach wellness. Emphasize vitality and freedom. Use bright, golden daylight.",
      "Home Services": "Summer is project season. Show exterior work, renovations, outdoor improvements. Emphasize transformation and expertise. Use bright, clear daylight.",
      "Automotive": "Summer is road trip season. Show clean cars, open roads, travel prep. Emphasize adventure and reliability. Use bright, energetic daylight.",
      "Food & Beverage": "Summer is outdoor dining season. Show patios, BBQs, cold drinks, fresh salads. Emphasize community and enjoyment. Use golden, warm daylight.",
      "Beauty & Personal Care": "Summer is sun protection season. Show sunscreen, tanning, hair care for sun exposure. Emphasize protection and glow. Use bright, warm daylight.",
      "Fitness & Recreation": "Summer is outdoor adventure season. Show swimming, hiking, outdoor sports, beach activities. Emphasize energy and freedom. Use bright, energetic daylight.",
      "Retail": "Summer is travel season. Show vacation items, outdoor gear, seasonal collections. Emphasize adventure and discovery. Use bright, warm daylight.",
      "Professional Services": "Summer is planning season. Show consultations, strategy sessions, team building. Emphasize growth and opportunity. Use natural, professional lighting.",
      "Real Estate & Property": "Summer is peak selling season. Show properties with lush gardens, outdoor entertaining spaces, sunny interiors. Emphasize lifestyle and potential. Use bright, golden daylight.",
      "Education & Childcare": "Summer is camp/program season. Show outdoor activities, group fun, learning adventures. Emphasize joy and growth. Use bright, energetic daylight.",
    },
    "Fall": {
      "Health & Wellness": "Fall is transition season. Show grounding practices, indoor/outdoor balance, preparation. Emphasize stability and preparation. Use warm, golden light.",
      "Home Services": "Fall is preparation season. Show weatherproofing, heating prep, gutter cleaning. Emphasize foresight and care. Use warm, natural daylight.",
      "Automotive": "Fall is maintenance season. Show tire changes, fluid checks, winterization. Emphasize reliability and preparation. Use warm, clear daylight.",
      "Food & Beverage": "Fall is harvest season. Show seasonal ingredients, comfort food, warm drinks. Emphasize abundance and warmth. Use golden, intimate lighting.",
      "Beauty & Personal Care": "Fall is transition season. Show seasonal skincare changes, fall colors, warm tones. Emphasize adaptation and care. Use warm, flattering light.",
      "Fitness & Recreation": "Fall is outdoor season (last chance). Show hiking, outdoor classes, parks. Emphasize energy and nature. Use golden, warm daylight.",
      "Retail": "Fall is back-to-school/refresh season. Show new collections, seasonal items, organized displays. Emphasize preparation and discovery. Use warm, inviting light.",
      "Professional Services": "Fall is planning season. Show strategy sessions, goal-setting, team planning. Emphasize preparation and growth. Use warm, professional lighting.",
      "Real Estate & Property": "Fall is selling season (secondary). Show properties with fall colors, cozy interiors, outdoor spaces. Emphasize warmth and potential. Use golden, warm daylight.",
      "Education & Childcare": "Fall is new year season. Show classrooms, new students, learning activities. Emphasize growth and opportunity. Use warm, welcoming light.",
    },
  };

  //Narative
  export const SEASONAL_NICHE_NARRATIVE: Record<string, Record<string, string>> = {
    "Winter": {
      "Health & Wellness": "Theme: Recovery and warmth. Focus on indoor wellness, soothing treatments, and escaping the cold. Pain points: Winter blues, stiffness, dehydration.",
      "Home Services": "Theme: Preparedness and protection. Focus on emergency repairs, heating, and winterproofing. Pain points: Frozen pipes, broken heaters, storm damage.",
      "Automotive": "Theme: Reliability and winter prep. Focus on tire changes, battery checks, and salt cleanup. Pain points: Slush, icy roads, winter wear-and-tear.",
      "Food & Beverage": "Theme: Comfort and warmth. Focus on hearty meals, hot drinks, and cozy indoor seating. Pain points: Cold weather, craving comfort.",
      "Beauty & Personal Care": "Theme: Nourishment and glow. Focus on hydration, moisturizing, and indoor pampering. Pain points: Dry skin, winter dullness.",
      "Fitness & Recreation": "Theme: Indoor energy. Focus on staying active inside, gym routines, and beating the winter slump. Pain points: Low energy, seasonal blues.",
      "Retail": "Theme: Gifting and cozy indoor shopping. Focus with festive decor, winter essentials, and indoor browsing. Pain points: Cold weather, holiday stress.",
      "Professional Services": "Theme: Planning and stability. Focus on year-end reviews, tax prep, or planning for the new year. Pain points: End-of-year chaos, planning fatigue.",
      "Real Estate & Property": "Theme: Cozy interiors and winter viewing. Focus on warmth, heating efficiency, and indoor comfort. Pain points: High heating bills, snow removal.",
      "Education & Childcare": "Theme: Indoor learning and warmth. Focus on engaging indoor activities and cozy environments. Pain points: Staying active indoors, cold commutes.",
    },
    "Spring": {
      "Health & Wellness": "Theme: Renewal and awakening. Focus on outdoor practice, fresh air, and rejuvenation. Pain points: Winter stiffness, seasonal allergies.",
      "Home Services": "Theme: Refresh and renovation. Focus on landscaping, gutter cleaning, and spring repairs. Pain points: Mud, spring cleaning overwhelm, thaw damage.",
      "Automotive": "Theme: Cleaning and maintenance. Focus on car washes, detailing, and spring inspections. Pain points: Salt residue, winter wear, spring mud.",
      "Food & Beverage": "Theme: Freshness and lightness. Focus on seasonal produce, patio dining, and bright flavors. Pain points: Craving something fresh and light.",
      "Beauty & Personal Care": "Theme: Renewal and glow. Focus on skincare refresh, spring colors, and outdoor beauty. Pain points: Post-winter skin, seasonal changes.",
      "Fitness & Recreation": "Theme: Re-activation. Focus on outdoor workouts, running, and getting moving. Pain points: Re-starting routines, winter lethargy.",
      "Retail": "Theme: Refresh and new collections. Focus on spring fashion, outdoor gear, and seasonal arrivals. Pain points: Seasonal transition, refreshing the home.",
      "Professional Services": "Theme: Growth and momentum. Focus on new projects, spring cleaning of accounts, and growth strategy. Pain points: Post-winter organization.",
      "Real Estate & Property": "Theme: Selling and curb appeal. Focus on blooming gardens, outdoor spaces, and spring listings. Pain points: Spring cleaning, curb appeal needs.",
      "Education & Childcare": "Theme: Growth and outdoor learning. Focus on outdoor play, spring activities, and new beginnings. Pain points: Transitioning to new routines.",
    },
    "Summer": {
    "Health & Wellness": "Theme: Vitality and outdoor living. Focus on hydration, sun protection, and outdoor activity. Pain points: Heat exhaustion, summer lethargy, sun damage.",
    "Home Services": "Theme: Maintenance and exterior care. Focus on AC repair, landscaping, and patio setup. Pain points: Summer heat, garden maintenance, storm prep.",
    "Automotive": "Theme: Adventure and reliability. Focus on road trip prep, AC checks, and summer maintenance. Pain points: Heat, long drives, summer wear-and-tear.",
    "Food & Beverage": "Theme: Refreshment and social vibes. Focus on cold drinks, BBQs, and patio dining. Pain points: Heat, cravings for freshness, summer crowds.",
    "Beauty & Personal Care": "Theme: Protection and summer glow. Focus on sun care, hair health, and lightweight products. Pain points: Sun damage, summer skin, humidity.",
    "Fitness & Recreation": "Theme: High energy and adventure. Focus on outdoor workouts, swimming, and active lifestyles. Pain points: Heat exhaustion, staying active in humidity.",
    "Retail": "Theme: Adventure and summer style. Focus on travel gear, summer fashion, and outdoor living. Pain points: Summer travel prep, seasonal transitions.",
    "Professional Services": "Theme: Momentum and summer planning. Focus on business growth, summer projects, and mid-year reviews. Pain points: Summer slowdown, managing busy schedules.",
    "Real Estate & Property": "Theme: Peak activity and outdoor living. Focus on curb appeal, patio spaces, and summer showings. Pain points: High demand, summer heat affecting property viewing.",
    "Education & Childcare": "Theme: Summer fun and exploration. Focus on summer camps, outdoor learning, and adventure. Pain points: Summer boredom, keeping kids active.",
  },
  "Fall": {
    "Health & Wellness": "Theme: Grounding and transition. Focus on immunity, routine adjustment, and cozy wellness. Pain points: Seasonal changes, immune support, getting back into routine.",
    "Home Services": "Theme: Preparation and weatherproofing. Focus on heating, gutter cleaning, and winter prep. Pain points: Cold weather, autumn storms, heating issues.",
    "Automotive": "Theme: Reliability and winter readiness. Focus on tire changes, fluid checks, and winter prep. Pain points: First frost, salt buildup, preparing for winter.",
    "Food & Beverage": "Theme: Harvest and comfort. Focus on seasonal flavors, warm drinks, and cozy dining. Pain points: Cooling weather, craving comfort food.",
    "Beauty & Personal Care": "Theme: Nourishment and transition. Focus on hydration, seasonal skincare, and cozy treatments. Pain points: Dry skin, seasonal transitions.",
    "Fitness & Recreation": "Theme: Outdoor adventure and transition. Focus on hiking, crisp air workouts, and outdoor movement. Pain points: Cooler weather, adjusting to shorter days.",
    "Retail": "Theme: Transition and cozy preparation. Focus on fall fashion, home decor, and back-to-school. Pain points: Seasonal shifts, preparing for colder weather.",
    "Professional Services": "Theme: Strategy and year-end planning. Focus on Q4 goals, end-of-year reviews, and planning for the new year. Pain points: End-of-year rush, planning fatigue.",
    "Real Estate & Property": "Theme: Cozy interiors and autumn curb appeal. Focus on heating efficiency, autumn decor, and seasonal maintenance. Pain points: Preparing for winter, fall maintenance.",
    "Education & Childcare": "Theme: Back-to-school and new routines. Focus on classroom readiness, learning adventures, and structured routines. Pain points: Transitioning from summer, new school year jitters.",
  },
}