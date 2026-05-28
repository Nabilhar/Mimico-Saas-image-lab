// lib/image-mode-templates.ts

/**
 * IMAGE MODE TEMPLATES — Per-mode hero extraction for the Architect prompt
 *
 * Each mode defines:
 * - VISUAL JOB: What the image does (complement the text, not duplicate it)
 * - EXTRACTION: How to read the post and find the hero
 * - HERO: What should be sharp and in focus
 * - COMPOSITION: Default framing logic
 * - AVOID: Mode-specific anti-patterns
 * - EXAMPLE: One good FLUX prompt example
 *
 * Shared sections (SYSTEM, VOICE, BRAND, LIGHTING, OUTPUT format) stay in
 * the architect prompt builder — these templates replace only the
 * MOMENT EXTRACTION + HERO + COMPOSITION + AVOID sections.
 */

export type PostType =
  | "Tip of the Day"
  | "Myth-busting"
  | "Behind the scenes"
  | "Promotion / offer"
  | "Local event / news"
  | "Community moment";

export const IMAGE_MODE_TEMPLATES: Record<PostType, string> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // MYTH-BUSTING — "This is what right looks like"
  // ═══════════════════════════════════════════════════════════════════════════
  "Myth-busting": `[VISUAL JOB]:
The text corrects a misconception — it explains what people get wrong.
The image shows what RIGHT looks like. The finished, correct result.
Not the process of correcting. Not the myth. The truth, as a visible outcome.

Text teaches the correction. Image proves it.

[HERO EXTRACTION]:
Read the post and identify:
1. What misconception is being corrected?
2. What does the CORRECT outcome look like as a physical, visible thing?
3. What specific detail in the correct result would make someone say
   "oh, THAT'S what it should look like"?

The hero is the correct result — the product, material, or outcome
in its proper state. Show it with precision. The viewer should see
the difference between right and wrong without the text explaining it.

Examples:
- Myth about bread crust → Hero: a properly formed crust, blistered
  and scored correctly, detail visible
- Myth about skin hydration → Hero: properly hydrated skin surface,
  product absorbed, texture visible
- Myth about engine oil → Hero: clean oil on dipstick at correct level,
  amber color visible against metal

[COMPOSITION]:
Default: Detail close-up or Medium shot
The correct result needs to be precise and visible. Get close enough
to show why it's right.

Detail: When the correction is about texture, finish, or a small
visual difference (crust surface, skin texture, fluid color)
Medium: When the correction is about form, proportion, or technique
result (loaf shape, posture alignment, plating arrangement)

[AVOID]:
- Showing the myth or the wrong version
- Process shots — this is the outcome, not the correction happening
- Split before/after compositions — just show the right version
- Generic product beauty shots without the specific detail that
  proves the correction
- Conceptual or abstract representations of "truth"
- People reacting to the correction

[EXAMPLE]:
"Detail close-up: Sourdough crust with irregular blistering and deep
scoring, crumb visible at the slash opening. Shallow focus on crust
surface texture. Flour-dusted wooden board edge softly blurred below.
Warm kitchen background out of focus. Morning light from left, 9 AM.
Light flour dust on board edge. Shot on Sony A7, f/1.8, 1:1 crop,
no text."`,


  // ═══════════════════════════════════════════════════════════════════════════
  // TIP OF THE DAY — "This is what the technique produces"
  // ═══════════════════════════════════════════════════════════════════════════
  "Tip of the Day": `[VISUAL JOB]:
The text teaches a specific technique or craft action.
The image shows what that technique PRODUCES — the finished result.
Not the hands doing it. Not the tool in use. The outcome.

Text teaches the how. Image shows the what-you-get.

[HERO EXTRACTION]:
Read the post and identify:
1. What technique or action is being taught?
2. What does the RESULT look like when this technique is applied correctly?
3. What visible quality in the finished product proves the tip works?

The hero is the finished product or outcome that the technique creates.
Show the result with enough detail that the viewer connects it to the
craft knowledge in the text.

Examples:
- Tip about bread cooling time → Hero: cleanly sliced bread with
  intact crumb structure, no gumming
- Tip about hair sectioning → Hero: finished color with clean
  transitions between tones
- Tip about oil change interval → Hero: engine bay, clean components,
  visible maintenance quality
- Tip about plant pruning → Hero: a well-shaped plant showing healthy
  new growth at the cut points

[COMPOSITION]:
Default: Detail close-up or Medium shot
Show the result with craft quality visible. The viewer should see
the quality that the technique produces.

Detail: When the tip produces a visible texture, finish, or surface
quality (crumb structure, color transition, surface smoothness)
Medium: When the tip produces a visible form, shape, or arrangement
(plant shape, plating result, styled outcome)

[AVOID]:
- Hands mid-technique — the text already teaches the action
- Tools in use — the text already names them
- Step-by-step process shots
- Generic "beautiful product" without the specific quality the tip produces
- Raw ingredients or materials before the technique is applied

[EXAMPLE]:
"Medium shot: Freshly sliced sourdough on wooden board, three clean
slices fanned showing open crumb structure with irregular holes intact.
Shallow focus on crumb detail of nearest slice. Bread knife handle
softly blurred to the right. Kitchen counter and window out of focus.
Afternoon light, 2 PM. Small crumb scatter on board surface. Shot on
Sony A7, f/1.8, 1:1 crop, no text."`,


  // ═══════════════════════════════════════════════════════════════════════════
  // BEHIND THE SCENES — "This is what came out"
  // ═══════════════════════════════════════════════════════════════════════════
  "Behind the scenes": `[VISUAL JOB]:
The text describes a moment of process — hands in dough, checking temps,
adjusting mid-work. The reader sees the labor.
The image shows what that labor PRODUCED — the finished product.

Text shows the work. Image shows the payoff.

This is the strongest product showcase moment in the system. The text
earns the product shot by showing the craft behind it. The image
delivers the result the viewer wants to see.

[HERO EXTRACTION]:
Read the post and identify:
1. What process or craft moment is described?
2. What FINISHED PRODUCT would come out of this process?
3. What quality in the finished product reflects the care described
   in the text?

The hero is the completed work — the final product, the finished
service result, the thing that customers actually receive. Show it
in its environment, just completed, with the quality that the
behind-the-scenes effort produced.

Examples:
- BTS about shaping dough at dawn → Hero: finished loaves cooling on
  a rack, golden and scored
- BTS about mixing hair color → Hero: finished color on a client
  (back of head, no face), rich and even
- BTS about prep work in a kitchen → Hero: plated dish, complete
  and ready, with the detail the prep enabled
- BTS about checking equipment → Hero: the workspace ready and clean,
  tools in place, environment set

[COMPOSITION]:
Default: Medium shot
The finished product in its natural environment — just completed,
not styled for a catalogue. It should feel like the owner just stepped
back and looked at what they made.

Medium: Most common — product with enough environment to feel real
(the rack, the counter, the station)
Detail: When the craft quality is in the surface or texture (glaze,
finish, weave, color)
Wide: Rarely — only when the "product" is the whole prepared space
(a set dining room, a prepped studio)

[AVOID]:
- Process shots — the text already covers the process
- Hands mid-work — the text already shows that
- Raw materials or ingredients before transformation
- Perfectly styled catalogue photography — this should feel just-finished,
  not art-directed
- Empty workspace shots without the finished product

[EXAMPLE]:
"Medium shot: Four sourdough boules cooling on a wire rack, golden crust
with dark scoring lines, steam still barely visible from the nearest loaf.
Shallow focus on the front loaf's crust detail. Flour-dusted wood bench
softly blurred below. Brick wall and shelf with proofing baskets out of
focus behind. Early morning light, 6:30 AM. Flour handprint on bench
edge. Shot on Sony A7, f/1.8, 1:1 crop, no text."`,


  // ═══════════════════════════════════════════════════════════════════════════
  // PROMOTION / OFFER — "This is what you get"
  // ═══════════════════════════════════════════════════════════════════════════
  "Promotion / offer": `[VISUAL JOB]:
The text grounds an offer in an observation and states the details.
The image features the actual product or service being offered.
This is the one mode where text and image align on the same subject —
both presenting what the customer gets.

Text states the offer. Image makes it desirable.

[HERO EXTRACTION]:
Read the post and identify:
1. What specific product or service is being offered?
2. What does it look like, assembled, complete, ready for the customer?
3. What makes it visually appealing — abundance, craft quality, freshness,
   the specific thing that makes someone want it?

The hero is the offer itself — the bundle laid out, the service result,
the product as the customer would receive it. Show it invitingly but
not in a staged, catalogue way. It should feel like it's sitting on a
counter waiting to be picked up.

Examples:
- Picnic bundle offer → Hero: three sandwiches, focaccia, and biscotti
  arranged together on paper, ready to go
- First-visit discount at a salon → Hero: the chair and station set up,
  tools laid out, welcoming and ready
- Seasonal drink special → Hero: the drink on the counter, condensation
  visible, garnish fresh
- Service package → Hero: the workspace prepared for the service,
  materials visible and arranged

[COMPOSITION]:
Default: Medium shot
The offer needs to be fully visible and inviting. Close enough to see
quality, wide enough to see completeness.

Medium: Most common — the full offer visible with environment context
Detail: When the offer is a single item with surface appeal (a drink,
a specific product, a treatment result)
Wide: When the offer is an experience or space-based (event space,
studio session, multi-element experience)

[AVOID]:
- Generic stock-photo product shots
- Overhead flat-lay styling — feel like a counter, not a photo shoot
- Excessive garnish or props that distract from the actual offer
- Empty space without the product
- People holding or using the product — let it sit there and speak
- Hype-matching visuals (bright colors, urgency cues, "sale" energy)

[EXAMPLE]:
"Medium shot: Picnic bundle on brown paper — three wrapped sandwiches,
focaccia round, and biscotti in a paper bag, arranged casually on a
wooden counter. Shallow focus on the focaccia's golden crust. Paper
wrapping edges and counter surface softly blurred. Cafe interior with
warm pendant lights out of focus behind. Late morning light, 11 AM.
Small crumbs on counter. Shot on Sony A7, f/1.8, 1:1 crop, no text."`,


  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL EVENT / NEWS — "This is where we are"
  // ═══════════════════════════════════════════════════════════════════════════
  "Local event / news": `[VISUAL JOB]:
The text pairs a business observation with a local event — it's about
the connection between the business and the neighborhood.
The image shows the business in its street context — the entrance,
the storefront, the patio, the signage as part of the block.

Text connects inside to outside. Image shows the outside.

[HERO EXTRACTION]:
Read the post and identify:
1. What is the relationship between the business and the neighborhood
   in this post?
2. What does the entrance or storefront look like from the street?
3. What environmental detail connects this business to the local context
   — a seasonal decoration, patio activity, street-level signage,
   neighboring businesses?

The hero is the business entrance or storefront as part of its
street scene. Not a real estate photo of the building — a lived-in,
street-level view that says "this is here, on this block, in this
neighborhood."

Examples:
- Post about a spring market nearby → Hero: storefront with door open,
  sandwich board out, spring light on the sidewalk
- Post about a local school event → Hero: patio with a few chairs,
  street visible, pedestrians passing
- Post about weather shift → Hero: entrance in the rain/sun/snow,
  awning deployed, seasonal atmosphere visible

[COMPOSITION]:
Default: Wide or Medium shot
The business needs neighborhood context — the street, adjacent
buildings, sidewalk life.

Wide: Most common — the storefront with enough street context to feel
like a neighborhood, not a building in isolation
Medium: When focusing on the entrance area with some street visible —
the door, the patio, the sandwich board
Detail: Rarely — only for a specific storefront detail that connects
to the event (seasonal decoration, posted flyer, patio setup)

[AVOID]:
- Interior shots — this mode is about the outside
- Real estate photography — flat, centered, full-building
- Empty streets — include ambient street life (parked bikes, pedestrians
  softly blurred, neighboring shop fronts)
- Night shots unless the post specifically references evening
- Aerial or elevated angles — keep it street-level, pedestrian POV
- The event itself — the image shows the business, not the event

[EXAMPLE]:
"Wide shot: Corner storefront with open glass door and sidewalk
sandwich board, spring afternoon light on the pavement. Shallow focus
on the entrance and board. Pedestrian with tote bag softly blurred
passing on sidewalk. Adjacent brick building and street trees out of
focus. Afternoon light, 3 PM, warm sun on west-facing facade. Chalk
smudge on sandwich board edge. Shot on Sony A7, f/1.8, 1:1 crop,
no text."`,


  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY MOMENT — "This is what it looks like here"
  // ═══════════════════════════════════════════════════════════════════════════
  "Community moment": `[VISUAL JOB]:
The text describes a recurring customer pattern — what people do in
the space, where they settle, how they use the room.
The image shows that space in use — with evidence of customer activity
and the product naturally present.

Text describes the pattern. Image shows what the room looks like
when the pattern is happening.

[HERO EXTRACTION]:
Read the post and identify:
1. Where in the space does this pattern play out? (the bench, the
   counter, the corner table, the waiting area)
2. What evidence of customer activity would be visible? (cups, plates,
   bags, a laptop, a phone, a rolled mat, a jacket on a chair)
3. What product or offering is naturally present in the scene?
   (coffee on the table, food being shared, a service result visible)

The hero is the customer space in use — the specific spot where the
pattern happens, with product visible as part of the scene. People
can appear as bodies, hands, and silhouettes (no legible faces) but
are secondary to the space and product. The product is not staged —
it's there because someone is using it.

Examples:
- Pattern of people sharing at a table → Hero: table with torn bread,
  two coffee cups, hands reaching (no faces)
- Pattern of a solo regular → Hero: corner chair with a single cup,
  book, and jacket draped on the back
- Pattern during a lull → Hero: counter with one cup, phone beside it,
  empty stools visible, afternoon light
- Pattern of post-class gathering → Hero: lobby bench with water
  bottles, a rolled mat leaning, bags on the floor

[COMPOSITION]:
Default: Medium or Wide shot
The space needs to feel occupied — evidence of people using it, even
if people aren't fully visible.

Medium: Most common — the specific spot (table, counter, bench) with
product and activity evidence
Wide: When the pattern is about the whole room's energy (peak rush,
the lull, the weather-shaped shift)
Detail: When the product on the table IS the moment — two cups, torn
bread, shared plates close up

[AVOID]:
- Empty room atmospheric shots — something must show human use
- Perfectly clean and styled spaces — lived-in, mid-use, not reset
- People as portrait subjects — they're bodies and hands, never faces
- Interior design photography — this is a space being used, not shown
- Product hero shots — the product is present, not featured
- Sentimental staging (friends laughing, hands clasped) — just show
  what's on the table and who's sitting where

[EXAMPLE]:
"Medium shot: Corner table by window with two coffee cups, torn
sourdough half on paper, phone flat on the table. Shallow focus on
the bread and cups. Two seated figures from chest down softly blurred
behind the table. Window with afternoon street light and pedestrians
out of focus. 3 PM warm light from the right. Coffee ring stain on
table surface. Shot on Sony A7, f/1.8, 1:1 crop, no text."`,
};


/**
 * Get the image mode template for a given post type
 */
export function getImageModeTemplate(postType: PostType): string {
  const template = IMAGE_MODE_TEMPLATES[postType];
  if (!template) {
    throw new Error(`No image mode template found for post type: ${postType}`);
  }
  return template;
}
