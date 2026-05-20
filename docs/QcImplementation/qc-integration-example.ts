// EXAMPLE: How to integrate QC system into generate/route.ts
// This shows the key changes needed to add QC to your existing route

import {
  qualityCheck,
  shouldRunQC,
  logQCResult,
  buildPromptWithFixes,
  QC_CONFIG
} from '@/lib/qc-system';

// ============================================================================
// EXAMPLE 1: Basic QC Integration (Minimal Changes)
// ============================================================================

async function generatePostWithBasicQC(params: any) {
  const { mode, voice, /* ...other params */ } = params;
  
  // 1. Generate post normally
  const model = selectModel(mode);
  let post = await callAI(model, buildPrompt(params));
  
  // 2. Check if QC needed
  if (!shouldRunQC(mode)) {
    // Mode doesn't need QC - ship it
    await logQCResult({
      mode,
      voice,
      generation_model: model,
      qc_status: 'skipped',
      violations: [],
      regenerated: false,
    });
    return post;
  }
  
  // 3. Run QC
  const qcResult = await qualityCheck(post, mode);
  
  // 4. Handle result
  if (qcResult.passes_qc) {
    // Post passed QC - ship it
    await logQCResult({
      mode,
      voice,
      generation_model: model,
      qc_status: 'passed',
      violations: [],
      regenerated: false,
      word_count: qcResult.word_count,
    });
    return post;
  }
  
  // 5. Post failed QC - regenerate with fixes
  console.log(`[QC] ${mode} failed QC. Violations:`, qcResult.violations);
  
  const fixedPrompt = buildPromptWithFixes(buildPrompt(params), qcResult.violations);
  post = await callAI('sonnet-4.5', fixedPrompt); // Always use Sonnet for fixes
  
  await logQCResult({
    mode,
    voice,
    generation_model: 'sonnet-4.5',
    qc_status: 'passed', // Assume regeneration fixed it
    violations: qcResult.violations,
    regenerated: true,
    word_count: post.split(/\s+/).length,
  });
  
  return post;
}

// ============================================================================
// EXAMPLE 2: Full QC Integration (With Double-Check)
// ============================================================================

async function generatePostWithFullQC(params: any) {
  const { mode, voice, /* ...other params */ } = params;
  
  // 1. Select generation model
  const generationModel = mode === 'Myth-busting' || mode === 'Tip of the Day'
    ? 'haiku-4.5'
    : 'sonnet-4.5';
  
  // 2. Generate post
  let post = await callAI(generationModel, buildPrompt(params));
  let wasRegenerated = false;
  
  // 3. Check if QC needed
  if (!shouldRunQC(mode)) {
    await logQCResult({
      mode,
      voice,
      generation_model: generationModel,
      qc_status: 'skipped',
      violations: [],
      regenerated: false,
    });
    return post;
  }
  
  // 4. First QC check
  let qcResult = await qualityCheck(post, mode);
  
  // 5. If failed, regenerate once
  if (!qcResult.passes_qc) {
    console.log(`[QC] ${mode} failed QC. Attempting regeneration...`);
    console.log(`[QC] Violations:`, qcResult.violations);
    
    const fixedPrompt = buildPromptWithFixes(buildPrompt(params), qcResult.violations);
    post = await callAI('sonnet-4.5', fixedPrompt);
    wasRegenerated = true;
    
    // 6. Second QC check (optional but recommended)
    const secondQC = await qualityCheck(post, mode);
    
    if (!secondQC.passes_qc) {
      console.error(`[QC] ${mode} FAILED QC TWICE!`);
      console.error(`[QC] Second attempt violations:`, secondQC.violations);
      
      // Log the failure
      await logQCResult({
        mode,
        voice,
        generation_model: 'sonnet-4.5',
        qc_status: 'failed',
        violations: secondQC.violations,
        regenerated: true,
        word_count: secondQC.word_count,
      });
      
      // Decision: ship it anyway or throw error?
      // Option A: Ship with warning
      console.warn(`[QC] Shipping post despite QC failure`);
      return post;
      
      // Option B: Throw error and fail generation
      // throw new Error(`Post failed QC twice for mode ${mode}`);
    }
    
    // Second QC passed
    qcResult = secondQC;
  }
  
  // 7. Log successful QC
  await logQCResult({
    mode,
    voice,
    generation_model: wasRegenerated ? 'sonnet-4.5' : generationModel,
    qc_status: 'passed',
    violations: wasRegenerated ? qcResult.violations : [],
    regenerated: wasRegenerated,
    word_count: qcResult.word_count,
  });
  
  return post;
}

// ============================================================================
// EXAMPLE 3: Minimal Integration Points in Your Existing Route
// ============================================================================

// In your existing generate/route.ts POST handler:

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      voice,
      postType = "Tip of the Day",
      // ... other params
    } = body;
    
    // ... existing business lookup, framework selection, etc.
    
    // BUILD PROMPT (your existing code)
    const finalPrompt = buildModePrompt({
      // ... all your existing params
    });
    
    // GENERATE POST (your existing code with QC integration)
    let rawResponse = "";
    const generationModel = postType === 'Myth-busting' || postType === 'Tip of the Day'
      ? 'haiku-4.5'
      : 'sonnet-4.5';
    
    rawResponse = await callAIProvider(generationModel, finalPrompt, currentTime, business);
    
    // CLEANUP (your existing code)
    let content = cleanupResponse(rawResponse);
    
    // ⭐ NEW: QC INTEGRATION POINT
    if (shouldRunQC(postType)) {
      const qcResult = await qualityCheck(content, postType);
      
      if (!qcResult.passes_qc) {
        console.log(`[QC] Regenerating ${postType} due to violations:`, qcResult.violations);
        
        const fixedPrompt = buildPromptWithFixes(finalPrompt, qcResult.violations);
        rawResponse = await callAIProvider('sonnet-4.5', fixedPrompt, currentTime, business);
        content = cleanupResponse(rawResponse);
        
        await logQCResult({
          mode: postType,
          voice,
          generation_model: 'sonnet-4.5',
          qc_status: 'passed',
          violations: qcResult.violations,
          regenerated: true,
        });
      } else {
        await logQCResult({
          mode: postType,
          voice,
          generation_model: generationModel,
          qc_status: 'passed',
          violations: [],
          regenerated: false,
        });
      }
    } else {
      await logQCResult({
        mode: postType,
        voice,
        generation_model: generationModel,
        qc_status: 'skipped',
        violations: [],
        regenerated: false,
      });
    }
    
    // RETURN (your existing code)
    return NextResponse.json({ content, framework, currentWeather, cognitive_lens: lens });
    
  } catch (error: any) {
    // ... your existing error handling
  }
}

// ============================================================================
// HELPER: Select model based on mode
// ============================================================================

function selectModel(mode: string): string {
  // Haiku for simpler modes (cheaper, faster)
  if (mode === 'Myth-busting' || mode === 'Tip of the Day') {
    return 'haiku-4.5';
  }
  
  // Sonnet for complex modes (better quality)
  return 'sonnet-4.5';
}

// ============================================================================
// SUMMARY: What You Need to Add
// ============================================================================

/*
1. Import the QC functions at the top of generate/route.ts:
   import {
     qualityCheck,
     shouldRunQC,
     logQCResult,
     buildPromptWithFixes
   } from '@/lib/qc-system';

2. After generating and cleaning the post, add:
   - Check if QC needed with shouldRunQC(postType)
   - If needed, call qualityCheck(content, postType)
   - If failed, regenerate with buildPromptWithFixes()
   - Always log results with logQCResult()

3. Optionally, save QC data to the post record:
   - Update save_post_and_deduct RPC to accept qc_status, generation_model, etc.
   - OR update community_posts directly after saving

That's it! The QC system is modular - you can add it with minimal changes
to your existing code.
*/
