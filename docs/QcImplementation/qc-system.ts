// lib/qc-system.ts
// Quality Control system for social media posts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// QC CONFIGURATION
// ============================================================================

export const QC_CONFIG = {
  // Modes that ALWAYS get QC (high violation rates)
  ALWAYS_QC: [
    'Behind the scenes',
    'Community moment',
    'Tip of the Day'
  ],
  
  // Modes we monitor but don't QC yet (medium violation rates)
  MONITOR: [
    'Myth-busting',
    'Promotion / offer'
  ],
  
  // Modes we skip QC (low violation rates)
  SKIP: [
    'Local event / news'
  ],
  
  // QC Model (always Sonnet 4.5 for quality control)
  QC_MODEL: 'anthropic/claude-sonnet-4.5',
  
  // Word count limits by mode
  WORD_LIMITS: {
    'Myth-busting': 100,
    'Tip of the Day': 90,
    'Behind the scenes': 120,
    'Promotion / offer': 130,
    'Local event / news': 90,
    'Community moment': 90,
  }
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QCViolation {
  type: 'philosophical_ending' | 'word_count' | 'mode_structure' | 'lens_named' | 'atmosphere_naming';
  severity: 'blocking' | 'warning';
  found: string;
  fix: string;
}

export interface QCResult {
  passes_qc: boolean;
  word_count: number;
  violations: QCViolation[];
  recommendation: 'ship' | 'regenerate';
}

export interface QCLog {
  post_id?: string;
  mode: string;
  voice: string;
  generation_model: string;
  qc_status: 'passed' | 'failed' | 'skipped';
  violations: QCViolation[];
  regenerated: boolean;
  word_count?: number;
}

// ============================================================================
// MODE-SPECIFIC CHECK PATTERNS
// ============================================================================

function getModeSpecificChecks(mode: string): string {
  const checks: Record<string, string> = {
    'Behind the scenes': `
- Does it end with operational detail, or meaning extraction?
- Does it avoid "This is what [concept] means in [domain]"?
- Does it stay present-tense throughout?
- Does it avoid "Every choice after this one..." type statements?
`,
    
    'Community moment': `
- Does it avoid naming atmosphere ("The space feels...", "There's something about...")?
- Does it end with sensory detail, not emotional summary?
- Does it avoid synthesis statements ("Everything is...", "Everything else is...")?
- Does it avoid "arranging themselves into..." or similar poetic language?
`,
    
    'Tip of the Day': `
- Does it end with the technique, not above it?
- Does it avoid "This is the key to..." or "Understanding this changes..."?
- Does the tip remain actionable without motivational overlay?
- Does it avoid "That's why..." or "This is what makes the difference"?
`,
    
    'Myth-busting': `
- Does it end with the correction, not significance?
- Does it avoid "That's the difference between X and Y"?
- Does it stay mechanical in explaining what actually happens?
- Does it avoid "Understanding this principle..." statements?
`,
    
    'Promotion / offer': `
- Does it state availability without explaining why it matters?
- Does it avoid philosophical bridges between observation and offer?
- Does the transition stay logistical, not philosophical?
- Does it avoid "That's the value of..." statements?
`,
    
    'Local event / news': `
- Does it mention the event without explaining its significance?
- Does it avoid "This is why community matters"?
- Does it stay casual and neighborly without preaching?
- Does it avoid building up to the event announcement?
`
  };
  
  return checks[mode] || 'No mode-specific checks defined.';
}

// ============================================================================
// QC PROMPT BUILDER
// ============================================================================

function buildQCPrompt(post: string, mode: string): string {
  const wordLimit = QC_CONFIG.WORD_LIMITS[mode as keyof typeof QC_CONFIG.WORD_LIMITS] || 100;
  
  return `You are a quality control system reviewing a social media post for structural violations.

[MODE]: ${mode}
[WORD COUNT LIMIT]: ${wordLimit} words (strict maximum)

[POST TO REVIEW]:
${post}

[CRITICAL VIOLATIONS TO CHECK]:

1. **Philosophical Ending** (BLOCKING)
   Does the post end with ANY of these patterns:
   - Universal truths ("This is what X really means")
   - Hidden insights ("That's the difference between...")
   - Philosophical observations ("Understanding this changes...")
   - Poetic summaries ("Everything becomes...", "Everything else is...")
   - "This is what really matters" statements
   - "Every choice after this one..." type statements
   
   Rule: The post must end INSIDE the moment/correction/technique, not ABOVE it.

2. **Word Count** (BLOCKING)
   Count every single word in the post.
   Maximum allowed: ${wordLimit} words
   
   Rule: If over limit by even 1 word, this is a BLOCKING violation.

3. **Mode-Specific Violations** (BLOCKING)
${getModeSpecificChecks(mode)}

4. **Lens Handling** (WARNING only)
   Is the cognitive lens named or explained explicitly?
   Rule: Lens should bias attention, not be the subject.

[OUTPUT FORMAT]:
Return ONLY valid JSON (no markdown, no code blocks):
{
  "passes_qc": true/false,
  "word_count": <actual count>,
  "violations": [
    {
      "type": "philosophical_ending" | "word_count" | "mode_structure" | "lens_named" | "atmosphere_naming",
      "severity": "blocking" | "warning",
      "found": "<exact text from post>",
      "fix": "<specific instruction for regeneration>"
    }
  ],
  "recommendation": "ship" | "regenerate"
}

CRITICAL RULES:
- Be strict. If ANY blocking violation exists, set passes_qc to false.
- Count words accurately. Do not estimate.
- Extract exact text for "found" field.
- Provide specific, actionable fix instructions.

Return JSON now:`;
}

// ============================================================================
// QC EXECUTION
// ============================================================================

export async function qualityCheck(
  post: string,
  mode: string
): Promise<QCResult> {
  
  const qcPrompt = buildQCPrompt(post, mode);
  
  try {
    // Call OpenRouter with Sonnet 4.5 for QC
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://shorlinestudio.ca",
        "X-Title": "Shoreline QC",
      },
      body: JSON.stringify({
        model: QC_CONFIG.QC_MODEL,
        messages: [
          { role: "system", content: "You are a strict quality control system. Return only valid JSON." },
          { role: "user", content: qcPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent, strict checking
        max_tokens: 1000,
      }),
    });
    
    const raw = await response.text();
    
    // Check for HTML error page
    if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
      throw new Error("OpenRouter API endpoint error");
    }
    
    const data = JSON.parse(raw);
    
    // Check for API errors
    if (data.error) {
      throw new Error(`OpenRouter API error: ${data.error.message}`);
    }
    
    const content = data.choices[0]?.message?.content || "";
    
    // Clean up any markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/```\n?/g, '');
    }
    
    // Parse the QC result
    const qcResult: QCResult = JSON.parse(cleanContent);
    
    console.log(`[QC] ${mode} - Status: ${qcResult.passes_qc ? 'PASS' : 'FAIL'}`);
    if (!qcResult.passes_qc) {
      console.log(`[QC] Violations:`, qcResult.violations);
    }
    
    return qcResult;
    
  } catch (error: any) {
    console.error('[QC] Quality check failed:', error.message);
    
    // Fail safe: if QC system fails, pass the post through
    // Better to ship a potentially flawed post than block generation entirely
    return {
      passes_qc: true,
      word_count: post.split(/\s+/).length,
      violations: [],
      recommendation: 'ship'
    };
  }
}

// ============================================================================
// QC DECISION LOGIC
// ============================================================================

export function shouldRunQC(mode: string): boolean {
  return QC_CONFIG.ALWAYS_QC.includes(mode);
}

// ============================================================================
// QC LOGGING
// ============================================================================

export async function logQCResult(log: QCLog): Promise<void> {
  try {
    // Option A: Log to separate qc_logs table (recommended)
    const { error } = await supabase
      .from('qc_logs')
      .insert({
        post_id: log.post_id,
        mode: log.mode,
        voice: log.voice,
        generation_model: log.generation_model,
        qc_status: log.qc_status,
        violations: log.violations,
        regenerated: log.regenerated,
        word_count: log.word_count,
      });
    
    if (error) {
      console.error('[QC] Failed to log QC result:', error.message);
    }
    
    // Option B: If you want to also update the post itself
    if (log.post_id) {
      await supabase
        .from('community_posts')
        .update({
          qc_status: log.qc_status,
          qc_violations: log.violations,
          generation_model: log.generation_model,
          regenerated: log.regenerated,
        })
        .eq('id', log.post_id);
    }
    
  } catch (error: any) {
    console.error('[QC] Logging error:', error.message);
    // Don't throw - logging failures shouldn't block post generation
  }
}

// ============================================================================
// REGENERATION WITH FIXES
// ============================================================================

export function buildPromptWithFixes(
  originalPrompt: string,
  violations: QCViolation[]
): string {
  // Extract blocking violations only
  const blockingViolations = violations.filter(v => v.severity === 'blocking');
  
  if (blockingViolations.length === 0) {
    return originalPrompt; // No fixes needed
  }
  
  // Build fix instructions
  const fixInstructions = blockingViolations.map((v, idx) => {
    return `${idx + 1}. ${v.type.toUpperCase()}: ${v.fix}`;
  }).join('\n');
  
  // Append fixes to the original prompt
  const fixesAddendum = `

[CRITICAL FIXES REQUIRED - PREVIOUS ATTEMPT HAD VIOLATIONS]:
${fixInstructions}

These are MANDATORY corrections. The previous post violated quality standards.
Generate a new post that fixes these specific issues while maintaining all other requirements.
`;
  
  return originalPrompt + fixesAddendum;
}

// ============================================================================
// MONITORING QUERIES
// ============================================================================

export const QC_MONITORING_QUERIES = {
  
  // Weekly violation rate by mode
  weeklyViolationRate: `
    SELECT 
      mode,
      COUNT(*) as total_posts,
      SUM(CASE WHEN qc_status = 'failed' THEN 1 ELSE 0 END) as violations,
      ROUND(100.0 * SUM(CASE WHEN qc_status = 'failed' THEN 1 ELSE 0 END) / COUNT(*), 2) as violation_rate_percent
    FROM qc_logs
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY mode
    ORDER BY violation_rate_percent DESC;
  `,
  
  // Violation types breakdown
  violationTypes: `
    SELECT 
      mode,
      jsonb_array_elements(violations)->>'type' as violation_type,
      COUNT(*) as occurrences
    FROM qc_logs
    WHERE qc_status = 'failed'
      AND created_at > NOW() - INTERVAL '7 days'
    GROUP BY mode, violation_type
    ORDER BY mode, occurrences DESC;
  `,
  
  // Regeneration success rate
  regenerationSuccess: `
    SELECT 
      mode,
      COUNT(*) as total_regenerations,
      SUM(CASE WHEN qc_status = 'passed' THEN 1 ELSE 0 END) as successful_fixes,
      ROUND(100.0 * SUM(CASE WHEN qc_status = 'passed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_percent
    FROM qc_logs
    WHERE regenerated = true
      AND created_at > NOW() - INTERVAL '7 days'
    GROUP BY mode
    ORDER BY success_rate_percent DESC;
  `,
  
  // Cost analysis
  costAnalysis: `
    SELECT 
      mode,
      COUNT(*) as total_posts,
      SUM(CASE WHEN qc_status != 'skipped' THEN 1 ELSE 0 END) as qc_runs,
      SUM(CASE WHEN regenerated THEN 2 ELSE 1 END) as total_api_calls,
      ROUND(SUM(CASE WHEN regenerated THEN 2 ELSE 1 END)::numeric / COUNT(*)::numeric, 2) as avg_calls_per_post
    FROM qc_logs
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY mode
    ORDER BY avg_calls_per_post DESC;
  `
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  buildQCPrompt,
  getModeSpecificChecks,
};
