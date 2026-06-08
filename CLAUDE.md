# CLAUDE.md — Shoreline Studio

**Project:** Shoreline Studio  
**Production URL:** https://shorelinestudio.ca  
**Status:** Pre-launch (Development Complete, May 2026)  
**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase · Clerk · Multi-provider AI

> This file is the primary working reference. Read it before starting any task.

---

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [Project File Map](#project-file-map)
3. [Architecture Overview](#architecture-overview)
4. [Data Flows](#data-flows)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Key Components](#key-components)
8. [Environment Variables](#environment-variables)
9. [Credit System](#credit-system)
10. [Dead Code — Do Not Touch](#dead-code--do-not-touch)
11. [Cleanup Backlog](#cleanup-backlog)
12. [Common Debug Queries](#common-debug-queries)

---

## What This Project Does

Shoreline Studio is an AI-powered social media content generation platform for **local businesses**. Given a business profile + 3 zone photos, it:

1. **Runs brand discovery** — Gemini vision extracts colors/layout per zone; Gemma/Haiku researches offerings + neighbourhood online
2. **Generates social posts** — Claude Haiku builds mode-specific prompts injecting brand data, zone info, local context, and a rotated offering
3. **Generates matching images** — Gemini multimodal uses the user's actual zone photo as reference to produce a photorealistic image grounded in the real space

Users are local business owners (hair salons, HVAC, yoga studios, bakeries, etc.). Content is text-first; images are optional add-ons.

---

## Project File Map

```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx                   # Main content studio — tabs: Generate / Saved Library
│   │                                  # Owns: business data fetch, post save RPC, credit display
│   │
│   ├── profile/
│   │   └── page.tsx                   # Business setup + brand discovery
│   │                                  # Has 3 labeled zone photo slots (entrance/customer_space/work_space)
│   │
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx                   # Clerk sign-in page
│   │
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts               # TEXT generation endpoint (POST)
│   │   │                              # Fallback chain: anthropic → openrouter → deepinfra
│   │   │                              # ⚠ Contains dead code: buildLegacyPrompt, gemma/gemini branches
│   │   │
│   │   ├── generate-image/
│   │   │   └── route.ts               # IMAGE polling endpoint (POST)
│   │   │                              # Polls DB for image_prompt; runs FLUX chain if Architect path
│   │   │                              # ⚠ Contains unused: textModel, imageModel, const tools
│   │   │
│   │   ├── prepare-image-prompt/
│   │   │   └── route.ts               # Image prompt architect — fire-and-forget (POST)
│   │   │                              # PATH A (default): GEMINI_MULTIMODAL — zone photo → Gemini → image_url saved to DB
│   │   │                              # PATH B (fallback): ARCHITECT — Gemma writes FLUX prompt → image_prompt saved to DB
│   │   │                              # ARCHITECT_MODE hardcoded at line 39 (not env-controlled): "GEMMA"
│   │   │
│   │   ├── discover-brand/
│   │   │   └── route.ts               # Brand discovery endpoint (POST)
│   │   │                              # Runs: vision (Gemini) + research (Gemma/Haiku) concurrently
│   │   │
│   │   ├── user/
│   │   │   └── claim-welcome-credits/
│   │   │       └── route.ts           # One-time 25-credit claim for new users
│   │   │
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts           # Clerk webhook → handle_new_user() RPC (creates profiles row)
│   │
│   ├── globals.css                    # Global styles
│   └── layout.tsx                     # Root layout (Clerk provider)
│
├── components/
│   ├── GenerateDashboard.tsx          # Content generation UI — post type picker, voice, generate button
│   │                                  # Owns: fire-and-forget prepare-image-prompt, polling loop (every 3s, max 20 attempts)
│   │                                  # Calls save_image_and_deduct RPC on image success
│   │
│   ├── PostActions.tsx                # Copy / Download / Delete buttons per post card
│   ├── SavedImage.tsx                 # Image display component in saved library
│   └── SiteHeader.tsx                 # Top nav bar
│
└── lib/
    ├── brandDiscovery.ts              # All brand discovery logic (vision + research merge)
    │                                  # Photo-to-zone matching by label (not array order)
    │
    ├── parse-business-intel.ts        # parseZones(), extractOfferingNames(), extractPracticesByOffering()
    │                                  # Handles BOTH old array format AND new nested object format for products_services
    │
    ├── offering-rotation.ts           # getOfferingCatalog(), selectNextOffering()
    │                                  # Fetches last 5 posts' offerings_referenced, picks next unused
    │
    ├── post-history.ts                # getRecentPostHistory(), getRecentOfferingsInOrder()
    │                                  # ⚠ getRecentOfferings() is deprecated — use getRecentOfferingsInOrder()
    │
    ├── post-parser.ts                 # parseGeneratedPost(), validateOfferings()
    │                                  # Extracts structured metadata from raw model output
    │
    ├── mode-templates.ts              # 5 active post mode templates (6th "Myth-busting" is dead)
    │
    ├── prompt-builder.ts              # buildModePrompt() — fills mode templates with business context
    │                                  # ⚠ Still passes lens/lensDefinition (dead fields — resolve to "")
    │
    ├── image-mode-templates-multimodal.ts  # Image templates for GEMINI_MULTIMODAL path (primary)
    ├── image-mode-templates.ts        # ⚠ ARCHITECT/FLUX PATH ONLY — not used in multimodal path
    ├── image-brand-variables.ts       # buildBrandVariables() — structured brand context for Architect
    ├── image-visual-mode.ts           # Maps business category → "product" | "experience" visual mode
    ├── post-type-zone-focus.ts        # resolveZoneFocus(postType) → which zone photo to use
    ├── select-zone-photo.ts           # selectZonePhoto() — fetches Supabase URL of the right zone photo
    │
    ├── category-selector.ts           # selectCategory() — picks post type sub-category
    ├── supabase.ts                    # createClerksupabase() — Supabase client with Clerk JWT
    ├── constants.ts                   # NICHE_DATA, CATEGORIES, VOICES, POST_TYPES, ColorTheme interface
    │
    │ ── DEAD / LEGACY — SCHEDULED FOR DELETION ──────────────────────────
    ├── cognitive-lenses.ts            # ⛔ DEAD — 4 lenses × 5 variants, nothing uses them
    ├── angle-selector.ts              # ⛔ DEAD — selectAngle() is called but output is unused
    ├── frameworks.ts                  # ⛔ DEAD — PAS/BAB/AIDA used only by buildLegacyPrompt
    ├── group-angle-selector.ts        # ⛔ LIKELY DEAD — verify before touching
    ├── lens-groups.ts                 # ⛔ LIKELY DEAD — verify before touching
    ├── lens-mapping.ts                # ⛔ LIKELY DEAD — verify before touching
    └── niche-to-group-map.ts          # ⛔ LIKELY DEAD — verify before touching
```

---

## Architecture Overview

```
USER
 │
 ├─ Clerk (auth) ──────────────────────────────────── Supabase RLS
 │
 ├─ /profile ──── photos + form ──► /api/discover-brand
 │                                       ├─ Gemini Vision (zones, colors)
 │                                       └─ Gemma/Haiku + Google Search (offerings, neighbourhood)
 │                                       └─ Saves to: businesses.zones, businesses.business_description
 │
 └─ /dashboard
       │
       ├─ "Generate" tab → GenerateDashboard.tsx
       │       │
       │       ├─ POST /api/generate ──► Claude Haiku (primary) → OpenRouter → DeepInfra
       │       │       Returns: content + structured metadata
       │       │       Saved via: save_post_and_deduct() RPC (2 credits)
       │       │
       │       └─ "Generate Image" (optional, needs saved postId)
       │               │
       │               ├─ fire-and-forget → POST /api/prepare-image-prompt
       │               │       PATH A (GEMINI_MULTIMODAL): zone photo → Gemini → image_url written to DB
       │               │       PATH B (ARCHITECT): Gemma → FLUX prompt written to DB as image_prompt
       │               │
       │               └─ poll every 3s → POST /api/generate-image (max 20 attempts / 60s)
       │                       PATH A: image_url already set → return immediately
       │                       PATH B: prompt found → DeepInfra → OpenRouter → HuggingFace → Cloudflare → Pollinations
       │                       On success: save_image_and_deduct() RPC (3 credits)
       │
       └─ "Saved Library" tab — displays community_posts with PostActions
```

### AI Provider Summary

| Purpose | Primary | Fallbacks |
|---------|---------|-----------|
| Text generation | Claude Haiku 4.5 (Anthropic direct) | OpenRouter → DeepInfra (gpt-oss-120b) |
| Vision analysis | Gemini 2.5 Flash (Google API) | DeepInfra (google/gemini-2.5-flash, OpenAI-compat) |
| Brand research | Gemma 4 31B + Google Search | Haiku + web_search (via DISCOVERY_RESEARCH_PROVIDER) |
| Image generation (multimodal) | gemini-3.1-flash-image-preview (Google API direct) | gemini-3.1-flash-image-preview (OpenRouter) |
| Image generation (FLUX chain) | DeepInfra FLUX-2-pro | OpenRouter FLUX.2 Pro → HuggingFace FLUX.1-schnell → Cloudflare SDXL → Pollinations |

---

## Data Flows

### 1. Content Generation (detailed)

```
1. Dashboard sends: business fields, postType, voice, history[], address
2. generate/route.ts:
   a. Fetches active business from Supabase (including zones, brand data)
   b. selectAngle() → cognitive lens [DEAD OUTPUT — ignore result]
   c. getRecentPostHistory() → last N categories + summaries (dedup)
   d. getRecentOfferingsInOrder() → last 5 posts' offerings (most recent first)
   e. selectNextOffering() → picks offering not in recent list
   f. buildModePrompt() → fills mode template with:
      - Business: name, niche, neighbourhood, landmarks, transit
      - Zone: layout + colors for the relevant zone
      - Offering: name + its signature practices
      - Weather, time, season
      - Recent history (for variety)
   g. callAIProvider() → Anthropic → OpenRouter → DeepInfra
   h. parseGeneratedPost() → extracts content_summary, offerings_referenced, hook_used, etc.
   i. validateOfferings() → cross-checks against known catalog
3. Dashboard receives structured response
4. GenerateDashboard shows post → user saves
5. save_post_and_deduct() RPC: saves community_posts row + deducts 2 credits
```

### 2. Image Generation (detailed)

```
User clicks "Generate Image" (requires saved postId):

STEP 1 — fire-and-forget (prepare-image-prompt):
  → Fetch post (content, post_type) + business (all brand data) from DB
  → resolveZoneFocus(postType) → which zone photo to use
  → selectZonePhoto() → fetch Supabase URL of zone photo

  PATH A — GEMINI_MULTIMODAL (IMAGE_GENERATION_MODE=GEMINI_MULTIMODAL, default in prod):
    → SENTINEL: clear image_prompt + image_url to null (poller returns WAITING during generation)
    → fetch zone photo → convert to base64
    → build multimodal prompt (post content + brand context + zone description)
    → IMAGE_GEN_ENGINE_MODE=FALLBACK: try Google API first, then OpenRouter (same model)
    → model: gemini-3.1-flash-image-preview
    → upload result to Supabase post-images bucket
    → write image_url FIRST to community_posts (poller detects this and returns immediately)
    → write Gemini text description to image_prompt SECOND
    → polling route sees image_url already set → returns immediately, FLUX chain never fires

  PATH B — ARCHITECT (fallback when no zone photo, or IMAGE_GENERATION_MODE=ARCHITECT):
    → buildBrandVariables() → structured brand context
    → getImageModeTemplate(postType) → post-type-specific image instruction
    → Gemma 4 31B writes 60-70 word FLUX prompt
    → write prompt to community_posts.image_prompt (or "ERROR: ..." on failure)

STEP 2 — polling (generate-image, every 3s, max 20 attempts):
  202 { status: 'WAITING' }  → image_prompt is null → keep polling
  200 { url }                → image_url already set (PATH A) → done
  500 { status: 'ERROR' }   → image_prompt starts with "ERROR:" → failed
  prompt found (PATH B)      → FLUX chain: DeepInfra → OpenRouter → HuggingFace → Cloudflare → Pollinations
  All hosted results → uploaded to Supabase post-images bucket

STEP 3 — on success:
  Dashboard calls save_image_and_deduct() RPC → sets image_url + deducts 3 credits
```

### 3. Brand Discovery (detailed)

```
Triggered from profile page on save (with photos and/or "Re-run" checkbox):

Two parallel paths (Promise.allSettled):

PATH A — Vision (VISION_ENGINE_MODE=FALLBACK: Google API → DeepInfra):
  → Photos matched to zones by label (entrance / customer_space / work_space)
  → Interleaved with zone headers → sent to Gemini 2.5 Flash
  → Primary: Google AI SDK (google/gemini-2.5-flash)
  → Fallback: DeepInfra OpenAI-compatible API (google/gemini-2.5-flash)
  → Both paths use identical buildVisionPrompt() — same output schema
  → <think> blocks and trailing content stripped before JSON parse (extractJson helper)
  → Returns per zone: layout (spatial_arrangement, focal_feature, materials, lighting, activity_zone)
                      colors (dominant, supporting, accent, materials_palette)
  → Returns global: color_theme (primary, secondary, accent, description)
  → Saves to: businesses.zones, businesses.color_theme
  → Cost: FREE

PATH B — Web Research (Gemma 4 or Haiku, via DISCOVERY_RESEARCH_PROVIDER):
  → 5 web searches about the business
  → Returns: description, products_services (nested object format), neighbourhood, contact
  → products_services format: { "Offering Name": ["practice 1", "practice 2", ...], ... }
  → Saves to: businesses.business_description, businesses.contact_info
  → Cost: Free (first time), 3 credits (Tier 1 after first), Free (Tier 2 always)

Merge:
  → brand_source = "photos" if vision ran AND (color visible OR ≥2 zones visible)
  → brand_source = "text_search" otherwise
```

---

## Database Schema

### Tables

```
profiles
├─ id (TEXT, PK)                       — Clerk user ID
├─ email (TEXT)
├─ created_at (TIMESTAMP)
├─ credits (INTEGER)                   — User's credit balance
├─ tier (INTEGER)                      — 1 = Free, 2 = Premium
└─ free_text_discovery_used (BOOLEAN)

businesses
├─ id (UUID, PK)
├─ user_id (TEXT, FK → profiles.id)
├─ business_name (TEXT)
├─ street, city, province_state, country, postal_code (TEXT)
├─ category (TEXT)                     — e.g., "Health & Wellness"
├─ niche (TEXT)                        — e.g., "Physiotherapy Clinic"
├─ voice (TEXT)
├─ is_active (BOOLEAN)
├─ brand_source (TEXT)                 — "photos" | "text_search" | null
├─ color_theme (JSONB)                 — {primary, secondary, accent, description}
├─ zones (JSONB)                       — Per-zone layout + colors (entrance/customer_space/work_space)
├─ business_description (JSONB)        — {description, products_services, neighbourhood, landmarks, transit, local_trends}
├─ contact_info (JSONB)
├─ last_analyzed_business_name (TEXT)
├─ last_analyzed_street, last_analyzed_city (TEXT)
├─ last_text_discovery_at (TIMESTAMP)
│
│  ── LEGACY columns (no longer written by new discovery) ──────────────
├─ business_visuals (JSONB)            — ⚠ LEGACY: {logoColors, storefrontColors, interiorColors}
├─ storefront_architecture (JSONB)     — ⚠ LEGACY
└─ interior_layout (JSONB)             — ⚠ LEGACY

community_posts
├─ id (UUID, PK)
├─ business_id (TEXT)                  — ⚠ Stores USER ID (not business UUID) — historical quirk
├─ content (TEXT)
├─ image_url (TEXT, nullable)
├─ image_prompt (TEXT, nullable)       — Written by Architect; "ERROR: ..." on failure
├─ created_at (TIMESTAMP)
├─ business_name (TEXT)                — Snapshot at creation
├─ location_snapshot (TEXT)            — Snapshot at creation
├─ post_type (TEXT)                    — "Tip of the Day" | "Behind the scenes" | etc.
├─ content_category (TEXT)             — Sub-category within post type
├─ content_summary (TEXT)              — Short summary for deduplication
├─ offerings_referenced (TEXT[])       — Which offerings were featured
├─ event_referenced (TEXT)
├─ hook_used (TEXT)
├─ voice_used (TEXT)
├─ ai_provider (TEXT)
├─ word_count (INTEGER)
├─ tokens_used (INTEGER)
└─ cognitive_lens (TEXT)               — ⚠ Written but serves no active purpose (lens system is dead)
```

### Key Relationships

```
profiles (1) ──► (many) businesses
profiles (1) ──► (many) community_posts (via community_posts.business_id = profiles.id)
```

### Supabase RPCs

| Function | Called by | Purpose |
|----------|-----------|---------|
| `get_active_business(p_user_id)` | Dashboard | Fetch user's active business |
| `save_post_and_deduct(...)` | Dashboard `savePostToCloud()` | Save post + deduct 2 credits atomically |
| `save_image_and_deduct(target_post_id, new_image_url, clerk_user_id)` | GenerateDashboard | Set image_url + deduct 3 credits atomically |
| `deduct_credits(p_user_id, p_amount, p_reason, ...)` | discover-brand route | Deduct credits for discovery |
| `mark_free_discovery_used(p_user_id)` | discover-brand route | Mark first free discovery as used |
| `handle_new_user()` | Clerk webhook | Create profiles row on signup (tier=1, credits=0) |
| `claim_welcome_credits(p_user_id)` | claim-welcome-credits route | One-time 25-credit grant |
| `switch_active_business(p_user_id, p_business_id)` | (multi-business support) | Toggle is_active flag |

---

## API Routes

### `POST /api/generate`

Text content generation.

**Request body fields:** `business_name`, `category`, `niche`, `voice`, `postType`, `address`, `history[]`, plus optional promotion/event fields.

**Response:** `{ content, hashtags, currentWeather, post_type, content_category, content_summary, offerings_referenced, event_referenced, hook_used, voice_used, ai_provider, word_count, tokens_used, cognitive_lens }`

**Fallback chain:** anthropic (Haiku 4.5) → openrouter (claude-haiku-4.5) → deepinfra (gpt-oss-120b)

---

### `POST /api/generate-image`

Polling endpoint for image generation.

**Request body:** `{ postId, business_id }`

**Responses:**
- `202 { status: 'WAITING' }` — Architect still writing prompt
- `200 { url, debugPrompt, providerUsed, hosted }` — image ready
- `500 { status: 'ERROR' }` — prompt starts with "ERROR:"

---

### `POST /api/prepare-image-prompt`

Fire-and-forget. Starts image generation (client doesn't await response, only catches errors).

**Request body:** `{ postId, currentWeather }`

**Response:** `{ success: boolean }` — client doesn't use this; it polls generate-image.

---

### `POST /api/discover-brand`

Runs brand discovery (vision + research).

**Env var:** `DISCOVERY_RESEARCH_PROVIDER` = `"gemma"` (default) | `"haiku"`

---

## Key Components

### `src/app/dashboard/page.tsx`

- Fetches active business via `get_active_business` RPC
- Fetches user credits from `profiles` table separately
- Posts are fetched with `business_id = user.id` (not business UUID — historical quirk)
- `savePostToCloud(input: SavePostInput)` calls `save_post_and_deduct` RPC, returns `postId`
- `activeTab`: `"generate"` | `"saved"`
- Supabase client uses Clerk JWT; template auto-selects based on `NEXT_PUBLIC_APP_ENV`

### `src/components/GenerateDashboard.tsx`

- Accepts: `supabase`, `businessData`, `voice`, `onVoiceChange`, `onGenerateSuccess`, `canGenerate`, `userCredits`, `history`, `onImageUpdated`
- Image flow: fire-and-forget `prepare-image-prompt` → poll `generate-image` every 3s (max 20 attempts) → on success call `save_image_and_deduct` RPC
- Guard: image generation requires `lastPostId` (from saved text post) + `userCredits >= 3`

### `src/app/profile/page.tsx`

- Three labeled photo slots: `entrance` ("Storefront / Patio"), `customer_space`, `work_space`
- Photo labels passed as `photo.label` to `brandDiscovery.ts`

---

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
DEEPINFRA_API_KEY=
HF_TOKEN=                             # HuggingFace for FLUX.1-schnell
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Environment
NEXT_PUBLIC_APP_ENV=development        # "development" | "production"
                                       # Controls Clerk template: supabase-dev vs supabase-prod

# AI Engine Control
AI_ENGINE_MODE=FALLBACK                # TOGGLE | FALLBACK
AI_PROVIDER=anthropic                  # Used in TOGGLE mode only

IMAGE_GENERATION_MODE=GEMINI_MULTIMODAL  # GEMINI_MULTIMODAL | ARCHITECT

# Multimodal path provider engine (GEMINI_MULTIMODAL)
IMAGE_GEN_ENGINE_MODE=FALLBACK           # TOGGLE | FALLBACK (google → openrouter)
IMAGE_GEN_PROVIDER=GOOGLE_API            # GOOGLE_API | OPENROUTER (TOGGLE mode only)

# Architect path FLUX chain (generate-image route)
IMAGE_ENGINE_MODE=FALLBACK               # TOGGLE | FALLBACK
IMAGE_PROVIDER=huggingface               # Used in TOGGLE mode only

# Note: ARCHITECT_MODE is hardcoded in prepare-image-prompt/route.ts line 40
# const ARCHITECT_MODE = "GEMMA" — not read from env

# Vision analysis (brand discovery photos)
VISION_ENGINE_MODE=FALLBACK              # TOGGLE | FALLBACK (google → deepinfra)
VISION_PROVIDER=google                   # google | deepinfra (TOGGLE mode only)

# Brand Discovery text research
DISCOVERY_RESEARCH_PROVIDER=gemma        # "gemma" | "haiku"

# Dev tools
NEXT_PUBLIC_MOCK_AI=false              # "true" skips AI calls for testing
```

---

## Credit System

| Action | Cost | RPC |
|--------|------|-----|
| Text post generation | **2 credits** | `save_post_and_deduct` |
| Image generation | **3 credits** | `save_image_and_deduct` |
| Text + image total | **5 credits** | — |
| Brand discovery — text (Tier 1, after first) | **3 credits** | `deduct_credits` |
| Brand discovery — text (Tier 2) | **0 credits** | — |
| Brand discovery — vision | **0 credits** | — |
| Welcome bonus (one-time) | **+25 credits** | `claim_welcome_credits` |

**Tier 1 (Free):** 1 business, pay per post via credits  
**Tier 2 (Premium, ~$29/mo):** Unlimited businesses, unlimited generation, unlimited discovery

---

## Dead Code — Do Not Touch

These exist in the codebase but serve no active purpose. Do not build on them or try to integrate them; they are scheduled for deletion.

| File / Symbol | Status | Notes |
|--------------|--------|-------|
| `src/lib/cognitive-lenses.ts` | ⛔ Dead | 4 lenses × 5 variants. Nothing actively uses the output |
| `src/lib/angle-selector.ts` | ⛔ Dead | `selectAngle()` is called in generate/route.ts but its output (lens, lensDefinition) resolves to `""` in all 5 active templates |
| `src/lib/frameworks.ts` | ⛔ Dead | PAS/BAB/AIDA framework logic, used only by `buildLegacyPrompt` |
| `buildLegacyPrompt()` in generate/route.ts | ⛔ Dead | 238+ lines, never called. Replaced by `buildModePrompt()` |
| `"Myth-busting"` template in mode-templates.ts | ⛔ Dead | Removed from UI dropdown. Still in file, still uses `{{lens}}` |
| `gemma` / `gemini` / `groq` branches in `callAIProvider()` | ⛔ Dead | Never reached; prod chain is `anthropic → openrouter → deepinfra` |
| `const tools = [...]` in generate-image/route.ts line 13 | ⛔ Dead | Never used |
| `textModel`, `imageModel` in generate-image/route.ts lines 23-24 | ⛔ Dead | Leftovers from old Gemini Imagen pipeline |
| `src/lib/group-angle-selector.ts` | ⚠ Likely dead | Verify before touching |
| `src/lib/lens-groups.ts` | ⚠ Likely dead | Verify before touching |
| `src/lib/lens-mapping.ts` | ⚠ Likely dead | Verify before touching |
| `src/lib/niche-to-group-map.ts` | ⚠ Likely dead | Verify before touching |
| `businesses.storefront_architecture` | ⚠ Legacy | No longer written by new discovery; `zones` supersedes it |
| `businesses.interior_layout` | ⚠ Legacy | Same as above |
| `businesses.business_visuals` | ⚠ Legacy | Same as above |
| `community_posts.cognitive_lens` | ⚠ Legacy | Still written, serves no active purpose |

---

## Cleanup Backlog

These are known issues from the May 2026 code audit. Do them in order — earlier items unblock later ones.

**0. Remove cognitive lens system entirely**
Delete `cognitive-lenses.ts`, `angle-selector.ts`. Remove `selectAngle()` call + `recentLenses` tracking from `generate/route.ts`. Remove `lens`/`lensDefinition`/`groupContext` from `PromptBuilderConfig` and variables map. Delete `"Myth-busting"` template from `mode-templates.ts`. Consider dropping `community_posts.cognitive_lens` column.

**1. Delete `buildLegacyPrompt()` in generate/route.ts**
~238 lines, never called. Also remove its unused imports: `HarmCategory`, `HarmBlockThreshold`, `getFramework`, `Framework`, `FRAMEWORKS`, `TIP_MODE`, `CTA_BY_POST_TYPE`, etc.

**2. Fix broken return types in `callAIProvider()`**
The `deepinfra` and `openrouter` branches return a plain string instead of `{ content, tokensUsed, provider }`. This causes type errors and would produce `undefined` for those fields if either provider is hit.

**3. Remove `getRecentOfferings()` deprecated wrapper in post-history.ts**
Replace all call sites with `getRecentOfferingsInOrder()`, then delete the wrapper.

**4. Remove stale column reads from generate/route.ts**
After all businesses have been re-discovered, drop `storefront_architecture`, `interior_layout`, `business_visuals` from the select query. Eventually drop from DB schema.

**5. Add comment to `image-mode-templates.ts`**
Add at top: `// ARCHITECT PATH ONLY — for GEMINI_MULTIMODAL see image-mode-templates-multimodal.ts`

**6. Verify `save_post_and_deduct` RPC signature**
Confirm it accepts all new `community_posts` columns (`post_type`, `content_category`, `content_summary`, `offerings_referenced`, `event_referenced`, `hook_used`, `voice_used`, `ai_provider`, `word_count`, `tokens_used`). If not, update the RPC signature in Supabase.

**7. Delete commented-out Architect repair logic in GenerateDashboard.tsx**
Lines ~431-472. Decide: re-enable or delete.

**8. Verify `local event / news` category list is consistent**
`mode-templates.ts` was updated to: `["The regular", "Neighborhood rhythm", "Peak / rush", "Shared moment", "Season / weather impact"]`. Check `NARRATIVE_COMBINATIONS` and any other lookups reference the same list.

**9. Audit likely-dead lib files**
`group-angle-selector.ts`, `lens-groups.ts`, `lens-mapping.ts`, `niche-to-group-map.ts` — check all import sites before deleting.

---

## Common Debug Queries

```sql
-- Check if image_prompt was written (Architect path)
SELECT id, image_prompt, image_url FROM community_posts WHERE id = 'post-uuid';

-- Check offering rotation — last 5 posts' offerings
SELECT offerings_referenced FROM community_posts 
WHERE business_id = 'clerk-user-id' 
ORDER BY created_at DESC LIMIT 5;

-- Check if products_services is in new nested format (should be object, not array)
SELECT business_description->'products_services' FROM businesses WHERE user_id = 'clerk-user-id';

-- Check user credits
SELECT credits, tier FROM profiles WHERE id = 'clerk-user-id';

-- Check active business for a user
SELECT * FROM businesses WHERE user_id = 'clerk-user-id' AND is_active = true;
```

---

## Upcoming Features (Q3–Q4 2026)

- Credit purchasing via Stripe (Starter 50/$5, Creator 150/$12, Pro 500/$35)
- Content scheduling with auto-post to social platforms
- Usage analytics dashboard
- Team collaboration with role-based permissions
- Social media performance insights

---

## Error Handling & Resilience (added June 2026)

### Vision (brandDiscovery.ts)
- `analyzePhotosWithGemini` is now a router: TOGGLE | FALLBACK engine mode
- Fallback: Google API → DeepInfra (same Gemini 2.5 Flash model)
- `extractJson()` helper strips `<think>` blocks + uses balanced-brace extraction (immune to trailing content)
- Both providers share `buildVisionPrompt()` — identical prompt, different API call

### Research / Text Search (brandDiscovery.ts)
- `runResearchProvider` retries once automatically in production (`NEXT_PUBLIC_APP_ENV=production`)
- No provider fallback added (gemma/haiku remain a toggle) — retry handles transient failures

### discover-brand route
- Text search failure no longer kills vision — error is captured, vision runs, error returned after
- Credits never deducted on text search failure

### prepare-image-prompt route (GEMINI_MULTIMODAL path)
- **Sentinel**: clears `image_prompt` + `image_url` to null at start — poller stays in WAITING state
- **Save order**: `image_url` saved FIRST, then `image_prompt` — prevents FLUX chain race condition
- **Provider engine**: TOGGLE | FALLBACK (Google API → OpenRouter, both gemini-3.1-flash-image-preview)

### dev server (Windows)
- `package.json` dev script uses `--hostname 0.0.0.0` to fix IPv6 binding issue on Windows

---

*Last synced from DEVELOPER_REFERENCE.md and USER_EXPERIENCE_GUIDE.md — May 28, 2026*
*Resilience changes added June 2026*
