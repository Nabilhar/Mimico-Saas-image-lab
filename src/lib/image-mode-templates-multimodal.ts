// lib/image-mode-templates-multimodal.ts
//
// Multimodal-native image templates for GEMINI_MULTIMODAL + OPENROUTER path.
//
// These replace image-mode-templates.ts (which remains for the Architect/FLUX path).
// Key differences from architect templates:
//   - Written as direct generation instructions, not deliberation chains
//   - No FLUX boilerplate ("Shot on Sony A7, f/1.8...")
//   - No [EXAMPLE] section — the reference photo anchors the scene
//   - Hero is pre-resolved by visual mode (product vs experience) — no conditionals for the model
//   - People rules are explicit per post type
//
// Usage:
//   import { getMultimodalImageTemplate } from '@/lib/image-mode-templates-multimodal';
//   const templateBlock = getMultimodalImageTemplate(postType, category, { localEventVariant });
//   // inject templateBlock into the multimodal prompt where imageModeLogicMulti was

import { getVisualMode, type VisualMode } from "./image-visual-mode";

// ============================================================================
// TYPES
// ============================================================================

export type PostType =
  | "Tip of the Day"
  | "Behind the scenes"
  | "Promotion / offer"
  | "Local event / news"
  | "Community moment";

export type LocalEventVariant = "exterior" | "interior";

interface TemplateBlocks {
  visualJob: string;
  hero: Record<VisualMode, string>;
  composition: string;
  people: string;
  avoid: string;
}

// ============================================================================
// TEMPLATES
// ============================================================================

const TEMPLATES: Record<PostType, TemplateBlocks> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // TIP OF THE DAY
  // Text teaches the how. Image shows the what-you-get.
  // ═══════════════════════════════════════════════════════════════════════════
  "Tip of the Day": {
    visualJob: `The post teaches a technique. Generate what that technique produces or requires — not the action itself.
Text teaches the how. Image shows the what-you-get.`,

    hero: {
      product: `From the post, identify the technique's finished result — the specific thing that proves it worked.
Generate that result placed naturally in the reference space.
- Bread cooling tip → sliced loaf showing intact crumb, no gumming
- Oil change tip → engine bay with clean, well-maintained components
- Plant pruning tip → plant with healthy new growth at cut points
- Plating tip → finished plate with the specific presentation the tip creates

Always the outcome. Not hands applying the technique. Not the tool mid-use.
The finished result, at rest in the space from the reference photo.`,

      experience: `From the post, identify the tool or setup the technique uses.
Generate it arranged with craft precision in the reference space — ready, not in use.
- Block placement tip → blocks positioned precisely on the mat, blanket folded beside them
- Taping technique tip → tape, scissors, and prepared strips on the treatment table
- Sectioning tip → clips and combs laid out at the station
- Instrument setup tip → the instrument and accessories positioned on the teaching surface

Always the setup. Not hands performing the technique. Not the tool mid-use.
The workspace prepared with the precision the text describes.`,
    },

    composition: `Detail close-up when the tip produces a visible texture, finish, or surface quality.
Medium shot when the tip produces a visible form, shape, or arrangement.
Show craft quality — the viewer should see the precision the text describes.`,

    people: `Optional. A figure in soft background blur, someone passing through the space.
Never the subject. Never hands performing the technique the text describes.`,

    avoid: `- Hands mid-technique — the text teaches the action
- Tools actively being used — the text names them
- Step-by-step process shots
- Generic product without the specific quality the tip produces
- Raw materials before the technique is applied`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BEHIND THE SCENES
  // Text shows the work. Image shows the payoff.
  // ═══════════════════════════════════════════════════════════════════════════
  "Behind the scenes": {
    visualJob: `The post reveals the labor. Generate what that labor produces or prepares — not the labor itself.
Text shows the work. Image shows the payoff.`,

    hero: {
      product: `From the post, identify the finished product the described process creates.
Generate it complete and at rest in the reference space.
- Dough shaping process → golden loaf on the cooling rack
- Engine diagnosis → car in the bay, clean and ready
- Flower arranging → completed arrangement on the counter
- Frame building → finished frame mounted, clean edges visible

Always the result. Not the person working. Not mid-process action.
The finished thing the labor produced, at rest in the workspace.`,

      experience: `From the post, identify the workspace the described process requires.
Generate it prepared for delivery — tools laid out, station ready, setup precise.
- Adjustment process → mat with blocks positioned, blanket folded, studio quiet
- Treatment preparation → table set with oils and towels, room softly lit
- Class setup → equipment arranged, floor marked, space ready
- Consultation prep → desk arranged, materials organized, chair positioned

Always the ready space. Not the person working. Not mid-process action.
The workspace that tells the story of what kind of work happens here.`,
    },

    composition: `Medium shot for the full product or prepared workspace — context visible.
Detail close-up when craft quality in the surface or finish is the story.`,

    people: `Optional. A figure in the far background, arriving or passing through.
Never the person doing the work — the text already shows their perspective.`,

    avoid: `- Mid-process action — the text already covers this
- The person working — the text already shows their perspective
- Raw materials before transformation
- Mess, chaos, or disorder
- The "before" — always show the "after" or "ready"`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROMOTION / OFFER
  // Text states the offer. Image makes it desirable.
  // ═══════════════════════════════════════════════════════════════════════════
  "Promotion / offer": {
    visualJob: `The post states the offer. Generate what makes it desirable — the thing itself, ready.
Text grounds the offer. Image sells it.`,

    hero: {
      product: `Generate the specific product being offered — assembled, counter-ready, appealing.
Place it naturally in the customer space from the reference photo.
- Seasonal pastry special → the pastry on a plate, on the counter, ready to pick up
- Detailing package → the car gleaming, in the bay, freshly finished
- Floral arrangement deal → the arrangement complete, on the shop counter
- Framing promotion → the framed piece displayed, craftsmanship visible

The offer made tangible and waiting. Not someone receiving it. Not a transaction in progress.`,

      experience: `Generate the service environment ready to receive — the space set for the experience the offer promises.
Place it naturally in the reference space.
- Massage package → treatment room set, towels folded, oils arranged, warmth visible
- Class package → studio ready, mats laid, props positioned for the session
- Consultation offer → office arranged, materials prepared, chairs facing
- Grooming package → station set with tools, clean surfaces, good light

The experience, ready and inviting. Not someone mid-service. Not a transaction.`,
    },

    composition: `Medium shot. The full offering visible in its natural context.
Detail only when the quality or craft of the product IS the selling point.`,

    people: `Optional. A hand reaching toward the product. Someone approaching, out of focus.
Never someone receiving or consuming — the viewer should imagine themselves, not watch someone else.`,

    avoid: `- Price tags or text overlays
- Catalogue-style flat lay or product-on-white
- Someone holding, receiving, or consuming the product
- Stock-photo staging — the space should feel real, not arranged for a shoot
- Generic "beautiful product" without the specific appeal the offer creates`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY MOMENT
  // Text describes the pattern. Image shows the room when it's happening.
  // ═══════════════════════════════════════════════════════════════════════════
  "Community moment": {
    visualJob: `The post describes a customer pattern. Generate the space when that pattern is happening.
Text describes what people do. Image shows the room when they're doing it.`,

    hero: {
      product: `The specific spot where the pattern occurs — mid-use, with evidence of activity.
Cups on tables, a bag on a chair, plates with food, a newspaper folded open.
The space is lived-in, not reset. Evidence that people are here or just were.

Place the activity naturally in the customer space from the reference photo.
- "Saturday morning regulars" → tables with cups and pastry plates, morning light through windows
- "The lunch rush" → counter with plates going out, napkins, movement evidence
- "After-work crowd" → high-tops with glasses, jackets on chairs, warm evening light

The room is the hero. Activity is the evidence. People are atmosphere.`,

      experience: `The specific spot where the pattern occurs — mid-use, with evidence of activity.
Mats laid out, water bottles at edges, a towel draped over a chair, cubbies with bags.
The space is in-session or just-finished, not reset. Evidence that people are here or just were.

Place the activity naturally in the customer space from the reference photo.
- "The 6 PM crew" → mats laid out with blocks, water bottles, studio warm
- "After-school rush" → cubbies full, shoes by the door, equipment in use
- "The morning quiet" → one station set, coffee cup nearby, room still

The room is the hero. Activity is the evidence. People are atmosphere.`,
    },

    composition: `Medium shot for the spot in its room context.
Wide shot when the pattern fills the whole space — rush, full house, many stations active.`,

    people: `Encouraged as atmosphere — this post type benefits from human presence.
Figures at tables, someone at the counter, a silhouette near the window.
Always blurred, partial, angled away, or cropped at shoulders.
Hair, shoulders, hands holding a cup — presence without identity.`,

    avoid: `- Empty, clean, or reset space — the pattern requires evidence of use
- Staged or symmetrical arrangements
- Product placement or branded items in focus
- A single person as the clear subject — the room is the subject
- Pristine surfaces — some lived-in quality is authenticity`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL EVENT / NEWS
  // This template serves as the DEFAULT (interior variant).
  // The exterior variant is handled separately below.
  // ═══════════════════════════════════════════════════════════════════════════
  "Local event / news": {
    visualJob: `The post ties the business to a local event or neighbourhood moment.
Generate the space when the described scene is happening.
The event lives in the text. The image shows what the business looks like because of it.`,

    hero: {
      product: `The customer space with evidence of the described activity — the event's energy in the room.
- "Game day regulars" → tables with drinks, the space buzzing, warm light
- "Post-concert rush" → busy counter area, movement evidence, plates out
- "The regular's usual spot" → a familiar corner, worn in, cup and newspaper

The local event doesn't need to appear. Its effect on the room does.`,

      experience: `The customer space with evidence of the described activity — the event's energy in the room.
- "Pre-race stretching crowd" → extra mats out, water bottles everywhere, energy visible
- "Post-game recovery bookings" → treatment rooms full, towels stacked, schedule busy
- "The regular's Tuesday slot" → their preferred station set, familiar setup, routine visible

The local event doesn't need to appear. Its effect on the room does.`,
    },

    composition: `Medium shot for the spot in context.
Wide shot when rush or crowd energy fills the whole space.`,

    people: `Encouraged. Figures as atmosphere — same as Community moment.
Blurred, partial, silhouetted. Movement and presence, never identity.`,

    avoid: `- Showing the actual event explicitly (game on screen, concert poster, event banner)
- Empty or calm space — this variant implies activity
- Staged or reset room
- A single identifiable person as subject`,
  },
};

// ============================================================================
// LOCAL EVENT / NEWS — EXTERIOR VARIANT
// Used for: "Neighborhood rhythm", "Season / weather impact"
// ============================================================================

const LOCAL_EVENT_EXTERIOR: TemplateBlocks = {
  visualJob: `The post anchors in the neighbourhood. Generate the business as part of it — exterior, street-level.
Text ties the business to what's happening outside. Image shows it there.`,

  hero: {
    product: `The entrance or storefront in its seasonal moment — foot traffic, weather light, street context.
The business as one element in the neighbourhood, not isolated.

Use the reference photo as the base — the actual entrance, patio, or reception area.
Add seasonal context: warm golden light, wet pavement reflection, bundled pedestrians, open patio umbrellas.
- "Neighbourhood waking up" → storefront with morning light, first pedestrians, sandwich board out
- "First patio day" → tables set outside, someone approaching, spring light
- "Winter foot traffic" → warm glow from windows, snow on sidewalk, bundled figures passing`,

    experience: `The entrance or storefront in its seasonal moment — foot traffic, weather light, street context.
The business as one element in the neighbourhood, not isolated.

Use the reference photo as the base — the actual entrance, patio, or reception area.
Add seasonal context: warm golden light, wet pavement reflection, bundled pedestrians, door propped open.
- "Morning regulars arriving" → entrance with door open, someone approaching, morning light
- "Weather shift" → reception area visible through windows, seasonal light outside
- "Neighbourhood rhythm" → the business frontage with street life flowing past`,
  },

  composition: `Medium shot showing the entrance with street context visible.
Wide shot if the neighbourhood setting matters more than the building detail.`,

  people: `Encouraged. Pedestrians, someone entering, figures on the patio.
Always in motion blur, mid-stride, angled away. Street-level energy, not posed.`,

  avoid: `- Isolated building with no context — avoids real estate listing feel
- Close-up on signage, door hardware, or address numbers
- Empty street or sidewalk
- Generic exterior without seasonal or weather specificity
- Interior shots — this variant is explicitly exterior`,
};

// ============================================================================
// CATEGORY → ZONE MAP FOR LOCAL EVENT / NEWS
// Used by the route to determine zoneFocusOverride
// ============================================================================

export const LOCAL_EVENT_ZONE_MAP: Record<string, "entrance" | "customer_space"> = {
  "Neighborhood rhythm":     "entrance",
  "Season / weather impact": "entrance",
  "The regular":             "customer_space",
  "Peak / rush":             "customer_space",
  "Shared moment":           "customer_space",
};

/**
 * Determines the local event variant based on content_category.
 * Returns "exterior" for entrance-zone categories, "interior" for customer_space.
 */
export function getLocalEventVariant(
  contentCategory: string | null | undefined
): LocalEventVariant {
  if (!contentCategory) return "interior"; // safe default
  const zone = LOCAL_EVENT_ZONE_MAP[contentCategory];
  return zone === "entrance" ? "exterior" : "interior";
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Returns the fully assembled multimodal image template block for a given post type.
 *
 * The hero section is pre-resolved based on the business category's visual mode
 * (product vs experience). The model receives one clear instruction — no conditionals.
 *
 * For "Local event / news", pass localEventVariant to select exterior vs interior template.
 *
 * @param postType - The post type
 * @param category - The business category (from profile) — used to resolve visual mode
 * @param options.localEventVariant - "exterior" or "interior" for Local event / news
 * @returns Template string block to inject into the multimodal prompt
 */
export function getMultimodalImageTemplate(
  postType: PostType,
  category: string,
  options?: {
    localEventVariant?: LocalEventVariant;
  }
): string {
  const mode = getVisualMode(category);

  // Select the right template source
  let template: TemplateBlocks;

  if (postType === "Local event / news") {
    const variant = options?.localEventVariant ?? "interior";
    template = variant === "exterior" ? LOCAL_EVENT_EXTERIOR : TEMPLATES["Local event / news"];
  } else {
    template = TEMPLATES[postType];
  }

  if (!template) {
    console.warn(`[getMultimodalImageTemplate] No template for post type: "${postType}"`);
    return "";
  }

  // Assemble the final block — hero already resolved by visual mode
  return `[VISUAL JOB]:
${template.visualJob}

[HERO]:
${template.hero[mode]}

[COMPOSITION]:
${template.composition}

[PEOPLE]:
${template.people}

[AVOID]:
${template.avoid}`;
}
