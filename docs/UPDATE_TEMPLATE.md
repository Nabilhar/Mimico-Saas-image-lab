# Documentation Update Template

Use this template when reporting changes that need documentation updates.

---

## Quick Report (Recommended)

**Just tell me naturally what changed:**

```
"I added [feature]. Users can now [action]. 
New [route/table/component] at [location]."
```

**Example:**
```
"I added Stripe payment integration. Users can now purchase credit 
packages from the dashboard. New API route at /api/payments/checkout 
and new table called payment_transactions."
```

---

## Detailed Report (Optional)

**For complex changes, use this format:**

### Change Type: [FEATURE / UPDATE / FIX / REMOVAL]

**What Changed:**
- [Brief description]

**Location:**
- Files: [list files modified]
- Components: [list components affected]
- Routes: [new or modified API routes]

**User Impact:**
- What users will see/experience differently
- New capabilities or changed workflows

**Technical Details:**
- Database changes (tables, columns, RPCs)
- Environment variables added/changed
- Third-party services integrated
- Code examples that should be updated

**Why:**
- Reason for the change
- Problem it solves

---

## Example: New Feature

### Change Type: FEATURE

**What Changed:**
- Added content scheduling feature

**Location:**
- Files: `app/dashboard/page.tsx`, `components/ScheduleModal.tsx`
- API Route: `/api/posts/schedule` (POST)
- Database: New table `scheduled_posts`

**User Impact:**
- Users can now schedule posts for future dates
- Visual calendar interface added to dashboard
- Posts can be scheduled up to 30 days in advance

**Technical Details:**
- Database: Added `scheduled_posts` table with columns:
  - id (UUID)
  - post_id (FK to community_posts)
  - scheduled_for (TIMESTAMP)
  - status (TEXT: pending/posted/failed)
  - platform (TEXT: facebook/instagram/linkedin)
  - posted_at (TIMESTAMP)
- New RPC: `schedule_post(user_id, post_id, scheduled_for, platform)`
- Integrated with cron job for scheduled posting

**Why:**
- Users requested ability to plan content ahead
- Improves consistency of posting schedule

---

## Example: Update

### Change Type: UPDATE

**What Changed:**
- Updated credit costs for all operations

**User Impact:**
- Text posts: 2 credits → 1 credit
- Images: 3 credits → 2 credits  
- Brand discovery: 3 credits → 2 credits

**Why:**
- AI API costs decreased significantly
- Passing savings to users
- Encourages more usage

---

## Example: Fix

### Change Type: FIX

**What Changed:**
- Fixed brand discovery not saving storefront_architecture

**Location:**
- File: `lib/brandDiscovery.ts`
- Function: `saveDiscoveryData()`

**User Impact:**
- Images will now correctly match business aesthetic
- Architect receives accurate architectural data

**Technical Details:**
- Bug: `storefront_architecture` was being saved as string instead of JSONB
- Fix: Changed to proper JSONB serialization before save

**Why:**
- Users reported images didn't match their storefront style
- Architect wasn't receiving structured architectural data

---

## Example: Removal

### Change Type: REMOVAL

**What Changed:**
- Removed "Gemini" option from Architect modes

**Location:**
- File: `app/api/prepare-image-prompt/route.ts`
- Constant: `ARCHITECT_MODE`

**User Impact:**
- None (was internal configuration)
- Image generation continues working with other modes

**Technical Details:**
- Removed from mode type: `"GEMINI" | "GROQ" | "GEMMA" | "OPENROUTER"`
- Deleted Gemini client initialization
- Removed Gemini condition from if/else chain

**Why:**
- Gemini mode was too slow (8-12 seconds vs 2-4 seconds)
- Other modes produce equal or better quality
- Simplifies codebase

---

## Common Scenarios Quick Reference

**New API Route:**
```
"Added POST /api/[route]. It [what it does]. 
Accepts [params]. Returns [response]."
```

**Database Change:**
```
"Added [table/column] to [location]. It stores [what]. 
Type: [datatype]."
```

**UI Change:**
```
"Updated [component]. Users can now [action]. 
Located at [path]."
```

**Config Change:**
```
"Added environment variable [NAME]. Required for [purpose]. 
Value should be [type]."
```

**Third-Party Integration:**
```
"Integrated [service] for [purpose]. New API key required: [KEY_NAME]. 
Used in [where]."
```

**Pricing Change:**
```
"Changed [item] cost from [old] to [new]. Reason: [why]."
```

**Feature Deprecation:**
```
"Removed [feature]. Reason: [why]. Replacement: [if any]."
```

---

## What Gets Documented

### ✅ Always Document:
- New user-facing features
- API route changes (new/modified/removed)
- Database schema changes
- Pricing/credit cost changes
- Environment variable changes
- Third-party integrations
- Feature removals
- Major bug fixes that change behavior

### ⚠️ Consider Documenting:
- Internal refactoring (if changes examples)
- Performance improvements (if user-visible)
- UI text changes (if significant)
- Workflow changes (if affects user experience)

### ❌ Skip Documenting:
- Code formatting changes
- Comment updates
- Test file changes
- Dev-only environment changes
- Internal variable renames (unless in examples)

---

## Documentation Sections Likely Affected

**When you add a feature, I typically update:**
- Developer Reference → Core Features section
- Developer Reference → API Routes section (if applicable)
- Developer Reference → Database Schema (if applicable)
- Developer Reference → Roadmap (move from planned to implemented)
- User Experience Guide → Relevant feature section
- User Experience Guide → FAQ (add common questions)
- Changelog → New entry

**When you change pricing, I update:**
- Developer Reference → Pricing & Business Model
- User Experience Guide → Understanding Credits
- User Experience Guide → FAQ
- Changelog → New entry

**When you fix a bug, I update:**
- Developer Reference → Troubleshooting section
- User Experience Guide → Troubleshooting section (if user-visible)
- Changelog → New entry

---

## How Long Updates Take

**Simple changes (1-2 sections):** ~2 minutes
- Example: "Changed credit cost from 2 to 1"

**Medium changes (3-5 sections):** ~5 minutes  
- Example: "Added new voice option"

**Complex changes (6+ sections):** ~10 minutes
- Example: "Added Stripe payment integration"

**Major features (requires new sections):** ~15 minutes
- Example: "Added content scheduling feature"

---

## Tips for Clear Reports

1. **Be specific about locations**
   - ✅ "Added to `app/api/generate/route.ts` line 45"
   - ❌ "Added to the generate file"

2. **Include the 'why'**
   - ✅ "Changed cost because API pricing decreased"
   - ❌ "Changed cost"

3. **Mention user impact**
   - ✅ "Users will see a new button in the dashboard"
   - ❌ "Updated the UI"

4. **List breaking changes**
   - ✅ "Old API route removed - users must update to new endpoint"
   - ❌ "Changed the API"

5. **Include migration steps if needed**
   - ✅ "Users need to re-run brand discovery after this update"
   - ❌ "Brand discovery changed"

---

## Testing the System

**Try this example to see how it works:**

```
"I just added a 'Batch Generation' feature. Users can now 
generate 5 posts at once. New button in the dashboard 
called 'Generate Batch'. New API route at /api/generate/batch 
that accepts an array of post types and returns an array of posts. 
Cost: 8 credits for 5 posts (1.6 credits each, discounted from 
the normal 2 credits per post)."
```

I'll show you exactly what gets updated and how! 🚀

---

*Ready to report your first change?*
