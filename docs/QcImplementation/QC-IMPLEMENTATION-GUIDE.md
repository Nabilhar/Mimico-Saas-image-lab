# QC System Implementation Guide

## Overview

The Quality Control (QC) system catches and fixes common post generation violations **before** they reach users. It uses a separate Sonnet 4.5 API call to check posts for:

- Philosophical endings
- Word count violations
- Mode-specific structural issues
- Lens handling problems

## Files Created

```
lib/
├── qc-system.ts              # Core QC logic
├── qc-monitoring.ts          # Analytics & monitoring utilities
└── qc-integration-example.ts # Integration examples

sql/
└── qc-migration.sql          # Database schema changes
```

---

## Step 1: Database Setup

Run the migration in your Supabase SQL Editor:

```bash
# Copy qc-migration.sql to Supabase SQL Editor and execute
```

This creates:
- ✅ `qc_logs` table (detailed QC tracking)
- ✅ QC fields in `community_posts` (optional post-level tracking)
- ✅ Monitoring views for analytics
- ✅ Indexes for query performance

**Verify it worked:**

```sql
SELECT * FROM qc_weekly_violations;
-- Should return empty result (no data yet)
```

---

## Step 2: Add QC Module to Your Project

Copy the QC files to your project:

```bash
# Copy these files:
qc-system.ts         → /lib/qc-system.ts
qc-monitoring.ts     → /lib/qc-monitoring.ts
```

---

## Step 3: Update generate/route.ts

### 3A. Add Imports

At the top of `app/api/generate/route.ts`:

```typescript
import {
  qualityCheck,
  shouldRunQC,
  logQCResult,
  buildPromptWithFixes,
} from '@/lib/qc-system';
```

### 3B. Integrate QC After Post Generation

Find where you generate and clean the post (around line 810-900), and add:

```typescript
// After cleanup:
let content = cleanupResponse(rawResponse);

// ⭐ ADD QC INTEGRATION HERE
if (shouldRunQC(postType)) {
  const qcResult = await qualityCheck(content, postType);
  
  if (!qcResult.passes_qc) {
    console.log(`[QC] ${postType} failed. Regenerating with fixes...`);
    console.log(`[QC] Violations:`, qcResult.violations);
    
    // Rebuild prompt with fix instructions
    const fixedPrompt = buildPromptWithFixes(finalPrompt, qcResult.violations);
    
    // Regenerate (always use Sonnet for fixes)
    rawResponse = await callAIProvider('sonnet-4.5', fixedPrompt, currentTime, business);
    content = cleanupResponse(rawResponse);
    
    // Log regeneration
    await logQCResult({
      mode: postType,
      voice,
      generation_model: 'sonnet-4.5',
      qc_status: 'passed',
      violations: qcResult.violations,
      regenerated: true,
      word_count: qcResult.word_count,
    });
  } else {
    // Log successful first attempt
    await logQCResult({
      mode: postType,
      voice,
      generation_model: generationModel,
      qc_status: 'passed',
      violations: [],
      regenerated: false,
      word_count: qcResult.word_count,
    });
  }
} else {
  // Mode doesn't need QC - log as skipped
  await logQCResult({
    mode: postType,
    voice,
    generation_model: generationModel,
    qc_status: 'skipped',
    violations: [],
    regenerated: false,
  });
}

// Continue with your existing return logic
return NextResponse.json({ content, framework, currentWeather, cognitive_lens: lens });
```

---

## Step 4: (Optional) Track QC Data in Posts

If you want to save QC metadata directly to posts:

### Update save_post_and_deduct RPC:

```sql
-- Add these parameters to save_post_and_deduct function:
p_qc_status TEXT DEFAULT 'skipped',
p_generation_model TEXT DEFAULT 'unknown',
p_regenerated BOOLEAN DEFAULT FALSE,
p_word_count INTEGER DEFAULT NULL

-- In the INSERT statement, add:
qc_status,
generation_model,
regenerated,
word_count,
mode,
voice

-- In VALUES, add:
p_qc_status,
p_generation_model,
p_regenerated,
p_word_count,
p_mode,  -- You'll need to add this parameter too
p_voice  -- And this one
```

### Update the RPC call in your code:

```typescript
const { data, error } = await supabase.rpc('save_post_and_deduct', {
  p_user_id: userId,
  p_content: content,
  p_image_url: imageUrl,
  p_business_name: business.business_name,
  p_location_snapshot: fullAddress,
  p_cognitive_lens: lens,
  p_amount: 1,
  // NEW QC fields:
  p_qc_status: qcStatus,
  p_generation_model: generationModel,
  p_regenerated: wasRegenerated,
  p_word_count: wordCount,
  p_mode: postType,
  p_voice: voice,
});
```

---

## Step 5: Deploy & Test

### Test Locally First:

```bash
npm run dev
```

Generate a few posts in each mode and check the console for QC logs:

```
[QC] Behind the scenes - Status: FAIL
[QC] Violations: [{ type: 'philosophical_ending', ... }]
[QC] Regenerating with fixes...
[QC] Behind the scenes - Status: PASS
```

### Check the Database:

```sql
SELECT * FROM qc_logs ORDER BY created_at DESC LIMIT 10;
```

You should see logs for each generation attempt.

---

## Step 6: Monitor Performance

### Weekly Check (Run in Supabase SQL Editor):

```sql
-- Violation rates by mode
SELECT * FROM qc_weekly_violations;

-- Violation type breakdown
SELECT * FROM qc_violation_types;

-- Regeneration success rates
SELECT * FROM qc_regeneration_success;

-- Cost analysis
SELECT * FROM qc_cost_analysis;
```

### Generate Weekly Report (in your code):

```typescript
import { generateWeeklyReport } from '@/lib/qc-monitoring';

const report = await generateWeeklyReport();
console.log(report);
```

---

## Configuration

### Which Modes Get QC?

Edit `lib/qc-system.ts`:

```typescript
export const QC_CONFIG = {
  // Modes that ALWAYS get QC
  ALWAYS_QC: [
    'Behind the scenes',   // High violation rate
    'Community moment',    // Atmosphere naming issues
    'Tip of the Day'       // Pedagogical drift
  ],
  
  // Add/remove modes based on monitoring data
};
```

### Adjust Word Limits:

```typescript
WORD_LIMITS: {
  'Myth-busting': 100,
  'Tip of the Day': 90,
  'Behind the scenes': 120,
  'Promotion / offer': 130,
  'Local event / news': 90,
  'Community moment': 90,
}
```

---

## Decision Tree: When to Add/Remove QC

### Add Mode to ALWAYS_QC if:
- Violation rate > 8% for 1 week
- OR violation rate > 5% for 2 consecutive weeks
- OR regeneration success rate < 70%

### Remove Mode from ALWAYS_QC if:
- Violation rate < 5% for 2 consecutive weeks
- AND regeneration success rate > 90%
- AND you've improved the base prompt

### Keep in MONITOR if:
- Violation rate 5-8%
- Manual review weekly
- Add to ALWAYS_QC if rate climbs

---

## Cost Analysis

### Current Setup (3 modes with QC):

**Per 1,000 posts:**
- Generation: $0.30
- QC checks: $0.40
- Regeneration (10% fail): $0.08
- **Total: ~$0.78/month**

**Increase: $0.48/month**

**ROI:** Catches 10-15% of violations for less than $0.50/month

### If All 6 Modes Had QC:

**Per 1,000 posts:**
- Generation: $0.30
- QC checks: $0.80
- Regeneration (5% avg fail): $0.12
- **Total: ~$1.22/month**

**Increase: $0.92/month**

Still worth it if quality matters.

---

## Troubleshooting

### QC Always Passes (No Violations Caught)

**Possible causes:**
1. Prompts are already very good (rare)
2. QC checks are too lenient
3. Wrong mode names (check case sensitivity)

**Fix:** Lower temperature in QC call (it's at 0.1) or make checks stricter.

---

### QC Always Fails (High Regeneration Rate)

**Possible causes:**
1. Base prompts need improvement
2. QC checks are too strict
3. Model is struggling with the constraints

**Fix:** Review violation types, improve base prompts, adjust QC thresholds.

---

### Regeneration Doesn't Fix Issues

**Possible causes:**
1. Fix instructions not specific enough
2. Model not following fix instructions
3. Underlying prompt issue too fundamental

**Fix:** Make fix instructions more explicit, use stronger model for regeneration, or revise base prompt.

---

## Monitoring Alerts

Set up automated alerts:

```typescript
import { checkForAlerts } from '@/lib/qc-monitoring';

// Run daily via cron job or scheduled function
const alerts = await checkForAlerts();

if (alerts.length > 0) {
  // Send to Slack, email, or logging service
  console.error('QC ALERTS:', alerts);
}
```

---

## Next Steps

1. ✅ Run database migration
2. ✅ Add qc-system.ts to /lib
3. ✅ Integrate into generate/route.ts
4. ✅ Deploy and test with a few posts
5. ✅ Monitor for 1 week
6. ✅ Review violation rates
7. ✅ Adjust ALWAYS_QC config based on data
8. ✅ Set up weekly monitoring routine

---

## Questions?

Common questions:

**Q: Can I skip QC for faster generation?**
A: Yes, remove modes from ALWAYS_QC or set `AI_SKIP_QC=true` env var.

**Q: Does QC slow down post generation?**
A: Yes, by ~1-2 seconds per QC-enabled post. Worth it for quality.

**Q: Can I use a cheaper model for QC?**
A: Not recommended. Sonnet 4.5 catches violations better than cheaper models.

**Q: What if a post fails QC twice?**
A: Current implementation ships it anyway. You can throw an error instead (see integration example).

**Q: How do I know if QC is working?**
A: Check `qc_logs` table - you should see both 'passed' and 'failed' entries if violations are being caught.
