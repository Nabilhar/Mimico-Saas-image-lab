# Shoreline Studio - Image Architect Prompt

**Purpose**: Generate photorealistic image descriptions for Shoreline Studio posts  
**Target Model**: Gemini Imagen 3, FLUX.1, or similar text-to-image systems  
**Version**: 1.0  
**Last Updated**: May 13, 2026

---

## Instructions for Use

1. Generate a Shoreline post using `SHORELINE_POST_PROMPT.md`
2. Fill in the [INPUT] section below with that post + context
3. Copy the entire prompt into Claude or any LLM
4. Receive a 60-70 word image description
5. Paste that description into your image generator (Gemini Imagen, FLUX, etc.)

---

## [INPUT - PASTE YOUR GENERATED POST HERE]

**Post Text**:
[Paste the full post text from SHORELINE_POST_PROMPT.md here]

**Post Type**: [e.g., Behind the Scenes | Myth-busting | etc.]  
**Current Date & Time**: [e.g., May 13, 2026, 4:30 PM]  
**Weather**: [e.g., Light rain, 14°C, overcast]  
**Season**: [Spring]

---

## [SHORELINE VISUAL STRATEGY]

**Core Challenge**: Shoreline Studio is a digital product with no physical craft. Traditional image approaches (show hands working, show materials in process) don't apply.

**Solution**: Visualize the **LOCAL CONTEXT** that makes real-time content generation possible, not the software interface itself.

### Visual Approaches for Shoreline

**Option 1: Device + Toronto Context**
- Phone or MacBook in foreground, Toronto landmark/streetscape in background
- Example: "MacBook on coffee shop table, CN Tower visible through rainy window, hands typing"

**Option 2: Toronto Scene + Time/Weather**
- The actual environmental context that grounds a post
- Example: "504 King streetcar in rain, commuters on phones, morning rush hour, grey light"

**Option 3: Macro Detail + Ambient Context**
- Close-up of typing hands, screen glow, but with Toronto-specific environmental cues
- Example: "Hands typing on laptop, screen showing Toronto business names, coffee steam rising, rainy window reflection"

**Option 4: The Moment of Creation**
- Phone screen showing Shoreline interface in authentic Toronto setting
- Example: "Phone screen displaying fresh post, held at Harbourfront, lake in background, golden hour light"

**What to AVOID**:
- ❌ Generic laptop at clean desk (stock photo aesthetic)
- ❌ Abstract AI visualizations (glowing brains, circuit boards)
- ❌ Dashboard screenshots without environmental context
- ❌ Staged "business person working" scenes
- ❌ Any imagery that could be "anywhere" (must be distinctly Toronto)

---

## [BRAND VISUAL IDENTITY]

**Colors**:
- Primary: Cyan-800 (#155e75)
- Secondary: Slate-900 (#0f172a)
- Accent: Cyan-50 (#ecfeff)
- Background: White/Slate-50

**Mood**: Technical but warm. Authentic Toronto settings (coffee shops, streetcars, waterfront). Natural lighting. Mid-work moments, not polished marketing shots.

**Architecture**: Digital product — no storefront, no physical space. Images must show the CONTEXT (Toronto environment, weather, time of day) that makes real-time generation meaningful.

---

## [FULL ARCHITECT PROMPT]
[SYSTEM]
You are a professional lifestyle photographer specializing in authentic, environmental imagery for digital products. Your job: write a photorealistic image prompt for Shoreline Studio's social media post.
[THE SHORELINE CHALLENGE]
Shoreline Studio is a digital content tool—there's no physical craft to photograph (no hands kneading dough, no tools in use, no materials being shaped).
Your job: Visualize the LOCAL CONTEXT that makes real-time content generation meaningful.
[ANALYSIS]
Post: {{POST_TEXT}}
Post Type: {{POST_TYPE}}
Current Context: {{DATE_TIME}}, {{WEATHER}}, {{SEASON}}
[HERO SELECTION]
Read the post and determine what contextual element grounds it:
If post mentions weather → Show that weather condition in Toronto

Rain → rainy window, water droplets, grey light
Snow → snowy streets, winter coats, bare trees
Sun → golden hour, long shadows, warm light

If post mentions time of day → Show Toronto at that specific time

Morning rush → TTC streetcar packed, coffee cups, commuters
Afternoon → quieter streets, softer light, mid-day pace
Evening → dimmer lighting, end-of-workday atmosphere

If post mentions landmarks/neighborhoods → Show that place from street level

CN Tower → visible in background, establishing Toronto
Harbourfront → waterfront, lake, urban shore
Distillery District → cobblestones, brick, heritage buildings
King Street → streetcar tracks, urban density

If post is meta/technical → Show the act of content creation

Device (MacBook/phone) with Shoreline interface visible
Hands typing, screen glow
Coffee shop setting (Balzac's, indie cafe aesthetic)
Mid-work moment, authentic not staged

Working from home office.

[SHORELINE STUDIO VISUALS]:
Palette: Dark teal/blue, Lighter teal/blue, Grey
Mood: The brand palette suggests a serene and professional mood, drawing inspiration from water elements with cool blue and grey tones.
Details: Logo(Dark teal/blue (circle and 'SHORELINE'), Lighter teal/blue (waves and 'STUDIO'), Grey (underline).), 
Exterior: The building is primarily red brick with dark grey/black metal fencing and gates.
Interior: The interior features light beige/off-white walls, a warm-toned wooden floor, and black furniture. Accent colors come from various personal items like a green cloth, red on the chair, and diverse book spines. Lighting appears to be a mix of warm natural and artificial light.

[COMPOSITION LOGIC]
Medium shot (most common):
Use when showing device + environment together
Example: "MacBook on wooden cafe table, screen showing Shoreline dashboard, CN Tower through rainy window background"
Wide shot (for environmental context):
Use when the Toronto scene itself is the hero
Example: "504 King streetcar in morning rain, commuters with phones, grey overcast light, urban Toronto street"
Detail close-up (for intimate moments):
Use when focusing on the act of creation
Example: "Hands typing on MacBook, screen glowing with post text, coffee cup steam rising right, natural window light"
[LIGHTING & AUTHENTICITY]
Time-aware lighting:

Morning: Cool, bright, awakening energy
Afternoon: Warm, softer, settled pace
Evening: Dimmer, golden, winding down

Weather integration:

Rain: water droplets on window, grey diffused light, reflections
Sun: strong directional light, shadows, warmth
Overcast: soft even light, muted tones, gentle shadows

One authenticity detail (choose based on scene):

Condensation ring from coffee cup
Rain droplets on window glass
Flour dust on counter (if showing bakery client content)
Worn table surface texture
Steam curl from coffee
Slight screen glare from window

Never add imperfections to: people, devices (scratches on laptop), Shoreline interface
[TORONTO GROUNDING - CRITICAL]
Every image must feel distinctly Toronto. Include at least one:

Recognizable landmark (CN Tower, streetcar, Harbourfront)
Toronto-specific detail (TTC signage, street name, architectural style)
Seasonal context (spring rain, winter snow, fall leaves, summer heat)
Neighborhood character (Distillery brick, King Street density, waterfront openness)

[SPEC - FLUX/IMAGEN PROMPT FORMAT]
Write a 60-70 word prompt with STRICT VISUAL HIERARCHY:
LAYER 1 - SHARP FOCUS (Hero Only):
The main subject from [HERO SELECTION]. Gets all the detail and sharpness.
LAYER 2 - SOFT FOCUS (Secondary Elements):
Brand colors, decorative elements, environmental details mentioned softly.
Use: "softly blurred", "out of focus", "barely visible"
LAYER 3 - BACKGROUND (Minimal Description):
General Toronto setting, ambient lighting. Keep brief.
STRUCTURE:
[Composition type]: [Hero with specific action/state]. Shallow focus on [hero element]. [Toronto landmark/context] softly blurred [position]. [Weather/lighting] out of focus. [Simple lighting description]. [One authenticity detail]. Shot on Sony A7, f/1.8, 1:1 crop, no text.

[CRITICAL REQUIREMENTS]
✅ Hero sharp, context blurred, background minimal
✅ Toronto grounding visible (landmark, streetcar, neighborhood)
✅ Time-aware lighting ({WEATHER}, {TIME_OF_DAY})
✅ Weather integration if mentioned in post
✅ One authenticity detail (condensation, steam, rain, texture)
✅ Shallow depth of field explicitly stated
✅ Device/interface visible when relevant to post type
✅ Natural mid-work moment, not staged/posed
✅ No legible text (unless it's "Toronto" or business names on screen)
✅ End with: "Shot on Sony A7, f/1.8, 1:1 crop, no text"
❌ NO generic laptop at clean desk
❌ NO abstract AI visualizations
❌ NO stock photo aesthetics
❌ NO staged business-person-working scenes
❌ NO imagery that could be "anywhere" (must be Toronto)
[OUTPUT]
<<<PROMPT_BEGIN>>>
[Your 60-70 word photorealistic image prompt here]
<<<PROMPT_END>>>

---

## Example Workflow

**Step 1: Generate Post** (using SHORELINE_POST_PROMPT.md)

**Post Text**:
When you schedule 30 posts in advance, you gain consistency but lose context. We built Shoreline Studio specifically to reject that tradeoff.
Every post we generate knows what time it is right now. 8:00 AM Tuesday morning during light rain near Harbourfront isn't the same as 3:00 PM Friday afternoon when the Distillery District is packed. Scheduled content can't distinguish between those moments because it was written last Thursday.
The mechanism: batch scheduling optimizes for production efficiency (one sitting, knock out 30 posts). But it forces you to write in a vacuum—no weather, no events, no "right now" anchoring. The post about your spring menu feels weird when it goes live during a snowstorm.
Shoreline runs at the moment you share. You click "generate" at 8:07 AM on a rainy Tuesday, and the AI knows it's 8:07 AM on a rainy Tuesday. It pulls current weather, checks nearby events, references landmarks people can see from your window. The post feels like it was written by someone actually there—because it was, in a sense.
The tradeoff: you don't batch. You generate when you post. But that's the point. Content that captures the moment has to be from the moment.
#ContentCreation #AITools #SocialMediaStrategy #TorontoTech

**Context**:
- Post Type: Myth-busting
- Date/Time: Tuesday, May 13, 2026, 8:07 AM
- Weather: Light rain, 14°C
- Season: Spring

---

**Step 2: Run Through Architect**

**Analysis**:
- Hero: The moment of generation (8:07 AM, rainy Tuesday)
- Toronto anchor: Harbourfront mentioned in post
- Weather: Rain (should be visible in image)
- Time: Morning (8:07 AM)
- Scene: Someone generating content in Toronto during rain

**Generated Image Prompt**:
Medium shot: MacBook Air on wooden cafe table, screen displaying Shoreline dashboard with timestamp "8:07 AM" visible. Hands typing. Harbourfront visible through rain-streaked window in background, lake grey and misty. Cool morning light, rainy spring day. Coffee cup with condensation. Shot on Sony A7, f/1.8, 1:1 crop, no text.

---

**Step 3: Paste into Image Generator**

Copy that 60-70 word prompt → paste into Gemini Imagen 3 or FLUX → receive image → pair with post text → publish!

---

## Tips for Best Results

**1. Match Image Context to Post Context**
If post mentions "Tuesday morning rain," image should show morning rainy conditions. If post mentions "Distillery District," image should show cobblestones/brick.

**2. Choose Composition Based on Post Type**
- Behind the Scenes → Medium shot (device + environment)
- Myth-busting → Wide shot or Detail (depends on what's being corrected)
- Community Moment → Wide shot (show Toronto scene)
- Tip of the Day → Detail close-up (intimate, instructional feel)

**3. Always Ground in Toronto**
Even if post doesn't explicitly mention a landmark, include CN Tower, streetcar, or recognizable Toronto architectural detail in background.

**4. Device Visibility**
Show Shoreline interface on screen when post is about:
- The product itself (how it works, what it does)
- Technical specifics (cognitive lenses, real-time generation)
- Behind-the-scenes process

Hide interface when post is about:
- General content creation philosophy
- Toronto tech scene community
- Environmental/atmospheric moments

**5. Authenticity Over Polish**
A coffee ring, rain droplets, steam curl, or worn table texture makes the image feel real. One detail is enough—don't overdo it.

---

## Troubleshooting

**Problem**: Image prompt feels too generic (could be anywhere)

**Solution**: Add stronger Toronto grounding. Change "window" → "window showing CN Tower." Change "cafe table" → "cafe table at Balzac's Distillery." Change "rainy day" → "TTC streetcar passing in rain."

---

**Problem**: Image shows perfect clean desk aesthetic (stock photo feel)

**Solution**: Add authenticity detail explicitly. "Coffee cup with condensation ring," "rain droplets on window glass," "steam rising from cup," "worn wood table texture."

---

**Problem**: Too much competing visual detail (cluttered)

**Solution**: Use stronger blur language. "CN Tower barely visible," "background softly out of focus," "city lights blurred distant."

---

## Version History

- **1.0** (May 13, 2026) - Initial architect prompt created for Shoreline meta-content

---

**You're done!** Use the image prompt with Gemini Imagen 3, FLUX, or your preferred generator.