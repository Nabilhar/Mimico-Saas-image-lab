# Shoreline Studio - Developer Reference Guide

**Version:** 1.1  
**Last Updated:** May 28, 2026  
**Production URL:** https://shorelinestudio.ca  
**Status:** Pre-launch (Development Complete)

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Core Features & Flows](#core-features--flows)
6. [Key Components Reference](#key-components-reference)
7. [Database Functions & RPCs](#database-functions--rpcs)
8. [API Routes](#api-routes)
9. [Environment Variables](#environment-variables)
10. [Deployment & Maintenance](#deployment--maintenance)
11. [Pricing & Business Model](#pricing--business-model)
12. [Future Roadmap](#future-roadmap)
13. [Third-Party API Integration](#third-party-api-integration)
14. [Cleanup Required](#cleanup-required)

---

## System Architecture Overview

Shoreline Studio is an AI-powered social media content generation platform for local businesses. It combines multi-modal AI (vision + text generation + image synthesis) with location-aware context to create authentic, brand-consistent social media posts.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js 14 App Router)                      │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard      │  Profile Setup  │  Content Library  │  Auth   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API ROUTES                              │
├─────────────────────────────────────────────────────────────────┤
│  /api/generate              - Text content generation           │
│  /api/generate-image        - Image generation (polling)        │
│  /api/prepare-image-prompt  - Architect (async, writes to DB)   │
│  /api/discover-brand        - Brand identity extraction         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL AI SERVICES                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Claude (Anthropic)  - Content generation (Haiku 4.5)                      │
│  • Gemini (Google)     - Vision analysis (gemini-2.5-flash)                  │
│  • Claude (Anthropic)  - brand discovery (Haiku 4.5)                         │
│  • OpenRouter          - Image gen: gemini-3.1-flash-image-preview (primary) │
│  • DeepInfra           - Image gen: FLUX-2-pro (fallback)                    │
│  • OpenRouter          - Image gen: FLUX.2 Pro (fallback)                    │
│  • HuggingFace         - Image gen: FLUX.1-schnell (fallback)                │
│  • Cloudflare          - Image gen: SDXL (fallback)                          │
│  • Pollinations        - Image gen: unhosted URL (last resort)               │
└──────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA & AUTHENTICATION                        │
├─────────────────────────────────────────────────────────────────┤
│  • Supabase (PostgreSQL)  - Database + Storage                  │
│  • Clerk                  - Authentication + User management    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Content Generation Pipeline

```
1. USER INPUT
   ↓
   - Business profile (name, location, niche)
   - 3 Photos of business
   - Voice selection (tone preference)
   - Post type selection (5 modes)
   ↓
2. BRAND DISCOVERY (One-time/On-demand)
   ↓
   - Photo upload → Gemini Vision API
   - Web research → Haiku or Gemma + Google Search
   - Vision returns: color_theme + zones (entrance/customer_space/work_space)
   - Research returns: description, offerings with signature practices
   - Merge → Store in Supabase
   ↓
3. CONTENT GENERATION
   ↓
   - Select ONE offering via rotation (avoids repeating same service)
   - Select post type category (rotate to avoid repetition)
   - Build mode-specific prompt (5 templates via buildModePrompt)
   - Inject business context + brand identity
   - Send to Claude Haiku 4.5 → OpenRouter → DeepInfra (fallback chain)
   - Receive generated post
   - Save to community_posts with structured metadata
   ↓
4. IMAGE GENERATION (Async, user-triggered)
   ↓
   - User saves post → gets postId
   - User clicks "Generate Image"
   - Fire-and-forget: /api/prepare-image-prompt starts (reads post + content_category from DB)
   - Resolves zone photo: post type + content_category → ZoneKey → photo URL from businesses table
   - Local event / news: content_category determines entrance (exterior) or customer_space (interior)
     Fallback: if exterior requested but no entrance photo → silently uses customer_space
   - PATH A — GEMINI_MULTIMODAL (IMAGE_GENERATION_MODE=GEMINI_MULTIMODAL):
       Builds multimodal prompt using image-mode-templates-multimodal.ts
       Hero resolved by visual mode (product vs experience) based on business category
       Sends zone photo + prompt to google/gemini-3.1-flash-image-preview via OpenRouter
       Gemini generates image → uploaded to Supabase post-images bucket
       image_url saved directly to community_posts
   - PATH B — ARCHITECT (fallback or IMAGE_GENERATION_MODE=ARCHITECT):
       Gemma 4 31B writes FLUX prompt → saved to community_posts.image_prompt
       Polling loop: /api/generate-image checks DB every 3s (max 40 attempts = 120s)
       Prompt found → DeepInfra FLUX → OpenRouter → HuggingFace → Cloudflare → Pollinations
       Image uploaded to Supabase Storage
   - save_image_and_deduct RPC atomically saves URL + deducts 3 credits
   ↓
5. SAVE & DISPLAY
   ↓
   - Post saved at generate time (text only, 2 credits deducted)
   - Image saved at generate-image time (3 credits deducted — see RPC below)
   - Display in user's content library
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components (no external library)
- **State Management:** React hooks (useState, useEffect, useCallback)

### Backend
- **Runtime:** Next.js API Routes (Edge/Node.js)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (for uploaded photos + generated images)
- **Authentication:** Clerk

### AI & ML Services
| Service | Purpose | Model | Cost |
|---------|---------|-------|------|
| **Anthropic Claude** | Content generation | Haiku 4.5 | ~$0.0005/post |
| **Google Gemini Flash** | Vision analysis | gemini-2.5-flash | Free tier |
| **Google Gemma 4** | Brand research | gemma-4-31b-it | Free tier |
| **DeepInfra** | Image generation (primary) | FLUX-2-pro | ~$0.03/image |
| **OpenRouter** | Image generation (fallback) | FLUX.2 Pro | ~$0.04/image |
| **HuggingFace** | Image generation (fallback) | FLUX.1-schnell | Free tier |
| **Cloudflare AI** | Image generation (fallback) | SDXL | Very low |
| **Pollinations** | Image generation (last resort) | FLUX | Free (unhosted) |

### Infrastructure
- **Hosting:** Vercel
- **Domain:** shorelinestudio.ca
- **Analytics:** (TBD - future)
- **Monitoring:** (TBD - future)

---

## Database Schema

### Tables Overview

```
profiles
├─ id (TEXT, PK) - Clerk user ID
├─ email (TEXT)
├─ created_at (TIMESTAMP)
├─ credits (INTEGER) - User's credit balance
├─ tier (INTEGER) - 1 = Free, 2 = Premium
└─ free_text_discovery_used (BOOLEAN)

businesses
├─ id (UUID, PK)
├─ user_id (TEXT, FK → profiles.id)
├─ business_name (TEXT)
├─ street, city, province_state, country, postal_code (TEXT)
├─ category (TEXT) - e.g., "Health & Wellness"
├─ niche (TEXT) - e.g., "Physiotherapy Clinic"
├─ voice (TEXT) - Tone preference
├─ is_active (BOOLEAN) - Active business for this user
├─ brand_source (TEXT) - "photos" | "text_search" | null
├─ color_theme (JSONB) - {primary, secondary, accent, description}
├─ zones (JSONB) - Per-zone layout + colors (entrance/customer_space/work_space) ← NEW
├─ business_description (JSONB) - Craft identity, offerings, neighbourhood, etc.
├─ contact_info (JSONB) - Discovered contact details
├─ business_visuals (JSONB) - LEGACY: {logoColors, storefrontColors, interiorColors} ← not written by new discovery
├─ storefront_architecture (JSONB) - LEGACY: Physical appearance details ← not written by new discovery
├─ interior_layout (JSONB) - LEGACY: Interior design details ← not written by new discovery
├─ last_analyzed_business_name (TEXT) - For change detection
├─ last_analyzed_street, last_analyzed_city (TEXT)
└─ last_text_discovery_at (TIMESTAMP)

community_posts
├─ id (UUID, PK)
├─ business_id (TEXT, FK → profiles.id) - Stores user_id (not business UUID)
├─ content (TEXT) - Generated post text
├─ image_url (TEXT, nullable) - Supabase storage URL
├─ image_prompt (TEXT, nullable) - Written by Architect, read by generate-image
├─ created_at (TIMESTAMP)
├─ business_name (TEXT) - Snapshot at time of creation
├─ location_snapshot (TEXT) - Snapshot at time of creation
├─ cognitive_lens (TEXT) - Which lens was used
├─ post_type (TEXT) - "Tip of the Day" | "Behind the scenes" | etc. ← NEW
├─ content_category (TEXT) - Sub-category within the post type ← NEW
├─ content_summary (TEXT) - Short summary for deduplication ← NEW
├─ offerings_referenced (TEXT[]) - Which offering(s) were featured ← NEW
├─ event_referenced (TEXT) - Event name if applicable ← NEW
├─ hook_used (TEXT) - Opening hook used ← NEW
├─ voice_used (TEXT) - Voice selected for this post ← NEW
├─ ai_provider (TEXT) - Which AI provider generated the content ← NEW
├─ word_count (INTEGER) ← NEW
└─ tokens_used (INTEGER) ← NEW
```

### Key Relationships

```
profiles (1) ──────→ (many) businesses
   │
   └──────→ (many) community_posts (via business_id = profiles.id)
```

**Important Note:** `community_posts.business_id` stores the **user ID** (not the business UUID). This is historical and works because users initially had only one business.

---

## Authentication Flow

### Technology: Clerk + Supabase RLS

```
1. USER SIGNS IN
   ↓ Clerk handles authentication
   ↓ Clerk generates JWT with user_id
   ↓
2. NEXT.JS API ROUTES
   ↓ const { userId } = await auth()
   ↓ supabaseAdmin (service role key) used for all server-side writes
   ↓
3. SUPABASE CLIENT (Client components)
   ↓ createClerksupabase(() => getToken({ template }))
   ↓ Token template: supabase-dev (dev) or supabase-prod (prod)
   ↓ Supabase enforces RLS via auth.uid()
```

### Supabase Templates

Selection is automatic based on `process.env.NEXT_PUBLIC_APP_ENV`:

```typescript
const template = process.env.NEXT_PUBLIC_APP_ENV === 'development'
  ? 'supabase-dev'
  : 'supabase-prod';
```

### New User Onboarding Flow

```
1. User signs up with Clerk
   ↓ Clerk webhook → /api/webhooks/clerk
   ↓ handle_new_user() RPC: creates profiles row (tier=1, credits=0)
   ↓
2. User redirected to /profile
   ↓ Fills in business details
   ↓ Uploads photos (optional)
   ↓ Brand discovery runs
   ↓
3. User redirected to /dashboard
```

---

## Core Features & Flows

### 1. Brand Discovery System

**Purpose:** Extract visual and semantic brand identity from photos and web research.

**Trigger Conditions:**

| User Tier | Trigger | Cost |
|-----------|---------|------|
| **Tier 1** | Manual checkbox (user opt-in) | First free, then 3 credits |
| **Tier 2** | Automatic on business creation | Always free |

**Two Parallel Paths (run concurrently with Promise.allSettled):**

#### Path A: Vision Analysis (Gemini 2.5 Flash)

- **Input:** 1-3 photos with zone labels: `entrance`, `customer_space`, `work_space`
- **Photo matching:** Each photo is matched to its zone by label (not array order). Photos are interleaved with zone headers before being sent to Gemini.
- **Output per zone:**
  - `layout`: spatial_arrangement, focal_feature, materials_finishes, lighting_mood, activity_zone
  - `colors`: dominant, supporting, accent, materials_palette
- **Output global:**
  - `color_theme`: primary, secondary, accent, description (synthesized across all zones)
- **Saved to:** `businesses.zones` (JSONB) and `businesses.color_theme` (JSONB)
- **Cost:** Free

#### Path B: Web Research (Gemma 4 or Haiku, configurable)

- **Provider:** Controlled by `DISCOVERY_RESEARCH_PROVIDER` env var ("gemma" or "haiku")
- **Gemma path:** `models/gemma-4-31b-it` + Google Search (5 web searches)
- **Haiku path:** `claude-haiku-4-5-20251001` + web_search tool (5 uses max)
- **Output:**
  - `description`: 2-3 sentence business identity
  - `products_services`: `{ "Offering Name": ["practice 1", "practice 2", ...], ... }` (new nested format)
  - `neighbourhood`, `landmarks[]`, `transit[]`, `local_trends[]`
  - `contact`: email, instagram, facebook, linkedin, phone, whatsapp
- **Saved to:** `businesses.business_description` (JSONB), `businesses.contact_info` (JSONB)
- **Cost:** 3 credits (Tier 1 after first use), Free (Tier 2)

**New products_services format (since last doc version):**

The research prompt now asks for offerings with nested signature practices:
```json
{
  "Vinyasa Yoga": ["60-minute heated flow at 85°F", "Max 25 mats per class"],
  "Reformer Pilates": ["8-person cap", "Instructor adjustments throughout"]
}
```

This object is stored flat in `business_description.products_services`. The `extractOfferingNames()` and `extractPracticesByOffering()` functions in `parse-business-intel.ts` handle both the old array format and the new nested object format.

**Merge Logic:**
- Vision data owns: `color_theme`, `zones`
- Research data owns: `business_description`, `contact_info`
- `brand_source`:
  - `"photos"` if vision ran AND (color is visible OR ≥2 zones visible)
  - `"text_search"` otherwise

**Code Location:**
- `src/lib/brandDiscovery.ts` — all discovery logic
- `src/app/api/discover-brand/route.ts` — API endpoint
- `src/lib/parse-business-intel.ts` — `parseZones()`, `extractOfferingNames()`, `extractPracticesByOffering()`

---

### 2. Content Generation System

**Architecture: Mode Templates + POST_TYPE_CATEGORIES + Offering Rotation**

#### 5 Active Post Modes

| Mode | Post Type | Variety Mechanism |
|------|-----------|-------------------|
| **EDUCATION - Tip** | Tip of the Day | `tip_category` rotates (Technique, Timing, Selection, Care, The why, Tools/setup, Pairing) |
| **OBSERVATION - Behind** | Behind the scenes | `moment_type` rotates (Early prep, Active craft, Wait/passive, The adjustment, Repetition, The standard) |
| **OBSERVATION - Promo** | Promotion/Offer | User-driven (no rotation — user provides offer details) |
| **CASUAL - Event** | Local event / news | `scene_type` rotates (Preparation pattern, Neighborhood rhythm, Space shift, The regular, Timing observation, Season/weather impact) |
| **ATMOSPHERIC - Moment** | Community moment | `scene_type` rotates (Peak/rush, Lull/quiet, Solo customer, Shared moment, Weather-shaped) |

Templates defined in `src/lib/mode-templates.ts`. Each template is filled via `buildModePrompt()` in `src/lib/prompt-builder.ts`.

**Note on Myth-busting:** A 6th template (`"Myth-busting"`) exists in `mode-templates.ts` and still uses `{{lens}}` / `{{lensDefinition}}` placeholders. It has been removed from the UI dropdown and is not accessible to users. Scheduled for deletion along with the cognitive lens system.

#### Cognitive Lenses — Dead Code

`src/lib/cognitive-lenses.ts`, `src/lib/angle-selector.ts`, and the `selectAngle()` call in `generate/route.ts` are all dead in practice. The only template that used them (Myth-busting) is removed from the dropdown. The `angle.lens` and `angle.lensDefinition` values are still passed to `buildModePrompt()` and into the `variables` map in `prompt-builder.ts`, but they resolve to empty strings in all 5 active templates (none of them use `{{lens}}`).

See **Cleanup Required** section for removal plan.

#### Offering Rotation (NEW)

Instead of injecting all offerings into every prompt, a single offering is selected per post and rotated to avoid repetition.

**How it works:**
1. `getRecentOfferingsInOrder()` fetches last 5 posts' `offerings_referenced` from DB (most recent first, deduped)
2. `getOfferingCatalog()` builds the ordered list from `practices_by_offering` keys (or `products_services` as fallback)
3. `selectNextOffering()` picks the next offering after the last used one, skipping any in the recent list
4. Only the selected offering's practices are injected into the prompt via `formatOfferingWithPractices()`
5. The used offering is saved back to `community_posts.offerings_referenced`

**Code location:** `src/lib/offering-rotation.ts`

#### Generation Flow

```
1. User clicks "Generate" on Dashboard
   ↓
2. /api/generate receives: business fields, postType, voice, history[], address
   ↓
3. Fetch active business from Supabase (id, brand data, zones)
   ↓
4. selectAngle() → cognitive lens (avoids last 3 used)
   ↓
5. getRecentPostHistory() → categories + summaries for dedup
   ↓
6. getRecentOfferingsInOrder() + selectNextOffering() → one offering
   ↓
7. buildModePrompt() assembles the final prompt with:
   - Mode template for postType
   - Lens + definition
   - Business intel (neighbourhood, landmarks, zones, offering + practices)
   - Weather, time, season
   - Recent history for variety
   ↓
8. callAIProvider() → fallback chain: anthropic → openrouter → deepinfra
   ↓
9. parseGeneratedPost() extracts content, hashtags, content_summary, etc.
   ↓
10. validateOfferings() cross-checks offerings_referenced against known catalog
    ↓
11. Response returned with structured metadata
    ↓
12. Dashboard calls onGenerateSuccess() → save_post_and_deduct RPC
    - Saves to community_posts with all metadata fields
    - Deducts 2 credits atomically
    - Returns postId for image generation
```

**Text generation fallback chain:**
- Primary: `anthropic` (direct Anthropic API, claude-haiku-4-5-20251001)
- Fallback 1: `openrouter` (claude-haiku-4.5 via OpenRouter)
- Fallback 2: `deepinfra` (openai/gpt-oss-120b)

**Code Locations:**
- `src/lib/mode-templates.ts` — 6 mode templates
- `src/lib/cognitive-lenses.ts` — 4 lenses × 5 variants each
- `src/lib/angle-selector.ts` — Lens selection logic
- `src/lib/prompt-builder.ts` — Prompt assembly
- `src/lib/offering-rotation.ts` — Offering rotation
- `src/lib/post-history.ts` — History fetching for variety
- `src/lib/post-parser.ts` — Parses structured metadata from model output
- `src/app/api/generate/route.ts` — API endpoint

---

### 3. Image Generation System

**Pipeline:** Save post → prepare-image-prompt (async, two paths) → generate-image (polling)

#### Stage 1: User Saves Post

- User generates text post → clicks "Save"
- `save_post_and_deduct()` RPC saves post, deducts 2 credits, returns `postId`
- Dashboard stores `postId` in state

#### Stage 2: prepare-image-prompt — Fire and Forget

**Triggered by:** User clicks "Generate Image"

Dashboard fires `POST /api/prepare-image-prompt` non-blocking (`.catch()` only). The route then takes one of two paths based on `IMAGE_GENERATION_MODE` env var:

---

**Path A: GEMINI_MULTIMODAL (default in production)**

1. Fetch post content + post_type + business data from DB by `postId`
2. `resolveZoneFocus(postType)` → which zone photo to use (work_space for BTS/Tips, customer_space/entrance for Community/Promo)
3. `selectZonePhoto(supabase, userId, postType)` → fetches the Supabase URL of the user's uploaded zone photo
4. Fetch that photo → convert to base64
5. Build multimodal prompt (post content + brand context + zone description + technical spec)
6. Send photo + prompt to `gemini-3.1-flash-image-preview` → model generates a new image that matches the real space's lighting, materials, and color
7. Upload generated image to Supabase Storage (`post-images` bucket)
8. Save image URL directly to `community_posts.image_url`
9. Save Gemini's text description to `community_posts.image_prompt`
10. Return `{ success: true, imageUrl, method: 'GEMINI_MULTIMODAL' }`

The polling route (`generate-image`) detects `image_url` already set and returns it immediately — no FLUX chain runs.

**Fallback within GEMINI_MULTIMODAL:** If `selectZonePhoto` finds no photo for the required zone, the route falls through to Path B.

**IMAGE_GEN_PROVIDER sub-toggle** (within multimodal path):
- `GOOGLE_API` (default) — direct Google AI SDK, `gemini-2.5-flash-image`
- `OPENROUTER` — `google/gemini-3.1-flash-image-preview` via OpenRouter

---

**Path B: ARCHITECT (fallback — no zone photo)**

1. Fetch post content + business data from DB
2. `buildBrandVariables()` → structured brand context from zones + color
3. `getImageModeTemplate(postType)` → post-type-specific image instruction
4. Build 60-70 word FLUX-2-pro prompt (Gemma default, see `ARCHITECT_MODE` hardcoded at line 39)
5. **Write prompt to `community_posts.image_prompt`** (not the image itself)
6. generate-image polling route picks this up and runs the FLUX chain

**ARCHITECT_MODE** (`prepare-image-prompt/route.ts` line 39 — hardcoded, not env-controlled):
```typescript
const ARCHITECT_MODE: "GEMINI" | "GROQ" | "GEMMA" | "OPENROUTER" = "GEMMA";
```

**Code Location:** `src/app/api/prepare-image-prompt/route.ts`

---

#### Stage 3: generate-image — Polling

Dashboard polls `POST /api/generate-image` every 3 seconds (max 20 attempts = 60s):

```
Poll response cases:
  - 202 { status: 'WAITING' }  → image_prompt is null, Architect still writing → keep polling
  - 200 { url }                → image_url already set (multimodal path succeeded) → done
  - 500 { status: 'ERROR' }   → image_prompt starts with "ERROR:" → generation failed
  - prompt ready               → run FLUX chain below
```

**FLUX image provider fallback chain** (only reached on Architect path):
```
FALLBACK mode (IMAGE_ENGINE_MODE=FALLBACK, default):
  1. DeepInfra — FLUX-2-pro (b64_json)
  2. OpenRouter — FLUX.2 Pro (base64 or URL)
  3. HuggingFace — FLUX.1-schnell (blob)
  4. Cloudflare — SDXL (blob)
  → All hosted: upload to Supabase Storage (post-images bucket)
  → Last resort: Pollinations URL (unhosted, hosted: false in response)

TOGGLE mode (IMAGE_ENGINE_MODE=TOGGLE):
  Uses IMAGE_PROVIDER env var, no chain
```

**Credit deduction for image:**
- On success, Dashboard calls `save_image_and_deduct()` RPC
- Atomically: sets `image_url` on the post + deducts **3 credits** from user
- Total image cost: 3 credits (separate from the 2 for text)

**Code Location:** `src/app/api/generate-image/route.ts`

---

### 4. Credit System

**Credit Economics:**

| Action | Cost | Notes |
|--------|------|-------|
| **Text post generation** | 2 credits | Deducted at save time via `save_post_and_deduct` |
| **Image generation** | 3 credits | Deducted at image-ready time via `save_image_and_deduct` |
| **Text discovery (Tier 1)** | 3 credits | After first free use |
| **Text discovery (Tier 2)** | 0 credits | Always free |
| **Vision analysis** | 0 credits | Always free |

**Note:** Total for text + image = 5 credits (2 text + 3 image). Image RPC is `save_image_and_deduct`, separate from `save_post_and_deduct`.

**RPC Functions:**

```sql
-- Save post and deduct credits atomically (text only, called at generate time)
save_post_and_deduct(p_user_id, p_content, p_image_url, p_amount, ...)
RETURNS JSONB {success, post_id?, new_balance?, error?}

-- Save image URL and deduct credits atomically (called after image generation)
save_image_and_deduct(target_post_id, new_image_url, clerk_user_id)
RETURNS JSONB

-- Deduct credits for discovery
deduct_credits(p_user_id, p_amount, p_reason, p_business_id, p_metadata)
RETURNS JSONB

-- Mark first free discovery as used
mark_free_discovery_used(p_user_id) RETURNS VOID
```

---

### 5. User Tiers System

*(Unchanged from v1.0 — see original docs)*

---

## Key Components Reference

### Dashboard (`src/app/dashboard/page.tsx`)

**Key Types:**
```typescript
interface SavePostInput {
  content: string;
  imageUrl: string;
  postType: string;
  contentCategory?: string;
  contentSummary?: string;
  offeringsReferenced?: string[];
  eventReferenced?: string | null;
  hookUsed?: string | null;
  priceShown?: boolean | null;
  voiceUsed?: string;
  aiProvider?: string;
  wordCount?: number;
  tokensUsed?: number;
  cognitiveLens?: string;
}
```

**`savePostToCloud(input: SavePostInput)`:**
- Calls `save_post_and_deduct()` RPC
- Deducts 2 credits for text
- Saves all structured metadata fields to community_posts
- Returns post UUID used for image generation

---

### GenerateDashboard Component (`src/components/GenerateDashboard.tsx`)

**Image generation flow (new async/polling pattern):**

```typescript
const handleGenerateImage = async () => {
  // 1. Guard: needs lastPostId (from saved text post) + userCredits >= 3
  
  // 2. Fire-and-forget: Architect starts writing prompt to DB
  fetch("/api/prepare-image-prompt", { body: { postId: lastPostId, currentWeather } })
    .catch(err => console.error(...));

  // 3. Poll /api/generate-image every 3s (max 20 attempts = 60s)
  //    202 = still waiting, data.url = success
  
  // 4. On success: save_image_and_deduct RPC
  await supabase.rpc('save_image_and_deduct', {
    target_post_id: lastPostId,
    new_image_url: data.url,
    clerk_user_id: user?.id
  });
};
```

---

### Profile Page (`src/app/profile/page.tsx`)

**Photo upload — new zone labels:**

The profile page now uses three labeled photo slots matching the vision system's zones:
- `Storefront / Patio` — Street-level view — skip if no outdoor presence"
- `customer_space` — where customer experience happens
- `work_space` — where craft is performed

These labels are passed as `photo.label` to `brandDiscovery.ts`, which uses them to match photos to zones before sending to Gemini.

---

## Database Functions & RPCs

*(Core RPCs from v1.0 still apply. New/changed RPCs below.)*

### `save_image_and_deduct(target_post_id, new_image_url, clerk_user_id)` — NEW

**Purpose:** Atomically update a saved post's image URL and deduct image credits.

**Called by:** GenerateDashboard after successful image generation (separate from text save).

**Logic:**
```sql
BEGIN
  -- Verify post belongs to this user
  SELECT id INTO post FROM community_posts 
  WHERE id = target_post_id AND business_id = clerk_user_id;
  
  IF NOT FOUND THEN RETURN {success: false, error: 'not_found'}; END IF;
  
  -- Check credits
  SELECT credits INTO user_credits FROM profiles WHERE id = clerk_user_id;
  IF user_credits < 2 THEN RETURN {success: false, error: 'insufficient_credits'}; END IF;
  
  -- Update image URL
  UPDATE community_posts SET image_url = new_image_url WHERE id = target_post_id;
  
  -- Deduct 2 credits
  UPDATE profiles SET credits = credits - 2 WHERE id = clerk_user_id
  RETURNING credits INTO new_balance;
  
  RETURN {success: true, new_balance};
END;
```

---

## API Routes

### `/api/generate` (POST)

**Request Body:**
```typescript
{
  business_name: string,
  category: string,
  niche: string,
  voice: string,
  postType: PostType,
  address: { street, city, province_state, country, postal_code },
  history: Post[],
  // Promotion fields (if postType = "Promotion / offer")
  offerName?: string,
  whatsIncluded?: string,
  availableTimeframe?: string,
  eligibility?: string,
  offerHook?: string,
  valueFraming?: string,
  showPrice?: boolean,
  priceDetails?: string,
  // Event fields
  eventType?: string,
  eventOrShoutout?: string,
}
```

**Response (new structured fields):**
```typescript
{
  content: string,
  hashtags: string[],
  currentWeather: string,
  post_type: string,
  content_category: string,
  content_summary: string,
  offerings_referenced: string[],
  event_referenced: string | null,
  hook_used: string | null,
  voice_used: string,
  ai_provider: string,
  word_count: number,
  tokens_used: number,
  cognitive_lens: string,
}
```

---

### `/api/generate-image` (POST)

**Request Body:**
```typescript
{
  postId: string,       // Required — fetch prompt from DB
  business_id: string,  // Used to verify ownership
}
```

**Response:**
```typescript
{
  url: string,          // Public Supabase URL (or Pollinations URL if unhosted)
  debugPrompt: string,  // The prompt that was used
  providerUsed: string, // e.g. "DEEPINFRA", "OPENROUTER", "POLLINATIONS_UNHOSTED"
  hosted: boolean,      // false if Pollinations fallback
}
// OR 202: { status: 'WAITING' }   — Architect still writing
// OR 500: { status: 'ERROR' }     — Architect failed
```

---

### `/api/prepare-image-prompt` (POST)

**Request Body:**
```typescript
{
  postId: string,        // Fetches post content + type from DB
  currentWeather: string,
}
```

**Process:**
1. Fetch post (content, post_type) and business (all brand data, zones) from DB
2. `resolveZoneFocus(postType)` → which zone to emphasize
3. `selectZonePhoto(zones, zoneFocus)` → which zone data to use
4. `buildBrandVariables(...)` → structured brand context
5. `getImageModeTemplate(postType)` → post-type-specific image instruction
6. Call Architect (GEMMA default)
7. Write result to `community_posts.image_prompt` (or "ERROR: ..." on failure)

**Response:** `{ success: boolean }` — client doesn't need the prompt, it polls generate-image.

---

### `/api/discover-brand` (POST)

*(Unchanged interface from v1.0. Internally now saves `zones` instead of `storefront_architecture`/`interior_layout`.)*

**New `DISCOVERY_RESEARCH_PROVIDER` env var:**
- `"gemma"` (default) — Gemma 4 31B + Google Search
- `"haiku"` — Claude Haiku 4.5 + web_search tool

---

## Environment Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
DEEPINFRA_API_KEY=...
HF_TOKEN=hf_...               # HuggingFace token for FLUX.1-schnell
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...

# Environment
NEXT_PUBLIC_APP_ENV=development    # or 'production'

# AI Engine Control
AI_ENGINE_MODE=FALLBACK            # TOGGLE | FALLBACK
AI_PROVIDER=anthropic              # Used in TOGGLE mode
IMAGE_GENERATION_MODE=GEMINI_MULTIMODAL  # GEMINI_MULTIMODAL | ARCHITECT (default: ARCHITECT)
IMAGE_GEN_PROVIDER=GOOGLE_API            # GOOGLE_API | OPENROUTER (within multimodal path)
IMAGE_ENGINE_MODE=FALLBACK               # TOGGLE | FALLBACK (FLUX chain, used on Architect path)
IMAGE_PROVIDER=huggingface               # Used in TOGGLE mode
ARCHITECT_MODE=GEMMA                     # hardcoded in route.ts line 39, not read from env

IMAGE_GENERATION_MODE=GEMINI_MULTIMODAL
# Controls image generation path
# GEMINI_MULTIMODAL: uses Gemini via OpenRouter with reference photo (primary)
# ARCHITECT: uses Gemma to write FLUX prompt (legacy fallback)

IMAGE_GEN_PROVIDER=OPENROUTER
# Controls provider within GEMINI_MULTIMODAL path
# OPENROUTER: sends to google/gemini-3.1-flash-image-preview via OpenRouter
# GOOGLE_API: sends directly to Google Gemini API (gemini-2.5-flash-image)

# Brand Discovery
DISCOVERY_RESEARCH_PROVIDER=gemma  # gemma | haiku

# Dev tools
NEXT_PUBLIC_MOCK_AI=false          # "true" skips AI calls for testing
```

---

## Deployment & Maintenance

*(Unchanged from v1.0 — see original docs for deploy steps, database migrations, and common troubleshooting.)*

### Common Issues (Updated)

#### Issue: Image generation times out (no image after 60 seconds)

**Debug:**
```sql
-- Check if image_prompt was written by Architect
SELECT id, image_prompt, image_url FROM community_posts WHERE id = 'post-uuid';
```

**Solutions:**
- If `image_prompt` is null: Architect failed. Check `prepare-image-prompt` logs.
- If `image_prompt` starts with "ERROR:": Architect returned an error string. Re-trigger.
- If `image_prompt` is set but `image_url` is null: Image provider chain failed. Check provider API keys.
- Check `IMAGE_ENGINE_MODE` env var — in TOGGLE mode only one provider is tried.

#### Issue: Generated posts always reference the same offering

**Debug:**
```sql
SELECT offerings_referenced FROM community_posts 
WHERE business_id = 'user-id' 
ORDER BY created_at DESC LIMIT 5;
```

**Solutions:**
- Verify `business_description.products_services` is in the new object format (not old array format)
- Check `offering-rotation.ts` — catalog must have > 1 entry for rotation to work
- If `products_services` is an array of strings (old format), re-run brand discovery

---

## Pricing & Business Model

*(Unchanged from v1.0 — see original for credit packages, tier pricing, and unit economics.)*

**Credit costs:** 2 credits for text, 3 credits for image. Total for text+image = 5 credits.

---

## Future Roadmap

*(Unchanged from v1.0 — see original for Phase 1-5 details.)*

---

## Third-Party API Integration

*(Entries 1, 5, 6 from v1.0 unchanged. Updated entries below.)*

### Image Generation Providers (Updated)

The old Gemini Imagen 3 pipeline is replaced by a multi-provider FLUX chain.

**Provider 1: OpenRouter (Primary)**
- Model: `google/gemini-3.1-flash-image-preview`
- API: OpenAI-compatible endpoint (`https://openrouter.ai/api/v1/chat/completions`)
- Format:  ["image", "text"],
- Cost: ~$0.07/image

**Provider 2: DeepInfra (Fallback)**
- Model: `black-forest-labs/FLUX-2-pro`
- API: OpenAI-compatible endpoint (`https://api.deepinfra.com/v1/openai/images/generations`)
- Format: base64 JSON (`response_format: "b64_json"`)
- Cost: ~$0.03/image

**Provider 3: OpenRouter (Fallback)**
- Model: `black-forest-labs/flux.2-pro`
- API: `https://openrouter.ai/api/v1/chat/completions` with `modalities: ["image"]`
- Format: base64 or URL in `message.images[0].image_url.url`

**Provider 4: HuggingFace (Fallback)**
- Model: `black-forest-labs/FLUX.1-schnell`
- SDK: `@huggingface/inference` `InferenceClient.textToImage()`
- `num_inference_steps: 4` (fast)

**Provider 5: Cloudflare (Fallback)**
- Model: `@cf/stabilityai/stable-diffusion-xl-base-1.0`
- API: Cloudflare AI Workers REST endpoint
- `num_inference_steps: 25, guidance_scale: 7.5`

**Provider 6: Pollinations (Last Resort)**
- Unhosted — returns a URL directly, not uploaded to Supabase
- `hosted: false` in response — client should handle gracefully

All hosted providers upload the resulting blob to `Supabase Storage → post-images bucket`.

---

## Cleanup Required

This section documents dead code and inconsistencies identified during the May 2026 code audit. These should be cleaned up before adding new features.

### 0. Cognitive Lenses + Myth-busting (Full Removal)

**Locations:**
- `src/lib/cognitive-lenses.ts` — lens definitions
- `src/lib/angle-selector.ts` — lens selection logic
- `src/app/api/generate/route.ts` — `selectAngle()` call + `recentLenses` tracking
- `src/lib/mode-templates.ts` — `"Myth-busting"` template (uses `{{lens}}`, `{{lensDefinition}}`)
- `src/lib/prompt-builder.ts` — `lens` and `lensDefinition` in `variables` map
- `src/lib/prompt-builder.ts` — `PromptBuilderConfig.lens`, `.lensDefinition`, `.groupContext` fields
- `src/app/api/generate/route.ts` — `extractRecentLenses()` helper + `recentLenses` passed to `buildModePrompt`
- `community_posts.cognitive_lens` column — still written to but serves no active purpose

**Action:** Delete `cognitive-lenses.ts` and `angle-selector.ts`. Remove `selectAngle()` call and `recentLenses` tracking from `generate/route.ts`. Remove `lens`/`lensDefinition`/`groupContext` from `PromptBuilderConfig` and the variables map. Delete the `"Myth-busting"` template from `mode-templates.ts`. Consider dropping `community_posts.cognitive_lens` column.

---

### 1. Dead Function: `buildLegacyPrompt()` in `generate/route.ts`

**Location:** `src/app/api/generate/route.ts`, lines ~277-514

`buildLegacyPrompt()` is a complete function (238+ lines) that builds the old PAS/BAB/AIDA framework-based prompt. It is **never called** — `buildModePrompt()` replaced it. It references `FRAMEWORK_SHAPES`, `FRAMEWORKS`, `NARRATIVE_COMBINATIONS`, `ANGLE_POOL`, `TIP_MODE`, and others that are only used by this dead function.

**Action:** Delete `buildLegacyPrompt()` and remove its unused imports:
- `HarmCategory`, `HarmBlockThreshold` from `@google/generative-ai`
- `getFramework`, `Framework`, `FRAMEWORKS`, `TIP_MODE`, `CTA_BY_POST_TYPE`, `SEASONAL_NICHE_NARRATIVE`, `getSeason`, `NARRATIVE_COMBINATIONS`, `NarrativeEntry`, `ANGLE_POOL` from `@/lib/frameworks`
- `ColorTheme`, `BusinessVisuals` from `@/lib/constants`

### 2. Broken Return Types: `deepinfra` and `openrouter` in `callAIProvider()`

**Location:** `src/app/api/generate/route.ts`, lines ~152-223

Both the `deepinfra` and `openrouter` branches inside `callAIProvider()` return a plain string (`return content || ""`) instead of the required `AIProviderResponse` object `{ content, tokensUsed, provider }`. This causes a TypeScript type error and would break if either provider were actually called from the fallback chain.

The fallback chain currently only calls `["anthropic", "openrouter", "deepinfra"]`, so `openrouter` and `deepinfra` will be hit, but the broken return shape means `result.content`, `result.tokensUsed`, and `result.provider` will be undefined.

**Action:** Fix both branches to return `{ content: content || "", tokensUsed: 0, provider: "deepinfra" }` (and equivalent for openrouter).

### 3. Dead Providers: `gemma` and `gemini` in `callAIProvider()`

**Location:** `src/app/api/generate/route.ts`, lines ~225-267

The `gemma` and `gemini` branches in `callAIProvider()` are complete implementations but never reached — the production fallback chain is `["anthropic", "openrouter", "deepinfra"]` and the TOGGLE mode uses `AI_PROVIDER` env var (unlikely to be set to these). The `groq` branch (line 82) similarly uses `openai/gpt-oss-120b` model via the Groq client but `groq` is not in the fallback chain either.

**Action:** Either add these to the fallback chain or delete them. If keeping as TOGGLE options, fix the return types.

### 4. Unused `const tools` in `generate-image/route.ts`

**Location:** `src/app/api/generate-image/route.ts`, line 13

```typescript
const tools = [ {googleSearch: {},},] as any;
```

Declared at module scope but never used anywhere in the file.

**Action:** Delete this line.

### 5. Stale Column Reads: `storefront_architecture`, `interior_layout`, `business_visuals`

**Location:** `src/app/api/generate/route.ts`, line 599

```typescript
.select('id, business_name, ..., storefront_architecture, interior_layout, zones, ...')
```

The new brand discovery system writes to `zones` (not `storefront_architecture` or `interior_layout`). These two legacy columns are still selected but the data in them is from before zones were introduced — new discoveries never update them. `business_visuals` (logoColors, storefrontColors, interiorColors) is also selected but never written by the new discovery system.

The old `parseInteriorLayout()` and `parseExteriorLayout()` functions parse these for injection into `businessIntel`, but `businessIntel.zones` (from the new system) takes precedence in the prompt builder.

**Action:** 
- After confirming all existing businesses have been re-discovered (data in `zones` is current), remove `storefront_architecture` and `interior_layout` from the select query in `generate/route.ts`.
- Remove `business_visuals` from the select query and from `BusinessIdentity` type.
- Eventually drop these columns from the database schema.

### 6. Deprecated `getRecentOfferings()` in `post-history.ts`

**Location:** `src/lib/post-history.ts`, lines ~84-92

```typescript
/** @deprecated Use getRecentOfferingsInOrder */
export async function getRecentOfferings(...) {
  return getRecentOfferingsInOrder(...);
}
```

This wrapper adds nothing. Check all call sites and update to `getRecentOfferingsInOrder()`, then delete.

### 7. Commented-Out Architect Repair Logic in `GenerateDashboard.tsx`

**Location:** `src/components/GenerateDashboard.tsx`, lines ~431-472

A large commented-out block for "CASE 3: Architect Error" repair logic. Currently replaced by a simpler "generation failed" message.

**Action:** Decide if this repair flow will be re-enabled. If not, delete the commented block.

### 8. `textModel` and `imageModel` Instantiated but Unused in `generate-image/route.ts`

**Location:** `src/app/api/generate-image/route.ts`, lines 23-24

```typescript
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, ...);
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" }, ...);
```

Both are instantiated at module scope but never called — they're leftovers from the Gemini Imagen pipeline.

**Action:** Delete both lines (and the large commented-out Gemini image block above them).

### 9. Unused `save_post_and_deduct` Parameter: `p_image_prompt`

**Action needed in Supabase:** Verify `save_post_and_deduct` still accepts all the new community_posts columns (`post_type`, `content_category`, `content_summary`, `offerings_referenced`, `event_referenced`, `hook_used`, `voice_used`, `ai_provider`, `word_count`, `tokens_used`). If the RPC was not updated when the new columns were added, it will silently ignore those fields. Update the RPC signature to include them.

### 10. image-mode-templates.ts — architect path only
Now that GEMINI_MULTIMODAL is the primary path, image-mode-templates.ts 
is architect-path-only. Add a comment at the top of the file:
"// ARCHITECT PATH ONLY — for GEMINI_MULTIMODAL see image-mode-templates-multimodal.ts"
The [EXAMPLE] sections contain FLUX prompt boilerplate and should not be 
used in multimodal prompts.

### 11. Local event / news categories updated
mode-templates.ts category list for "Local event / news" was updated to:
["The regular", "Neighborhood rhythm", "Peak / rush", "Shared moment", "Season / weather impact"]
Verify this is reflected in NARRATIVE_COMBINATIONS and any other lookup 
that references the old category list.

---

## Appendices

### File Structure Overview

```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Main content studio
│   ├── profile/
│   │   └── page.tsx              # Business setup & brand discovery (zone photo slots)
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # Text generation (fallback: anthropic→openrouter→deepinfra)
│   │   ├── generate-image/
│   │   │   └── route.ts          # Image generation (polling, FLUX chain)
│   │   ├── prepare-image-prompt/
│   │   │   └── route.ts          # Architect (async, writes to DB)
│   │   ├── discover-brand/
│   │   │   └── route.ts          # Brand discovery
│   │   ├── user/
│   │   │   └── claim-welcome-credits/route.ts
│   │   └── webhooks/clerk/route.ts
│   └── layout.tsx
├── components/
│   ├── GenerateDashboard.tsx     # Content generation UI (async image polling)
│   ├── PostActions.tsx
│   └── SavedImage.tsx
└── lib/
    ├── brandDiscovery.ts         # Vision (zones) + research (offerings)
    ├── parse-business-intel.ts   # parseZones, extractOfferingNames, extractPracticesByOffering
    ├── offering-rotation.ts      # getOfferingCatalog, selectNextOffering ← NEW
    ├── post-history.ts           # getRecentPostHistory, getRecentOfferingsInOrder
    ├── post-parser.ts            # parseGeneratedPost, validateOfferings ← NEW
    ├── image-visual-mode.ts      # Maps business category → product|experience mode ← NEW
    ├── image-mode-templates-multimodal.ts # Multimodal-native image templates (GEMINI_MULTIMODAL path) ← NEW
    ├── image-mode-templates.ts   # Image templates for ARCHITECT/FLUX path only
    ├── mode-templates.ts         # 5 active post mode templates (Myth-busting deprecated)
    ├── image-brand-variables.ts  # Brand context builder for Architect ← NEW
    ├── post-type-zone-focus.ts   # Maps post type → zone focus ← NEW
    ├── select-zone-photo.ts      # Picks zone data for Architect ← NEW
    ├── cognitive-lenses.ts       # 4 lenses × 5 variants unused — To delete
    ├── angle-selector.ts         # Lens selection (avoids repetition)
    ├── prompt-builder.ts         # buildModePrompt (fills mode templates)
    ├── frameworks.ts             # LEGACY: PAS/BAB/AIDA + angle pools (used by buildLegacyPrompt)
    ├── group-angle-selector.ts   # Possibly unused — To delete
    ├── lens-groups.ts            # Possibly unused — To delete
    ├── lens-mapping.ts           # Possibly unused — To delete
    ├── niche-to-group-map.ts     # Possibly unused — To delete
    ├── category-selector.ts      # selectCategory for post type
    ├── supabase.ts               # Supabase client creation
    └── constants.ts              # Voice options, categories, niches
```

**Possibly unused lib files** (not verified — need audit):
- `frameworks.ts` — heavily used by `buildLegacyPrompt` (dead code). Once that's removed, verify if anything else imports from this file.
- `group-angle-selector.ts`, `lens-groups.ts`, `lens-mapping.ts`, `niche-to-group-map.ts` — check if any of these are referenced in active code paths.

---

**End of Developer Reference Guide**
