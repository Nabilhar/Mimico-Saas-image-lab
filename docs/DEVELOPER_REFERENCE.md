# Shoreline Studio - Developer Reference Guide

**Version:** 1.0  
**Last Updated:** May 13, 2026  
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
│  /api/generate-image        - Image generation                  │
│  /api/prepare-image-prompt  - Image prompt architecture         │
│  /api/discover-brand        - Brand identity extraction         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL AI SERVICES                         │
├─────────────────────────────────────────────────────────────────┤
│  • Claude (Anthropic)  - Content generation (Haiku 4.5)         │
│  • Gemini (Google)     - Vision analysis + Image generation     │
│  • Groq/OpenRouter     - Prompt optimization                    │
└─────────────────────────────────────────────────────────────────┘
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
   - Voice selection (tone preference)
   - Post type selection (6 modes)
   ↓
2. BRAND DISCOVERY (One-time/On-demand)
   ↓
   - Photo upload → Gemini Vision API
   - Web research → Claude Haiku + Web Search
   - Merge visual + semantic data
   - Store in Supabase (color_theme, business_description, etc.)
   ↓
3. CONTENT GENERATION
   ↓
   - Select cognitive lens (4 lenses rotate to avoid repetition)
   - Build mode-specific prompt (6 templates)
   - Inject business context + brand identity
   - Send to Claude Haiku 4.5
   - Receive generated post (150-200 words)
   ↓
4. IMAGE GENERATION (Optional)
   ↓
   - Pass post + brand data to "Architect" (prompt optimizer)
   - Architect writes detailed image prompt (60-70 words)
   - Send to Gemini Imagen 3
   - Receive 1024x1024 image
   ↓
5. SAVE & DISPLAY
   ↓
   - Deduct credits (2 for text, 3 for image)
   - Save to community_posts table
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
- **Storage:** Supabase Storage (for uploaded photos)
- **Authentication:** Clerk

### AI & ML Services
| Service | Purpose | Model | Cost |
|---------|---------|-------|------|
| **Anthropic Claude** | Content generation | Haiku 4.5 | ~$0.0005/post |
| **Google Gemini** | Vision analysis | Gemini 2.5 Flash | Free tier |
| **Google Gemini** | Image generation | Imagen 3 | ~$0.04/image |
| **Groq** | Fast prompt optimization | Llama 3.1 8B | Very low |
| **OpenRouter** | Alternative routing | Claude Haiku | ~$0.0005/post |

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
├─ business_visuals (JSONB) - {logoColors, storefrontColors, interiorColors}
├─ business_description (JSONB) - Craft identity, neighborhood, products, etc.
├─ storefront_architecture (JSONB) - Physical appearance details
├─ interior_layout (JSONB) - Interior design details
├─ contact_info (JSONB) - Discovered contact details
├─ last_analyzed_business_name (TEXT) - For change detection
├─ last_analyzed_street, last_analyzed_city (TEXT)
└─ last_text_discovery_at (TIMESTAMP)

community_posts
├─ id (UUID, PK)
├─ business_id (TEXT, FK → profiles.id) - Note: Uses user_id, not business UUID
├─ content (TEXT) - Generated post text
├─ image_url (TEXT, nullable) - Supabase storage URL
├─ image_prompt (TEXT, nullable) - The prompt used for image generation
├─ created_at (TIMESTAMP)
├─ business_name (TEXT) - Snapshot at time of creation
├─ location_snapshot (TEXT) - Snapshot at time of creation
└─ cognitive_lens (TEXT) - Which lens was used
```

### Key Relationships

```
profiles (1) ──────→ (many) businesses
   │
   └──────→ (many) community_posts (via business_id = profiles.id)
```

**Important Note:** `community_posts.business_id` currently stores the **user ID** (not the business UUID). This is historical and works because users initially had only one business. Future refactoring may change this to use the actual business UUID.

---

## Authentication Flow

### Technology: Clerk + Supabase RLS

```
1. USER SIGNS IN
   ↓
   Clerk handles authentication
   ↓
2. CLERK GENERATES JWT
   ↓
   JWT contains user_id
   ↓
3. NEXT.JS MIDDLEWARE
   ↓
   getToken({ template: 'supabase-prod' })
   ↓
   Returns Supabase-compatible JWT
   ↓
4. SUPABASE CLIENT CREATION
   ↓
   createClerksupabase(() => getToken({ template }))
   ↓
   Supabase client has user context
   ↓
5. ROW LEVEL SECURITY (RLS)
   ↓
   Supabase enforces:
   - profiles: user can only see/edit their own row
   - businesses: user can only see/edit their own businesses
   - community_posts: user can only see/edit posts where business_id = auth.uid()
```

### Supabase Templates

The system uses **two Supabase templates** configured in Clerk:

- **Development:** `supabase-dev`
- **Production:** `supabase-prod`

Selection is automatic based on `process.env.NEXT_PUBLIC_APP_ENV`:

```typescript
const template = process.env.NEXT_PUBLIC_APP_ENV === 'development'
  ? 'supabase-dev'
  : 'supabase-prod';
```

### New User Onboarding Flow

```
1. User signs up with Clerk
   ↓
2. Clerk webhook fires → /api/webhooks/clerk
   ↓
3. handle_new_user() RPC function runs
   ↓
   - Creates row in profiles table
   - Sets tier = 1 (free)
   - Sets credits = 0
   - Sets free_text_discovery_used = false
   ↓
4. User redirected to /profile
   ↓
5. User fills in business details
   ↓
6. Brand discovery runs (free for first time)
   ↓
7. User redirected to /dashboard
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

**Two Parallel Paths:**

#### Path A: Vision Analysis (Gemini 2.5 Flash)
- **Input:** 1-3 photos (storefront, logo, interior)
- **Process:**
  1. Photos uploaded to Supabase Storage
  2. Public URLs sent to Gemini Vision API
  3. Gemini extracts:
     - Color palette (primary, secondary, accent)
     - Storefront architecture (materials, style, signage)
     - Interior layout (seating, lighting, counter position)
     - Logo colors
- **Output:** Stored in `color_theme`, `business_visuals`, `storefront_architecture`, `interior_layout`
- **Cost:** Free (within Gemini free tier)

#### Path B: Web Research (Claude Haiku 4.5 + Web Search)
- **Input:** Business name + full address + category + niche
- **Process:**
  1. Claude searches the web for business information
  2. Extracts:
     - Craft identity (what makes them unique)
     - Neighborhood context (local landmarks, transit)
     - Products/services offered
     - Local trends (customer behaviors)
     - Contact information (email, social, phone)
  3. Strips citations from search results
- **Output:** Stored in `business_description`, `contact_info`
- **Cost:** 3 credits (Tier 1 after first use), Free (Tier 2)

**Merge Logic:**
- Vision data **always overwrites** color/visual fields (source of truth for aesthetics)
- Research data **always overwrites** semantic fields (source of truth for craft identity)
- `brand_source` set to:
  - `"photos"` if vision analysis succeeded and provided rich data
  - `"text_search"` if only research ran or vision was blind/limited

**Code Location:**
- `lib/brandDiscovery.ts` - Core logic
- `/api/discover-brand/route.ts` - API endpoint

---

### 2. Content Generation System

**Architecture: Mode Templates + Cognitive Lenses**

#### 6 Post Modes (Templates)

Each mode defines **structure, tone, and constraints** for content:

| Mode | Post Type | Purpose | Structure |
|------|-----------|---------|-----------|
| **EDUCATION - Tip** | Tip of the Day | Share 3 practical tips | Numbered list (1, 2, 3) |
| **EDUCATION - Myth** | Myth-busting | Correct misconceptions | Belief → Reality → Correction |
| **OBSERVATION - Behind** | Behind the scenes | Show process moments | Present-tense observation |
| **OBSERVATION - Promo** | Promotion/Offer | Announce deals atmospherically | No sales pressure, just facts |
| **CASUAL - Event** | Local event / shout-out | Community engagement | Conversational, no CTA |
| **ATMOSPHERIC - Moment** | Community moment | Ambient presence | Pure sensory, no teaching |

**Template System:**
- Defined in `lib/mode-templates.ts`
- Each template is a ~500-word prompt with placeholders
- Placeholders include: `{{business_name}}`, `{{niche}}`, `{{lens}}`, `{{voice_description}}`, etc.

#### 4 Cognitive Lenses (Content Angles)

Lenses define **what pattern to demonstrate** in the content:

| Lens | Pattern | Example Context |
|------|---------|------------------|
| **Latent Point** | The early decision that determines all future outcomes | "HVAC sizing calculation that sets comfort and efficiency for next 15 years" |
| **Tradeoff Lock** | The operational shortcut that creates long-term costs | "Installation shortcut that reduces time but increases future maintenance risk" |
| **Divergence** | Why identical inputs produce different results | "Identical treatment paths → different recovery speeds due to home exercise execution quality" |
| **Invisible Causality** | The hidden mechanism that determines surface outcomes | "The cleaning technique that determines coating longevity (scrubbing vs. rinsing pressure)" |

**Lens Selection Logic:**
```typescript
// In lib/angle-selector.ts
export function selectAngle(recentLenses: CognitiveLens[]): AngleVariant {
  // Get lenses NOT used in last 3 posts
  const availableLenses = ALL_LENSES.filter(
    lens => !recentLenses.slice(0, 3).includes(lens)
  );
  
  // Pick random available lens
  const selectedLens = availableLenses[
    Math.floor(Math.random() * availableLenses.length)
  ];
  
  // Get 5 variants for this lens
  const variants = COGNITIVE_LENSES[selectedLens];
  
  // Pick random variant
  return variants[Math.floor(Math.random() * variants.length)];
}
```

**Smart Context Strategy:**
- Lenses have **generic universal contexts** that work across all niches
- At runtime, Claude is instructed to **mentally translate** generic context into niche-specific examples
- This avoids maintaining 132 niche-specific contexts (11 categories × 12 niches × 4 lenses × 5 variants)

#### Generation Flow

```
1. User clicks "Generate" on Dashboard
   ↓
2. System fetches:
   - Business data (name, location, niche, voice)
   - Brand identity (color_theme, business_description, etc.)
   - Recent post history (last 5 posts with cognitive_lens field)
   ↓
3. Select post type → determine MODE template
   ↓
4. Extract recent lenses from history
   ↓
5. Select cognitive lens (avoid repetition)
   ↓
6. Build prompt:
   - Start with mode template
   - Replace {{placeholders}} with actual data
   - Inject selected lens definition
   - Add brand intelligence (craft identity, neighborhood, etc.)
   - Add voice instructions
   ↓
7. Send to Claude Haiku 4.5
   - Model: "anthropic/claude-haiku-4.5:beta" (via OpenRouter)
   - Temperature: 0.7
   - Max tokens: 1500
   ↓
8. Receive generated post
   - Clean any preamble (<<<POST_BEGIN>>>)
   - Validate length (target: 150-200 words)
   ↓
9. Display to user
   - User can regenerate or save
   ↓
10. If user chooses image:
    - Proceed to Image Generation flow
```

**Code Locations:**
- `lib/mode-templates.ts` - 6 mode templates
- `lib/cognitive-lenses.ts` - 4 lenses × 5 variants each
- `lib/angle-selector.ts` - Lens selection logic
- `lib/prompt-builder.ts` - Prompt assembly (fills placeholders)
- `/api/generate/route.ts` - API endpoint

---

### 3. Image Generation System

**Three-Stage Pipeline:** Post → Architect → Imagen

#### Stage 1: User Request
- User generates a text post
- Clicks "Generate Image" button
- Post content + business data sent to `/api/prepare-image-prompt`

#### Stage 2: The Architect (Prompt Optimizer)

**Purpose:** Convert a business post into a **photorealistic image prompt** that Imagen can render well.

**Input Data:**
```typescript
{
  post: string,                    // The generated text
  business_name: string,
  niche: string,
  business_description: {...},     // Craft identity, products, etc.
  color_theme: {...},              // Primary, secondary, accent colors
  business_visuals: {...},         // Logo/storefront/interior colors
  storefront_architecture: {...},  // Physical appearance
  interior_layout: {...}           // Interior design details
}
```

**Architect Modes (Toggle):**

The system supports 4 different AI models for architecting:

| Mode | Model | Provider | Best For |
|------|-------|----------|----------|
| `GEMINI` | Gemini 2.5 Flash | Google | General purpose, balanced |
| `GROQ` | Llama 3.1 8B | Groq | Fastest, low latency |
| `GEMMA` | Gemma 4 31B | Groq | Grounded, search-enhanced |
| `OPENROUTER` | Claude Haiku 4.5 | OpenRouter | Quality + speed balance |

**Current Default:** `GEMMA` (line 38 in `/api/prepare-image-prompt/route.ts`)

**Architect Instructions (System Prompt):**
```
You are a professional brand photographer specializing in authentic, 
lifestyle imagery for local businesses.

CRITICAL OUTPUT REQUIREMENT:
- Output ONLY the image prompt description
- No preamble, no "Here's the prompt:", no markdown, no analysis
- Just the raw description that will be sent directly to the image generator

YOUR ASSIGNMENT:
Transform this business post into a photorealistic image prompt that:
1. Captures ONE moment that reinforces the post's message
2. Feels authentic (real world imperfections, natural lighting)
3. Integrates brand colors naturally (not forced)
4. Shows the craft in action

[Full detailed instructions follow...]
```

**Output:** 60-70 word photorealistic description
- Example: *"Medium shot of skilled hands kneading sourdough on marble counter dusted with flour. Soft morning light through window casts gentle shadows. Professional mixing bowls visible in background. Warm cream and natural wood tones match bakery aesthetic. Focus on flour texture and dough elasticity. Canon EF 50mm f/1.4, natural depth of field, authentic workspace."*

**Code Location:**
- `/api/prepare-image-prompt/route.ts` - API endpoint
- Architect prompt is inline (lines ~150-700)

#### Stage 3: Image Generation (Gemini Imagen 3)

**Process:**
1. Architect prompt sent to `/api/generate-image`
2. API calls Gemini Imagen 3 via Google Generative AI SDK
3. Parameters:
   - **Model:** `imagen-3.0-generate-001`
   - **Number of images:** 1
   - **Aspect ratio:** `1:1` (square, 1024×1024)
   - **Safety settings:** Default (block harmful content)
   - **Person generation:** Allowed (for showing craft in action)
4. Imagen returns base64-encoded image
5. Image uploaded to Supabase Storage (`community-post-images` bucket)
6. Public URL returned

**Cost:** ~$0.04 per image (charged to user as 3 credits)

**Code Location:**
- `/api/generate-image/route.ts`

---

### 4. Credit System

**Credit Economics:**

| Action | Cost | Notes |
|--------|------|-------|
| **Text post generation** | 2 credits | Claude Haiku call |
| **Image generation** | 3 credits | Gemini Imagen call |
| **Text discovery (Tier 1)** | 3 credits | After first free use |
| **Text discovery (Tier 2)** | 0 credits | Always free |
| **Vision analysis** | 0 credits | Always free |

**Initial Credit Allocation:**
- New users: **0 credits** (requires purchase or promo code)
- Welcome bonus: **25 credits** (claim via `/api/user/claim-welcome-credits`)

**Credit Deduction Flow:**

```
1. User generates post + image
   ↓
2. Content generated and shown to user
   ↓
3. User clicks "Save"
   ↓
4. Frontend calls savePostToCloud() with content + imageUrl
   ↓
5. RPC function: save_post_and_deduct(
     p_user_id,
     p_content,
     p_image_url,
     p_amount: 5,  // 2 for text + 3 for image
     p_business_name,
     p_location_snapshot,
     p_cognitive_lens
   )
   ↓
6. RPC atomically:
   a. Checks if user has >= 5 credits
   b. If yes:
      - Inserts into community_posts
      - Deducts 5 credits from profiles.credits
      - Returns {success: true, post_id, new_balance}
   c. If no:
      - Returns {success: false, error: "insufficient_credits"}
   ↓
7. Frontend receives response
   - Success: Shows new post in library, updates credit display
   - Failure: Shows "Insufficient credits" alert
```

**RPC Functions:**

```sql
-- Save post and deduct credits atomically
save_post_and_deduct(
  p_user_id TEXT,
  p_content TEXT,
  p_image_url TEXT,
  p_amount INTEGER,
  p_business_name TEXT,
  p_location_snapshot TEXT,
  p_cognitive_lens TEXT
) RETURNS JSONB

-- Deduct credits for discovery
deduct_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_reason TEXT,
  p_business_id UUID,
  p_metadata JSONB
) RETURNS JSONB

-- Mark first free discovery as used
mark_free_discovery_used(p_user_id TEXT) RETURNS VOID
```

**Code Locations:**
- Supabase: Database → Functions (via SQL Editor)
- Frontend: `Dashboard_Page` → `savePostToCloud()` function

---

### 5. User Tiers System

**Tier 1: Free Users**
- **Businesses:** 1 maximum
- **Text Discovery:** First free, then 3 credits
- **Vision Discovery:** Always free
- **Credit Purchase:** Required after initial credits run out
- **Business Mode:** Update only (no create after first business)

**Tier 2: Premium Users**
- **Businesses:** Unlimited
- **Text Discovery:** Always free
- **Vision Discovery:** Always free
- **Credit Purchase:** Not needed (all generation still free? TBD)
- **Business Mode:** Both create and update

**Tier Assignment:**
- New users default to Tier 1
- Manual upgrade to Tier 2 (admin dashboard TBD)
- Stored in `profiles.tier` (INTEGER: 1 or 2)

**Code Enforcement:**
- Profile page checks tier before allowing "Create New Business"
- Discovery route checks tier to determine pricing
- RPC functions check tier when deducting credits

---

## Key Components Reference

### Dashboard (`app/dashboard/page.tsx`)

**State Management:**
```typescript
const [businessData, setBusinessData] = useState<BusinessData | null>(null);
const [voice, setVoice] = useState("Warm & Conversational");
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("generate");
```

**Key Functions:**

#### `loadBusinessData()`
- Fetches active business via `get_active_business()` RPC
- Fetches user credits from profiles table
- Fetches posts from community_posts (filtered by business_id)
- Updates local state

#### `savePostToCloud(newContent, imageUrl, cognitiveLens)`
- Calls `save_post_and_deduct()` RPC
- Deducts 2 credits (text) + 3 credits (image if present)
- Adds post to local state immediately for fast UI
- Returns post UUID for reference

#### `deletePost(postId)`
- Confirms with user
- Deletes from community_posts table
- Reloads business data to refresh UI

**UI Sections:**

1. **Header:** Business name, location, credits display
2. **Tabs:** "Write New Content" | "Saved Library"
3. **Generate Tab:** `<GenerateDashboard />` component
4. **Library Tab:** Grid of saved posts (Facebook-style cards)

---

### GenerateDashboard Component (`components/GenerateDashboard.tsx`)

**Purpose:** Main content generation interface

**Key Features:**
- Voice selector (dropdown)
- Post type selector (6 buttons)
- Generate button (with loading state)
- Image generation toggle
- Save/Delete buttons

**Generation Flow:**
```typescript
const handleGenerate = async () => {
  // 1. Validate credits
  if (userCredits < requiredCredits) {
    alert("Insufficient credits!");
    return;
  }
  
  // 2. Call /api/generate
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      businessId, businessName, niche, voice,
      postType, fullAddress, category,
      // ... more context
    })
  });
  
  const { content } = await response.json();
  
  // 3. Display content to user
  setGeneratedContent(content);
  
  // 4. If user wants image, call /api/prepare-image-prompt
  if (includeImage) {
    const promptResponse = await fetch('/api/prepare-image-prompt', {
      method: 'POST',
      body: JSON.stringify({ post: content, /* ... */ })
    });
    
    const { visualDescription } = await promptResponse.json();
    
    // 5. Call /api/generate-image
    const imageResponse = await fetch('/api/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: visualDescription })
    });
    
    const { imageUrl } = await imageResponse.json();
    setGeneratedImage(imageUrl);
  }
  
  // 6. User clicks Save → onGenerateSuccess() callback
  // This triggers savePostToCloud() in parent Dashboard
};
```

---

### Profile Page (`app/profile/page.tsx`)

**Purpose:** Business setup and brand discovery

**Mode:** "Create" vs "Update"
- **Create:** User has 0 businesses, filling form for first time
- **Update:** User has existing business, editing details

**Brand Discovery Checkbox (Tier 1 Only):**
```tsx
{userTier === 1 && (
  <div className="gradient-border">
    <label>
      <input 
        type="checkbox" 
        checked={runTextDiscovery}
        onChange={(e) => setRunTextDiscovery(e.target.checked)}
      />
      🔍 Re-run Brand Discovery
      {!freeDiscoveryUsed ? (
        <span className="badge-free">FREE</span>
      ) : (
        <span className="badge-cost">3 CREDITS</span>
      )}
    </label>
    <p className="description">
      {!freeDiscoveryUsed
        ? "Your first discovery is FREE! We'll research your business..."
        : "Check this box to refresh your brand research. Cost: 3 credits"}
    </p>
  </div>
)}
```

**Save Logic:**
```typescript
const handleSave = async () => {
  // 1. Validate tier restrictions
  if (userTier === 1 && saveMode === 'create' && businessCount >= 1) {
    alert("Tier 1 users can only have one business.");
    return;
  }
  
  // 2. Check if discovery is needed and affordable
  if (runTextDiscovery && !freeDiscoveryUsed && userCredits < 3) {
    alert("Insufficient credits for discovery.");
    return;
  }
  
  // 3. Upload photos to Supabase Storage (if any)
  const uploadedPhotoData = await uploadPhotosToSupabase(photos);
  
  // 4. Save/update business in Supabase
  // (switch_or_create_business RPC or direct UPDATE)
  
  // 5. Trigger brand discovery if needed
  if (runTextDiscovery || uploadedPhotoData.length > 0) {
    await fetch('/api/discover-brand', {
      method: 'POST',
      body: JSON.stringify({
        business_id: businessId,
        business_name, address, photos: uploadedPhotoData,
        category, niche,
        run_text_discovery: runTextDiscovery
      })
    });
  }
  
  // 6. Navigate to dashboard
  router.push('/dashboard');
};
```

---

## Database Functions & RPCs

### Core RPCs

#### `get_active_business(p_user_id TEXT)`
**Purpose:** Fetch the currently active business for a user

**Returns:** Single row from businesses table where `is_active = true`

**Fields Returned:**
- All business columns (name, address, category, niche, voice)
- Brand identity columns (color_theme, business_description, etc.)
- Metadata (brand_source, last_analyzed_*, etc.)

**Usage:**
```typescript
const { data: business } = await supabase
  .rpc('get_active_business', { p_user_id: user.id })
  .single();
```

---

#### `save_post_and_deduct()`
**Purpose:** Atomically save post and deduct credits

**Parameters:**
```sql
p_user_id TEXT,
p_content TEXT,
p_image_url TEXT,
p_amount INTEGER,
p_business_name TEXT,
p_location_snapshot TEXT,
p_cognitive_lens TEXT
```

**Logic:**
```sql
BEGIN
  -- 1. Check credit balance
  SELECT credits INTO user_credits FROM profiles WHERE id = p_user_id;
  
  IF user_credits < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits'
    );
  END IF;
  
  -- 2. Insert post
  INSERT INTO community_posts (
    business_id, content, image_url, business_name,
    location_snapshot, cognitive_lens
  ) VALUES (
    p_user_id, p_content, p_image_url, p_business_name,
    p_location_snapshot, p_cognitive_lens
  ) RETURNING id INTO new_post_id;
  
  -- 3. Deduct credits
  UPDATE profiles 
  SET credits = credits - p_amount 
  WHERE id = p_user_id
  RETURNING credits INTO new_balance;
  
  -- 4. Return success
  RETURN jsonb_build_object(
    'success', true,
    'post_id', new_post_id,
    'new_balance', new_balance
  );
END;
```

**Returns:** JSONB `{success, post_id?, new_balance?, error?}`

---

#### `switch_or_create_business()`
**Purpose:** Create new business or switch active business

**Parameters:**
```sql
p_user_id TEXT,
p_business_id UUID,
p_mode TEXT  -- 'create' | 'update' | 'switch'
```

**Logic:**
```sql
BEGIN
  IF p_mode = 'create' THEN
    -- Create new business, set as active
    INSERT INTO businesses (...) VALUES (...);
  ELSIF p_mode = 'update' THEN
    -- Update existing business
    UPDATE businesses SET ... WHERE id = p_business_id;
  ELSIF p_mode = 'switch' THEN
    -- Deactivate all, activate selected
    UPDATE businesses SET is_active = false WHERE user_id = p_user_id;
    UPDATE businesses SET is_active = true WHERE id = p_business_id;
  END IF;
END;
```

---

#### `deduct_credits()`
**Purpose:** Deduct credits with audit trail (for discovery, future purchases)

**Parameters:**
```sql
p_user_id TEXT,
p_amount INTEGER,
p_reason TEXT,          -- 'text_discovery' | 'image_gen' | etc.
p_business_id UUID,
p_metadata JSONB        -- Flexible: {business_name, timestamp, etc.}
```

**Logic:**
```sql
BEGIN
  -- Check balance
  SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id;
  
  IF current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits'
    );
  END IF;
  
  -- Deduct
  UPDATE profiles SET credits = credits - p_amount WHERE id = p_user_id
  RETURNING credits INTO new_balance;
  
  -- Audit log (optional table for future)
  -- INSERT INTO credit_transactions ...
  
  RETURN jsonb_build_object(
    'success', true,
    'balance', new_balance
  );
END;
```

---

#### `mark_free_discovery_used(p_user_id TEXT)`
**Purpose:** Mark that user has used their one free text discovery

**Logic:**
```sql
UPDATE profiles 
SET free_text_discovery_used = true 
WHERE id = p_user_id;
```

---

#### `handle_new_user(p_user_id TEXT, p_email TEXT)`
**Purpose:** Initialize profile for new Clerk user

**Logic:**
```sql
INSERT INTO profiles (id, email, tier, credits, free_text_discovery_used)
VALUES (p_user_id, p_email, 1, 0, false)
ON CONFLICT (id) DO NOTHING;
```

**Triggered by:** Clerk webhook → `/api/webhooks/clerk`

---

### Utility RPCs

#### `get_user_profile(p_user_id TEXT)`
Returns user tier, credits, and free discovery status

#### `update_businesses_updated_at(p_business_id UUID)`
Updates the `updated_at` timestamp for a business

---

## API Routes

### `/api/generate` (POST)

**Purpose:** Generate text content for social media post

**Request Body:**
```typescript
{
  businessId: string,
  businessName: string,
  niche: string,
  voice: string,
  postType: PostType,
  fullAddress: string,
  category: string,
  // Optional:
  recentHistory?: Post[],
  businessData?: {...}
}
```

**Process:**
1. Fetch business data from Supabase (if not provided)
2. Extract recent lenses from history
3. Select cognitive lens (avoid repetition)
4. Build prompt using mode template
5. Call Claude Haiku via OpenRouter
6. Clean response (remove preamble)
7. Return content

**Response:**
```typescript
{
  content: string,  // Generated post text
  lens: string      // Which lens was used
}
```

**Error Handling:**
- 401: Unauthorized (no Clerk session)
- 500: Generation failed (API error, prompt error, etc.)

---

### `/api/generate-image` (POST)

**Purpose:** Generate image from prompt using Gemini Imagen

**Request Body:**
```typescript
{
  prompt: string,      // Image description from Architect
  businessId: string,
  postId?: string      // Optional: for updating existing post
}
```

**Process:**
1. Call Gemini Imagen 3 API
2. Receive base64-encoded image
3. Upload to Supabase Storage (`community-post-images` bucket)
4. Get public URL
5. If postId provided, update community_posts.image_url
6. Return URL

**Response:**
```typescript
{
  imageUrl: string  // Public Supabase Storage URL
}
```

---

### `/api/prepare-image-prompt` (POST)

**Purpose:** Architect writes photorealistic image prompt

**Request Body:**
```typescript
{
  post: string,               // Generated text content
  businessId: string,
  business_name: string,
  niche: string,
  business_description: {...},
  color_theme: {...},
  business_visuals: {...},
  storefront_architecture: {...},
  interior_layout: {...}
}
```

**Process:**
1. Build architect prompt (inject brand data)
2. Call selected AI model (GEMINI/GROQ/GEMMA/OPENROUTER)
3. Clean response (remove preamble, "<<<PROMPT_BEGIN>>>")
4. Validate length (~60-70 words ideal)
5. Return prompt

**Response:**
```typescript
{
  visualDescription: string  // 60-70 word image prompt
}
```

**Model Selection:** Toggle via `ARCHITECT_MODE` constant (line 38)

---

### `/api/discover-brand` (POST)

**Purpose:** Run brand discovery (vision + research)

**Request Body:**
```typescript
{
  business_id: string,
  business_name: string,
  address: {
    street: string,
    city: string,
    province_state: string,
    country: string,
    postalCode: string
  },
  photos: UploadedPhoto[],  // {url, mimeType, label}[]
  category: string,
  niche: string,
  run_text_discovery: boolean  // Explicit user opt-in
}
```

**Process:**

**Step 1: Validate User & Check Credits**
```typescript
const userProfile = await supabase.rpc('get_user_profile', { p_user_id });
const userTier = userProfile.tier;
const userCredits = userProfile.credits;
const freeDiscoveryUsed = userProfile.free_text_discovery_used;

if (userTier === 1 && run_text_discovery) {
  if (!freeDiscoveryUsed) {
    // First free discovery
    isFirstFree = true;
  } else if (userCredits < 3) {
    return 402 Payment Required;
  }
}
```

**Step 2: Run Text Discovery (if approved)**
```typescript
if (run_text_discovery) {
  await discoverAndSaveBrandIdentity(
    business_id, business_name, address,
    [], category, niche  // Empty photos = text-only
  );
  
  // Deduct credits (if not first free)
  if (!isFirstFree && userTier === 1) {
    await supabase.rpc('deduct_credits', {
      p_user_id, p_amount: 3,
      p_reason: 'text_discovery'
    });
  }
}
```

**Step 3: Run Vision Analysis (if photos uploaded)**
```typescript
if (photos.length > 0) {
  const visionData = await analyzePhotosWithGemini(
    photos, business_name, fullAddress
  );
  
  // Save vision results to business table
  await supabase.from('businesses').update({
    color_theme: {...},
    business_visuals: {...},
    storefront_architecture: {...},
    interior_layout: {...},
    brand_source: 'photos'
  });
}
```

**Response:**
```typescript
{
  success: boolean,
  credits_charged?: number  // If Tier 1 and credits deducted
}
```

**Error Responses:**
- 401: Unauthorized
- 402: Insufficient credits
- 500: Discovery failed

---

### `/api/user/claim-welcome-credits` (POST)

**Purpose:** Award welcome bonus credits to new users

**Request:** No body (uses Clerk user ID from session)

**Process:**
```typescript
const { userId } = await auth();

// Check if already claimed
const { data: profile } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', userId)
  .single();

if (profile.credits > 0) {
  return { message: "Already claimed" };
}

// Award 25 credits
await supabase
  .from('profiles')
  .update({ credits: 25 })
  .eq('id', userId);
```

**Response:**
```typescript
{
  success: boolean,
  newBalance: number
}
```

---

### `/api/webhooks/clerk` (POST)

**Purpose:** Handle Clerk user creation webhook

**Process:**
1. Verify webhook signature (Clerk SDK)
2. Extract user ID and email
3. Call `handle_new_user()` RPC
4. Return 200 OK

**Important:** Must be configured in Clerk Dashboard:
- **Webhook URL:** `https://shorelinestudio.ca/api/webhooks/clerk`
- **Events:** `user.created`
- **Signing Secret:** In `.env` as `CLERK_WEBHOOK_SECRET`

---

## Environment Variables

### Required for Development

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # For admin operations

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...

# Environment
NEXT_PUBLIC_APP_ENV=development  # or 'production'

# Optional: Model Selection
ARCHITECT_MODE=GEMMA  # GEMINI | GROQ | GEMMA | OPENROUTER
```

### Production-Only Variables

```bash
# Vercel deployment sets these automatically
VERCEL_URL=shorelinestudio.ca
VERCEL_ENV=production
```

---

## Deployment & Maintenance

### Deployment Process

**Current Setup:**
- **Platform:** Vercel
- **Branch:** `main` (production), `dev` (staging)
- **Domain:** shorelinestudio.ca
- **Auto-deploy:** Enabled for both branches

**Deploy Steps:**

```bash
# 1. Development → Staging
git checkout dev
git add .
git commit -m "Feature: description"
git push origin dev

# Vercel auto-deploys to dev-shorelinestudio.vercel.app
# Test thoroughly

# 2. Staging → Production
git checkout main
git merge dev
git push origin main

# Vercel auto-deploys to shorelinestudio.ca
```

---

### Database Migrations

**Problem:** Two separate Supabase databases (dev + prod) require manual syncing

**Solution:** Migration tracking system (see `MIGRATION_LOG.md`)

**Process:**

1. **Make change in DEV Supabase:**
   - Add column, create RPC, update RLS policy, etc.
   - Test in development environment

2. **Document in migration file:**
   - Create `migrations/00X_description.sql`
   - Include both UP (apply) and DOWN (rollback) sections

3. **Update `MIGRATION_LOG.md`:**
   - Add entry with status "Applied to DEV"
   - Include risk level, dependencies, rollback plan

4. **When ready for production:**
   - Run migration SQL in PROD Supabase (via SQL Editor)
   - Update status to "Applied to PROD"
   - Test production thoroughly

**Migration File Template:**
```sql
-- ============================================================================
-- Migration 00X: Description
-- ============================================================================
-- Date: YYYY-MM-DD
-- Status: DEV ONLY
-- Risk: LOW | MEDIUM | HIGH
-- Dependencies: Migration 00X-1 (if any)
-- ============================================================================

-- UP: Apply Migration
BEGIN;

-- Your changes here

COMMIT;

-- ============================================================================
-- DOWN: Rollback Migration
-- ============================================================================
BEGIN;

-- Reverse changes here

COMMIT;
```

---

### Monitoring & Logging

**Current State:** Console logs only

**Console Log Levels:**
```typescript
// Supabase queries
console.log("✅ [Discovery] Text research complete");
console.error("❌ [Discovery] Vision failed:", error);

// AI API calls
console.log("🚀 === [FULL ARCH PROMPT START] ===");
console.log("--- OPENROUTER FINISH REASON:", result.choices[0]?.finish_reason);

// Credit operations
console.log("💳 [Discovery API] Credits deducted. New balance:", balance);
console.error("❌ [Discovery API] Credit deduction failed:", error);
```

**Future Enhancements:**
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Analytics (PostHog, Mixpanel)
- Performance monitoring (Vercel Analytics)

---

### Common Issues & Troubleshooting

#### Issue: "Insufficient credits" when generating

**Debug:**
```typescript
// Check user credits
const { data: profile } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', userId)
  .single();

console.log("User credits:", profile.credits);
```

**Solutions:**
- Award credits via SQL: `UPDATE profiles SET credits = 100 WHERE id = 'user_xxx';`
- Check RPC logic: Ensure `save_post_and_deduct()` is atomic
- Verify credit cost calculation in frontend

---

#### Issue: Brand discovery not running

**Debug:**
```typescript
// Check discovery trigger conditions
const { data: business } = await supabase
  .from('businesses')
  .select('brand_source, last_analyzed_business_name')
  .eq('id', businessId)
  .single();

console.log("Current brand_source:", business.brand_source);
console.log("Last analyzed name:", business.last_analyzed_business_name);
```

**Solutions:**
- Tier 1: Ensure checkbox is checked
- Tier 1: Ensure user has 3 credits (if not first time)
- Check API logs: `/api/discover-brand` should log "PATH 1: Starting text research..."
- Verify `run_text_discovery` is being passed in request

---

#### Issue: Generated posts are generic (not business-specific)

**Debug:**
```typescript
// Check brand intelligence is loaded
console.log("Business description:", businessData.business_description);
console.log("Color theme:", businessData.color_theme);
```

**Solutions:**
- Run brand discovery (especially text research)
- Verify `buildFullPrompt()` is injecting brand data correctly
- Check mode template has placeholders: `{{business_summary}}`
- Ensure smart context instruction is in template: "Before writing, mentally translate..."

---

#### Issue: Images don't match business aesthetic

**Debug:**
```typescript
// Check what data Architect receives
console.log("Color theme sent to Architect:", color_theme);
console.log("Storefront arch sent:", storefront_architecture);
```

**Solutions:**
- Ensure vision analysis ran (check `brand_source = 'photos'`)
- Verify Architect is building correct prompt (check console logs)
- Try different ARCHITECT_MODE (OPENROUTER is good for quality)
- Check Architect system prompt includes brand context

---

#### Issue: Clerk authentication fails

**Debug:**
```typescript
const { userId } = await auth();
console.log("Clerk user ID:", userId);
```

**Solutions:**
- Check `.env` has correct `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Verify Clerk dashboard shows active application
- Clear browser cookies and re-login
- Check Middleware is configured: `middleware.ts`

---

#### Issue: Supabase RLS blocking queries

**Debug:**
- Check Supabase logs: Dashboard → Database → Logs
- Look for "permission denied" errors

**Solutions:**
- Verify RLS policies are correct:
  ```sql
  -- Example: Allow user to read their own profile
  CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
  ```
- Check JWT token includes correct user ID
- Use `supabaseAdmin` client (service role key) for admin operations

---

## Pricing & Business Model

### Current Pricing Structure (Planned)

#### Free Tier (Tier 1)
- **Cost:** $0/month
- **Includes:**
  - 1 business profile
  - First brand discovery FREE
  - 0 initial credits (must purchase or use promo code)
- **Credit Costs:**
  - Text post: 2 credits
  - Image generation: 3 credits
  - Brand re-discovery: 3 credits

#### Premium Tier (Tier 2)
- **Cost:** $29/month (TBD)
- **Includes:**
  - Unlimited business profiles
  - Unlimited brand discoveries (text + vision)
  - Unlimited post generation (text + images)
  - Priority support
  - Early access to new features

### Credit Packages (Tier 1 Users)

| Package | Credits | Cost | Cost per Credit |
|---------|---------|------|-----------------|
| **Starter** | 50 | $5 | $0.10 |
| **Creator** | 150 | $12 | $0.08 |
| **Pro** | 500 | $35 | $0.07 |

**Credit Value Proposition:**
- 50 credits = 25 posts (text-only) or 10 posts (text + image)
- Average small business posts 2-3 times/week = 50 credits lasts ~2 months

### Revenue Model

**Target Customers:**
- Local businesses (restaurants, cafes, clinics, shops)
- Solopreneurs (coaches, consultants, freelancers)
- Small agencies managing multiple clients

**Customer Acquisition:**
- **Launch:** Free credits (25) for early users
- **Waitlist:** After free credits exhausted
- **Referrals:** Give 25 credits, get 25 credits
- **Content Marketing:** "How to write better social posts" (lead to product)

**Monetization Paths:**
1. **Credit purchases** (immediate revenue, low friction)
2. **Tier 2 subscriptions** (recurring revenue, higher LTV)
3. **Agency plans** (Tier 3, manage multiple businesses, white-label)
4. **API access** (for developers building on top of Shoreline)

**Unit Economics:**

| Item | Cost | Selling Price | Margin |
|------|------|---------------|--------|
| Text post | $0.0005 (Haiku) | 2 credits ($0.20) | 99.75% |
| Image generation | $0.04 (Imagen) | 3 credits ($0.30) | 86.7% |
| Brand discovery | $0.005 (Haiku search) | 3 credits ($0.30) | 98.3% |

**Profitability:** Extremely high margins on AI services due to wholesale API pricing vs. retail credit pricing.

**Cost Structure (Monthly):**
- **Infrastructure:** $20-50 (Vercel Pro)
- **Supabase:** $25 (Pro tier for production)
- **Domain:** $15/year
- **Total Fixed Costs:** ~$100/month

**Break-even:** ~15-20 paying Tier 1 users (average $5-7 spend/month) OR 4-5 Tier 2 subscribers

---

## Future Roadmap

### Phase 1: Launch & Validation (Q2 2026) - **CURRENT**

**Goals:**
- ✅ MVP complete (content generation working)
- ✅ Brand discovery system functional
- ✅ Credit system operational
- 🟡 Initial user testing (10-20 early adopters)
- 🟡 Waitlist landing page
- 🟡 Onboarding flow optimization

**Features:**
- ✅ 6 post modes
- ✅ 4 cognitive lenses
- ✅ Text + image generation
- ✅ Brand discovery (photos + research)
- ✅ Credit system
- ✅ User tiers (Tier 1/2)

---

### Phase 2: Payment & Growth (Q3 2026)

**Goals:**
- Integrate Stripe for credit purchases
- Launch Tier 2 subscriptions
- Referral program
- Analytics dashboard for users

**Features to Add:**

#### 2.1 Stripe Integration
```typescript
// /api/checkout/create-session
// Create Stripe checkout for credit packages
import Stripe from 'stripe';

export async function POST(req: Request) {
  const { package_id } = await req.json();
  const { userId } = await auth();
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{
      price: PACKAGE_PRICES[package_id],
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${baseUrl}/dashboard?credits_added=true`,
    cancel_url: `${baseUrl}/dashboard?credits_cancelled=true`,
    metadata: {
      user_id: userId,
      credits: PACKAGE_CREDITS[package_id]
    }
  });
  
  return { sessionId: session.id };
}
```

#### 2.2 Subscription Management
- Tier 2 signup flow
- Subscription dashboard (view plan, cancel, upgrade)
- Usage metrics (posts generated this month, credits used)

#### 2.3 Referral System
```typescript
// /api/referrals/generate-code
// Generate unique referral code for user
const referralCode = `SHORE-${userId.slice(0, 8).toUpperCase()}`;

// /api/referrals/apply-code
// When new user signs up with code:
// 1. Award 25 credits to new user
// 2. Award 25 credits to referrer
```

#### 2.4 User Analytics Dashboard
- **Posts generated:** Chart by week/month
- **Most used post types:** Pie chart
- **Credit spending:** Bar chart (text vs images vs discoveries)
- **Engagement preview:** Click to copy post, track shares (future)

---

### Phase 3: Collaboration & Agency Tools (Q4 2026)

**Goals:**
- Multi-user businesses
- Team collaboration
- Agency/white-label plans

**Features to Add:**

#### 3.1 Team Members
- Invite collaborators to business profile
- Role-based permissions (Admin, Editor, Viewer)
- Activity log (who generated what, when)

**Schema Changes:**
```sql
CREATE TABLE business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id TEXT REFERENCES profiles(id),
  role TEXT CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by TEXT REFERENCES profiles(id),
  joined_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 Content Calendar
- Schedule posts for future dates
- Visual calendar view (drag-and-drop)
- Auto-post to social platforms (via Zapier/Make)

**Schema Changes:**
```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id),
  scheduled_for TIMESTAMP NOT NULL,
  status TEXT CHECK (status IN ('pending', 'posted', 'failed')),
  platform TEXT,  -- 'facebook', 'instagram', 'linkedin'
  posted_at TIMESTAMP
);
```

#### 3.3 Agency Dashboard (Tier 3)
- Manage multiple client businesses from one account
- Client-specific credit pools
- Usage reports per client
- White-label option (custom domain, remove Shoreline branding)

---

### Phase 4: Advanced AI & Automation (Q1 2027)

**Goals:**
- Smarter content suggestions
- Performance analytics (actual social media engagement)
- Auto-generation schedules

**Features to Add:**

#### 4.1 AI Content Suggestions
```typescript
// "It's been 5 days since your last post. Generate a new one?"
// Suggest post types based on:
// - Time of year (seasonal)
// - Past performance (which types got saved most often)
// - Business events (new product launch, promotion)
```

#### 4.2 Social Media Integration (Read)
- Connect Facebook/Instagram accounts (OAuth)
- Fetch engagement data (likes, comments, shares)
- Show which posts performed best
- Learn from high-performers to improve generation

**Flow:**
```
1. User connects Instagram
2. Shoreline fetches last 20 posts + engagement metrics
3. Identify top 5 posts by engagement
4. Feed back into AI: "These topics/styles resonated most"
5. Future generations prioritize similar patterns
```

#### 4.3 Performance Dashboard
- **Engagement Rate:** Average likes/comments per post
- **Best Time to Post:** When your audience is most active
- **Top Performing Content Types:** Which cognitive lenses got most engagement
- **Follower Growth:** Track over time

---

### Phase 5: Platform Expansion (Q2-Q3 2027)

**Goals:**
- Support more content types (videos, carousels)
- Localization (multi-language)
- Mobile app

**Features to Add:**

#### 5.1 Video Content Generation
- AI-generated short-form video scripts (15-60 seconds)
- Text-to-video using services like Runway, Synthesia
- Video editing suggestions (cuts, captions)

#### 5.2 Multi-Language Support
- Generate posts in user's preferred language
- Translate posts on-the-fly
- Localized brand discovery (research in local language)

**Implementation:**
```typescript
// Add language field to businesses table
// Modify prompt builder to include language instruction
const languageInstruction = `
Write this post in ${business.language}.
Use local idioms and cultural references appropriate for ${business.country}.
`;
```

#### 5.3 Mobile App (React Native)
- iOS + Android apps
- Push notifications for scheduled post reminders
- Quick generation on-the-go
- Camera integration (take business photo, instant discovery)

---

## Third-Party API Integration

### Current Integrations

#### 1. Anthropic Claude API

**Purpose:** Content generation

**Documentation:** https://docs.anthropic.com/

**Models Used:**
- `claude-haiku-4-5-20251001` (via OpenRouter)

**Rate Limits:**
- Haiku: 50 requests/minute (generous for our use case)

**Cost:**
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens
- Average post: ~$0.0005

**Error Handling:**
```typescript
try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4.5:beta',
      messages: [
        { role: 'system', content: 'Output only what is requested.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
} catch (error) {
  console.error('Claude API failed:', error);
  return { error: 'Content generation failed. Please try again.' };
}
```

**Fallback Strategy:**
- Primary: OpenRouter (Claude Haiku)
- Fallback 1: Direct Anthropic API (if OpenRouter down)
- Fallback 2: Groq (Llama 3.1) - faster but lower quality

---

#### 2. Google Gemini API

**Purpose:** Vision analysis, web search, image generation

**Documentation:** https://ai.google.dev/docs

**Models Used:**
- `gemini-2.5-flash` - Vision analysis + web search
- `imagen-3.0-generate-001` - Image generation

**Rate Limits:**
- Gemini Flash: 15 requests/minute (free tier)
- Imagen 3: 10 requests/minute

**Cost:**
- Gemini Flash: Free (within limits)
- Imagen 3: $0.04 per image

**Vision Analysis Example:**
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Analyze storefront photo
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent([
  {
    inlineData: {
      data: base64ImageData,
      mimeType: "image/jpeg"
    }
  },
  { text: "Extract color palette, architectural style, and signage details from this storefront." }
]);

const analysis = result.response.text();
```

**Web Search Example:**
```typescript
// Claude Haiku with web search tool (via OpenRouter)
const model = genAI.getGenerativeModel(
  { 
    model: "gemini-2.5-flash",
    tools: [{ webSearch: {} }]  // Enable web search
  },
  { apiVersion: "v1beta" }
);

const result = await model.generateContent([
  { text: `Research "${businessName}" at "${fullAddress}". Find craft identity, products, and neighborhood context.` }
]);
```

**Image Generation Example:**
```typescript
const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

const result = await model.generateImages({
  prompt: visualDescription,  // From Architect
  numberOfImages: 1,
  aspectRatio: "1:1",  // Square format
  safetySettings: {
    // Default: block harmful content
  },
  personGeneration: "allowed"  // Show people working
});

const base64Image = result.images[0].image.data;
```

---

#### 3. Groq API

**Purpose:** Fast prompt optimization (alternative to Gemini)

**Documentation:** https://console.groq.com/docs

**Models Used:**
- `llama-3.1-8b-instant` - Fastest, good for simple tasks
- `llama-3.1-70b-versatile` - Better quality, still fast

**Rate Limits:**
- Very generous (1000+ requests/minute)

**Cost:**
- Extremely cheap (~$0.0001 per request)

**Usage (as Architect):**
```typescript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const completion = await groq.chat.completions.create({
  messages: [
    { role: "system", content: "You are a brand photographer..." },
    { role: "user", content: architectPrompt }
  ],
  model: "llama-3.1-8b-instant",
  temperature: 0.7,
  max_tokens: 1000
});

const visualDescription = completion.choices[0].message.content;
```

**Pros:**
- ⚡ Extremely fast (200-500ms response time)
- 💰 Very cheap
- 🔄 High rate limits

**Cons:**
- 🎯 Lower quality than Claude/Gemini (but still good)
- 🧠 Less creative (more mechanical)

**When to Use:**
- Architect role (simple, structured task)
- High-volume scenarios (batching many requests)
- Cost-sensitive operations

---

#### 4. OpenRouter

**Purpose:** Unified API for multiple LLM providers

**Documentation:** https://openrouter.ai/docs

**Why Use OpenRouter:**
- ✅ Single API for Claude, GPT-4, Llama, etc.
- ✅ Built-in fallbacks (if one provider down, try another)
- ✅ Transparent pricing
- ✅ No rate limit headaches (they handle it)

**Cost:**
- Claude Haiku: $0.25 / $1.25 per 1M tokens (in/out)
- GPT-4o-mini: $0.15 / $0.60 per 1M tokens
- Llama 3.1 70B: $0.52 / $0.75 per 1M tokens

**Usage:**
```typescript
// OpenRouter uses OpenAI SDK format
import Groq from "groq-sdk";  // Works for OpenRouter too!

const client = new Groq({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

const response = await client.chat.completions.create({
  model: "anthropic/claude-haiku-4.5:beta",
  messages: [{ role: "user", content: prompt }]
});
```

**Model Selection Strategy:**
```typescript
// Primary: Claude Haiku (best quality/price)
let model = "anthropic/claude-haiku-4.5:beta";

// Fallback 1: GPT-4o-mini (if Claude unavailable)
if (claudeDown) {
  model = "openai/gpt-4o-mini";
}

// Fallback 2: Llama 3.1 70B (if OpenAI down)
if (openAIDown) {
  model = "meta-llama/llama-3.1-70b-instruct";
}
```

---

#### 5. Clerk (Authentication)

**Purpose:** User authentication and management

**Documentation:** https://clerk.com/docs

**Features Used:**
- Email/password auth
- Social OAuth (Google, Facebook) - future
- JWT generation for Supabase
- Webhooks (user.created)

**Supabase JWT Integration:**
```typescript
// In middleware.ts or API route
import { auth } from '@clerk/nextjs/server';

const { userId, getToken } = await auth();

// Get Supabase-compatible JWT
const supabaseToken = await getToken({ template: 'supabase-prod' });

// Use with Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseToken}`
      }
    }
  }
);
```

**Webhook Setup:**
```typescript
// /api/webhooks/clerk
import { Webhook } from 'svix';

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  
  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  
  try {
    const event = webhook.verify(payload, headers);
    
    if (event.type === 'user.created') {
      const { id, email_addresses } = event.data;
      
      // Create profile in Supabase
      await supabase.rpc('handle_new_user', {
        p_user_id: id,
        p_email: email_addresses[0].email_address
      });
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response('Unauthorized', { status: 401 });
  }
}
```

---

#### 6. Supabase (Database & Storage)

**Purpose:** PostgreSQL database, file storage, real-time subscriptions

**Documentation:** https://supabase.com/docs

**Features Used:**
- PostgreSQL database
- Row Level Security (RLS)
- Storage buckets (for uploaded photos, generated images)
- Functions (RPCs)
- Realtime (future: live collaboration)

**Storage Buckets:**

```typescript
// Upload photo to Supabase Storage
const file = photoFile;  // File from <input type="file" />

const { data, error } = await supabase.storage
  .from('business-photos')
  .upload(`${businessId}/${Date.now()}_${file.name}`, file, {
    cacheControl: '3600',
    upsert: false
  });

if (error) throw error;

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('business-photos')
  .getPublicUrl(data.path);

return publicUrl;
```

**RLS Policies Example:**
```sql
-- Only users can read their own businesses
CREATE POLICY "Users can read own businesses"
ON businesses FOR SELECT
USING (auth.uid() = user_id);

-- Only users can update their own businesses
CREATE POLICY "Users can update own businesses"
ON businesses FOR UPDATE
USING (auth.uid() = user_id);
```

---

### API Keys Security

**Storage:**
- All API keys stored in `.env.local` (development)
- Production keys stored in Vercel Environment Variables

**Never Expose Client-Side:**
```typescript
// ❌ BAD: API key in client component
'use client';
const apiKey = process.env.ANTHROPIC_API_KEY;  // undefined!

// ✅ GOOD: API key in server route
// /api/generate/route.ts
const apiKey = process.env.ANTHROPIC_API_KEY;  // works!
```

**Rotation Policy:**
- Rotate API keys quarterly
- Immediately rotate if suspected leak
- Use Vercel's secret management for production

---

### Future API Integrations (Planned)

#### Stripe (Payment Processing)
- Credit card payments
- Subscription management
- Webhook handling (payment.succeeded)

#### Social Media APIs
- **Facebook Graph API** - Post scheduling, engagement data
- **Instagram Basic Display API** - Fetch posts, likes, comments
- **LinkedIn API** - Professional post scheduling
- **Twitter API** - Tweet scheduling (if affordable)

#### Marketing & Analytics
- **PostHog** - Product analytics, feature flags
- **Segment** - Customer data platform
- **Mailchimp** - Email marketing, user onboarding sequences

#### Image & Media
- **Unsplash API** - Stock photos for inspiration
- **Pexels API** - Alternative stock photos
- **Cloudinary** - Image optimization, transformations (alternative to Supabase Storage)

---

## Appendices

### Glossary

**Cognitive Lens:** A pattern-recognition framework that guides content generation (e.g., Latent Point, Tradeoff Lock)

**Mode Template:** A structured prompt defining tone, structure, and constraints for a post type (e.g., EDUCATION, OBSERVATION)

**Architect:** The AI component that translates a text post into a photorealistic image prompt

**Brand Discovery:** The process of extracting visual and semantic brand identity from photos and web research

**RLS (Row Level Security):** Supabase's database-level access control system

**Clerk:** Third-party authentication service (handles user login/signup)

**Supabase RPC:** Remote Procedure Call (server-side function in PostgreSQL)

**Tier:** User subscription level (Tier 1 = Free, Tier 2 = Premium)

**Credit:** Unit of currency for using AI services (1 credit ≈ $0.10)

---

### File Structure Overview

```
shoreline-studio/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Main content studio
│   ├── profile/
│   │   └── page.tsx              # Business setup & brand discovery
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # Text content generation
│   │   ├── generate-image/
│   │   │   └── route.ts          # Image generation (Gemini Imagen)
│   │   ├── prepare-image-prompt/
│   │   │   └── route.ts          # Architect (prompt optimizer)
│   │   ├── discover-brand/
│   │   │   └── route.ts          # Brand discovery (vision + research)
│   │   ├── user/
│   │   │   └── claim-welcome-credits/
│   │   │       └── route.ts      # Award welcome bonus
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts      # Handle Clerk user.created
│   └── layout.tsx
├── components/
│   ├── SiteHeader.tsx            # Top navigation bar
│   ├── GenerateDashboard.tsx    # Content generation UI
│   ├── PostActions.tsx           # Save/copy/delete buttons
│   └── SavedImage.tsx            # Image display component
├── lib/
│   ├── brandDiscovery.ts         # Brand discovery logic (vision + research)
│   ├── mode-templates.ts         # 6 post mode templates
│   ├── cognitive-lenses.ts       # 4 lenses × 5 variants each
│   ├── angle-selector.ts         # Lens selection logic (avoid repetition)
│   ├── prompt-builder.ts         # Fills mode template placeholders
│   ├── supabase.ts               # Supabase client creation
│   └── constants.ts              # Voice options, categories, niches
├── migrations/
│   ├── 001_tier_system.sql       # Add tier, credits, free_discovery_used
│   ├── 002_rpc_functions.sql     # save_post_and_deduct, etc.
│   └── ...
├── .env.local                    # Environment variables (dev)
├── middleware.ts                 # Clerk authentication middleware
├── next.config.js
├── package.json
└── tsconfig.json
```

---

### Key Metrics to Track

**Product Metrics:**
- **DAU/MAU:** Daily/Monthly Active Users
- **Posts Generated per User:** Average posts created
- **Credit Consumption Rate:** Average credits spent per user per month
- **Feature Usage:** Which post types are most popular? Which lenses?
- **Retention:** % of users who return after 7/30 days

**Business Metrics:**
- **MRR (Monthly Recurring Revenue):** From Tier 2 subscriptions
- **ARPU (Average Revenue Per User):** Total revenue / # users
- **CAC (Customer Acquisition Cost):** Marketing spend / new users
- **LTV (Lifetime Value):** Average revenue per user over their lifetime
- **Churn Rate:** % of users who stop using per month

**Technical Metrics:**
- **API Latency:** Time to generate post (target: <5 seconds)
- **Error Rate:** % of failed generations
- **Cost per Generation:** AI API costs / # posts generated
- **Uptime:** % of time service is available (target: 99.9%)

---

### Testing Checklist

**Pre-Launch Testing:**

- [ ] **Authentication**
  - [ ] User can sign up with email/password
  - [ ] User can log in
  - [ ] User can log out
  - [ ] Webhook creates profile in Supabase

- [ ] **Profile Setup**
  - [ ] User can create first business (Tier 1)
  - [ ] User can upload photos
  - [ ] Brand discovery runs (vision + research)
  - [ ] Brand identity saved correctly
  - [ ] User redirected to dashboard

- [ ] **Content Generation**
  - [ ] All 6 post types generate correctly
  - [ ] All 4 lenses appear over time
  - [ ] Posts are business-specific (not generic)
  - [ ] Voice selection affects tone
  - [ ] Posts are ~150-200 words

- [ ] **Image Generation**
  - [ ] Architect writes good prompts
  - [ ] Images match business aesthetic
  - [ ] Images are 1024x1024
  - [ ] Images saved to Supabase Storage

- [ ] **Credit System**
  - [ ] Text post costs 2 credits
  - [ ] Image costs 3 credits
  - [ ] Insufficient credits blocks save
  - [ ] Credits displayed correctly in UI

- [ ] **Tier System**
  - [ ] Tier 1 users limited to 1 business
  - [ ] Tier 1 users charged for discovery (after first)
  - [ ] Tier 2 users can create multiple businesses
  - [ ] Tier 2 users have free discovery

- [ ] **Edge Cases**
  - [ ] User has 0 credits (can't generate)
  - [ ] User deletes post (it's removed)
  - [ ] User uploads 0 photos (text-only discovery)
  - [ ] User changes business name (can re-discover)

---

### Contribution Guidelines (Future)

**For developers joining the project:**

1. **Read this document** thoroughly
2. **Set up local environment:**
   ```bash
   git clone https://github.com/yourusername/shoreline-studio.git
   cd shoreline-studio
   npm install
   cp .env.example .env.local
   # Fill in API keys
   npm run dev
   ```

3. **Follow branch naming conventions:**
   - Feature: `feature/short-description`
   - Bug fix: `fix/short-description`
   - Hotfix: `hotfix/short-description`

4. **Commit message format:**
   ```
   [Type] Brief description (50 chars max)
   
   Detailed explanation if needed.
   
   - Bullet points for changes
   - Reference issue numbers: Fixes #123
   ```
   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

5. **Before submitting PR:**
   - [ ] Code runs without errors
   - [ ] New features tested manually
   - [ ] No API keys in code
   - [ ] TypeScript types are correct
   - [ ] Console.logs removed (or made conditional)

---

## Support & Contact

**Developer Support:**
- **Email:** dev@shorelinestudio.ca
- **GitHub Issues:** (TBD)
- **Slack:** (TBD - for team communication)

**Documentation Updates:**
- This document is a living reference
- Update whenever architecture changes
- Last updated: May 13, 2026

---

**End of Developer Reference Guide**
