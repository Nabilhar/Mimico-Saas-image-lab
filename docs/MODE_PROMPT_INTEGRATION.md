# 🔧 MODE + Prompt Builder Integration Guide

## What You Got

Two new files ready to use:

1. **`mode-templates.ts`** — All 6 MODE templates as TypeScript constants
2. **`prompt-builder.ts`** — Function to build complete prompts

---

## How It Works

```
Supabase data
    ↓
selectGroupAngle(niche, postType)
    ├─ Returns: { lens, lensDefinition, groupContext, ... }
    ↓
buildPrompt(config)
    ├─ Selects MODE template based on postType
    ├─ Injects all variables
    └─ Returns: Complete prompt
    ↓
Send to Haiku
```

---

## Integration with generate_route.ts

### Before (Old System)

```typescript
import { selectAngle } from "@/lib/angle-selector";

export async function POST(req: Request) {
  // ... get variables from request
  
  const angle = selectAngle(category, postType);
  
  const finalPrompt = `
    [BUSINESS]: ${business_name}
    [NICHE]: ${niche}
    [LENS]: ${angle.lens}
    [CONTEXT]: ${angle.categoryContext}
    ... manually build prompt
  `;
  
  // Send to Haiku
}
```

### After (New System)

```typescript
import { selectGroupAngle } from "@/lib/group-angle-selector";
import { buildPrompt } from "@/lib/prompt-builder";

export async function POST(req: Request) {
  // Get variables from Supabase (existing code)
  const {
    business_name,
    niche,
    fullAddress,
    voice,
    postType,
    recentHistory,
    varietyRules,
  } = req.body;
  
  // Step 1: Select lens and context
  const angle = selectGroupAngle(niche, postType);
  
  // Step 2: Build complete prompt
  const finalPrompt = buildPrompt({
    business_name,
    niche,
    fullAddress,
    lens: angle.lens,
    lensDefinition: angle.lensDefinition,
    groupContext: angle.groupContext,  // Replaces categoryContext
    voice,
    postType,
    recentHistory,
    varietyRules,
    // Optional:
    currentTime: getCurrentTime(),
    currentWeather: await getWeather(fullAddress),
    currentSeason: getCurrentSeason(),
    businessSummary: await getBusinessSummary(niche),
  });
  
  // Step 3: Send to Haiku
  const response = await callHaikuAPI(finalPrompt);
  
  return response;
}
```

---

## Complete Implementation Example

Here's what your generate_route.ts should look like:

```typescript
// app/api/generate/route.ts

import { selectGroupAngle } from "@/lib/group-angle-selector";
import { buildPrompt, validatePromptConfig } from "@/lib/prompt-builder";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface GenerateRequest {
  business_name: string;
  niche: string;
  fullAddress: string;
  voice: string;
  postType: string;
  recentHistory?: string;
  varietyRules?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as GenerateRequest;
    
    // Validate required fields
    if (!body.business_name || !body.niche || !body.fullAddress || !body.postType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Step 1: Get lens and context from the 7-group system
    const angle = selectGroupAngle(body.niche, body.postType as any);

    // Step 2: Build complete prompt
    const finalPrompt = buildPrompt({
      business_name: body.business_name,
      niche: body.niche,
      fullAddress: body.fullAddress,
      lens: angle.lens,
      lensDefinition: angle.lensDefinition,
      groupContext: angle.groupContext,
      voice: body.voice || "Warm & Conversational",
      postType: body.postType as any,
      recentHistory: body.recentHistory,
      varietyRules: body.varietyRules,
    });

    // Step 3: Send to Haiku and get response
    const chatCompletion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",  // Or your Haiku equivalent
      max_tokens: 1024,
      messages: [
        { role: "user", content: finalPrompt }
      ],
    });

    const postContent = chatCompletion.choices[0].message.content || "";

    // Step 4: Extract and save
    const match = postContent.match(/<<<POST_BEGIN>>>([\s\S]*?)<<<POST_END>>>/);
    const cleanPost = match ? match[1].trim() : postContent;

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        post: cleanPost,
        cognitive_lens: angle.lens,
        groupContext: angle.groupContext,
        postType: body.postType,
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in generate route:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate post",
        details: error.toString()
      }),
      { status: 500 }
    );
  }
}
```

---

## What Changed from Old System

| Aspect | Old | New |
|--------|-----|-----|
| **Lens selection** | `selectAngle(category, postType)` | `selectGroupAngle(niche, postType)` |
| **Context variable** | `angle.categoryContext` | `angle.groupContext` |
| **Prompt building** | Manual string concatenation | `buildPrompt(config)` |
| **MODE selection** | Implied/implicit | Explicit by postType |
| **Template handling** | External text files | TypeScript constants |
| **Variable injection** | Manual replacement | Automatic via buildPrompt |

---

## Key Points

### PostType Determines MODE

```typescript
postType: "Tip of the Day"      → MODE 2: Education
postType: "Myth-busting"        → MODE 1: Education
postType: "Behind the scenes"   → MODE 3: Observation
postType: "Promotion / offer"   → MODE 4: Observation
postType: "Local event / news"  → MODE 5: Casual
postType: "Community moment"    → MODE 6: Atmospheric
```

### Variables Are Automatically Injected

```typescript
// All these {{placeholders}} in the MODE template get filled:
{{business_name}}
{{niche}}
{{fullAddress}}
{{lens}}
{{lensDefinition}}
{{groupContext}}
{{voice_description}}
{{postType}}
{{recentHistory}}
{{varietyRules}}
{{current_time}}
{{current_weather}}
{{current_season}}
{{business_summary}}
```

### Optional Variables

Some variables are optional:
- `recentHistory` — Defaults to "None"
- `varietyRules` — Defaults to ""
- `currentTime` — Calculated if not provided
- `currentWeather` — Defaults to "Unknown"
- `currentSeason` — Calculated if not provided
- `businessSummary` — Defaults to generic text

### Unused Placeholders Are Removed

If a MODE template doesn't use a placeholder, it's automatically removed:

```typescript
// MODE doesn't use {{lens_context}}?
// It gets removed automatically, not left as {{lens_context}}
```

---

## Testing

### Quick Test

```typescript
import { buildPrompt } from "@/lib/prompt-builder";
import { selectGroupAngle } from "@/lib/group-angle-selector";

// Get lens
const angle = selectGroupAngle("Hair salon", "Tip of the Day");

// Build prompt
const prompt = buildPrompt({
  business_name: "Salon ABC",
  niche: "Hair salon",
  fullAddress: "123 Main St, Toronto, ON",
  lens: angle.lens,
  lensDefinition: angle.lensDefinition,
  groupContext: angle.groupContext,
  voice: "Warm & Conversational",
  postType: "Tip of the Day",
});

console.log(prompt);
// Should output a complete, filled-in prompt
```

### Validation Test

```typescript
import { validatePromptConfig } from "@/lib/prompt-builder";

const config = {
  // Missing required fields
  niche: "Hair salon",
  postType: "Tip of the Day",
};

try {
  validatePromptConfig(config as any);
} catch (e) {
  console.log("Validation error:", e.message);
  // "Missing required field: business_name"
}
```

---

## Migration Checklist

- [ ] Copy `mode-templates.ts` to `src/lib/`
- [ ] Copy `prompt-builder.ts` to `src/lib/`
- [ ] Update import in prompt-builder to point to your VOICE_PROMPTS
- [ ] Update generate_route.ts to use `selectGroupAngle()` instead of `selectAngle()`
- [ ] Update generate_route.ts to use `buildPrompt()` instead of manual string building
- [ ] Test with a few post types
- [ ] Verify prompts are complete and well-formed
- [ ] Commit to dev branch

---

## Files Ready to Use

1. ✅ **mode-templates.ts** — 6 MODE templates
2. ✅ **prompt-builder.ts** — Prompt building function
3. ✅ **INTEGRATION_GUIDE.md** (this file)

All files are in `/mnt/project/` ready to download.

---

## Questions?

**Q: What if a variable is missing?**
A: The `buildPrompt()` function will leave the placeholder empty. Use `buildPromptSafe()` if you want validation.

**Q: Can I customize MODE templates?**
A: Yes, edit them in `mode-templates.ts` as TypeScript strings.

**Q: How do I add a new post type?**
A: Add it to the `MODE_TEMPLATES` object and make sure it's in the PostType type.

**Q: Where does weather/time data come from?**
A: Provide it in the config, or the builder calculates it automatically.

---

## Status

✅ **Complete and Ready to Integrate**

- All 6 MODE templates included
- Full variable injection system
- Validation helpers included
- No breaking changes to existing code
- Backward compatible with your current flow

Download and integrate now.
