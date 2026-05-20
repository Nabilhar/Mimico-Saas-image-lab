// lib/qc-monitoring.ts
// QC Monitoring Dashboard Utilities

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ViolationRate {
  mode: string;
  total_posts: number;
  violations: number;
  violation_rate_percent: number;
}

export interface ViolationType {
  mode: string;
  violation_type: string;
  occurrences: number;
}

export interface RegenerationSuccess {
  mode: string;
  total_regenerations: number;
  successful_fixes: number;
  success_rate_percent: number;
}

export interface CostAnalysis {
  mode: string;
  total_posts: number;
  qc_runs: number;
  total_api_calls: number;
  avg_calls_per_post: number;
}

// ============================================================================
// MONITORING FUNCTIONS
// ============================================================================

/**
 * Get violation rates by mode for the past week
 */
export async function getWeeklyViolationRates(): Promise<ViolationRate[]> {
  const { data, error } = await supabase
    .from('qc_weekly_violations')
    .select('*');
  
  if (error) {
    console.error('[QC Monitor] Error fetching violation rates:', error.message);
    return [];
  }
  
  return data || [];
}

/**
 * Get breakdown of violation types by mode
 */
export async function getViolationTypes(): Promise<ViolationType[]> {
  const { data, error } = await supabase
    .from('qc_violation_types')
    .select('*');
  
  if (error) {
    console.error('[QC Monitor] Error fetching violation types:', error.message);
    return [];
  }
  
  return data || [];
}

/**
 * Get regeneration success rates
 */
export async function getRegenerationSuccess(): Promise<RegenerationSuccess[]> {
  const { data, error } = await supabase
    .from('qc_regeneration_success')
    .select('*');
  
  if (error) {
    console.error('[QC Monitor] Error fetching regeneration success:', error.message);
    return [];
  }
  
  return data || [];
}

/**
 * Get cost analysis (API calls per post)
 */
export async function getCostAnalysis(): Promise<CostAnalysis[]> {
  const { data, error } = await supabase
    .from('qc_cost_analysis')
    .select('*');
  
  if (error) {
    console.error('[QC Monitor] Error fetching cost analysis:', error.message);
    return [];
  }
  
  return data || [];
}

/**
 * Get recent failed QC logs with post content
 */
export async function getRecentFailures(limit: number = 10) {
  const { data, error } = await supabase
    .from('qc_logs')
    .select(`
      id,
      mode,
      voice,
      qc_status,
      violations,
      word_count,
      created_at,
      community_posts (
        content,
        business_name
      )
    `)
    .eq('qc_status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[QC Monitor] Error fetching recent failures:', error.message);
    return [];
  }
  
  return data || [];
}

// ============================================================================
// DECISION SUPPORT FUNCTIONS
// ============================================================================

/**
 * Determine if a mode should be added to ALWAYS_QC based on violation rate
 */
export async function shouldAddToAlwaysQC(mode: string): Promise<{
  shouldAdd: boolean;
  currentRate: number;
  threshold: number;
}> {
  const rates = await getWeeklyViolationRates();
  const modeRate = rates.find(r => r.mode === mode);
  
  const THRESHOLD = 8; // 8% violation rate threshold
  const currentRate = modeRate?.violation_rate_percent || 0;
  
  return {
    shouldAdd: currentRate > THRESHOLD,
    currentRate,
    threshold: THRESHOLD
  };
}

/**
 * Determine if a mode can be removed from ALWAYS_QC based on low violation rate
 */
export async function shouldRemoveFromAlwaysQC(mode: string): Promise<{
  shouldRemove: boolean;
  currentRate: number;
  threshold: number;
  weeklyData: ViolationRate[];
}> {
  const THRESHOLD = 5; // 5% violation rate threshold
  const WEEKS_REQUIRED = 2; // Must be below threshold for 2 weeks
  
  // Get last 2 weeks of data (we'd need to modify the view for this)
  const rates = await getWeeklyViolationRates();
  const modeRate = rates.find(r => r.mode === mode);
  const currentRate = modeRate?.violation_rate_percent || 0;
  
  // For now, simple check - in production you'd want historical tracking
  return {
    shouldRemove: currentRate < THRESHOLD,
    currentRate,
    threshold: THRESHOLD,
    weeklyData: rates.filter(r => r.mode === mode)
  };
}

/**
 * Calculate estimated monthly cost for QC system
 */
export async function estimateMonthlyQCCost(): Promise<{
  totalPosts: number;
  qcRuns: number;
  totalAPICalls: number;
  estimatedCost: number;
}> {
  const costData = await getCostAnalysis();
  
  const totalPosts = costData.reduce((sum, d) => sum + d.total_posts, 0);
  const qcRuns = costData.reduce((sum, d) => sum + d.qc_runs, 0);
  const totalAPICalls = costData.reduce((sum, d) => sum + d.total_api_calls, 0);
  
  // Cost estimates (per 1M tokens)
  const HAIKU_COST = 0.25; // $0.25 per 1M input tokens
  const SONNET_COST = 3.00; // $3.00 per 1M input tokens
  
  // Average tokens per call
  const AVG_GENERATION_TOKENS = 1000; // ~1k tokens for generation
  const AVG_QC_TOKENS = 500; // ~500 tokens for QC check
  
  // Estimate cost
  const generationCost = (totalPosts * AVG_GENERATION_TOKENS / 1_000_000) * HAIKU_COST;
  const qcCost = (qcRuns * AVG_QC_TOKENS / 1_000_000) * SONNET_COST;
  const estimatedCost = generationCost + qcCost;
  
  return {
    totalPosts,
    qcRuns,
    totalAPICalls,
    estimatedCost
  };
}

// ============================================================================
// ALERT SYSTEM
// ============================================================================

export interface QCAlert {
  type: 'high_violation_rate' | 'low_success_rate' | 'high_cost' | 'prompt_needs_revision';
  severity: 'warning' | 'critical';
  mode: string;
  message: string;
  data: any;
}

/**
 * Check for QC system alerts
 */
export async function checkForAlerts(): Promise<QCAlert[]> {
  const alerts: QCAlert[] = [];
  
  // Check violation rates
  const violationRates = await getWeeklyViolationRates();
  for (const rate of violationRates) {
    if (rate.violation_rate_percent > 20) {
      alerts.push({
        type: 'prompt_needs_revision',
        severity: 'critical',
        mode: rate.mode,
        message: `${rate.mode} has ${rate.violation_rate_percent}% violation rate - prompt needs urgent revision`,
        data: rate
      });
    } else if (rate.violation_rate_percent > 10) {
      alerts.push({
        type: 'high_violation_rate',
        severity: 'warning',
        mode: rate.mode,
        message: `${rate.mode} has ${rate.violation_rate_percent}% violation rate - consider prompt improvements`,
        data: rate
      });
    }
  }
  
  // Check regeneration success rates
  const regenSuccess = await getRegenerationSuccess();
  for (const success of regenSuccess) {
    if (success.success_rate_percent < 50) {
      alerts.push({
        type: 'low_success_rate',
        severity: 'critical',
        mode: success.mode,
        message: `${success.mode} regeneration success rate is only ${success.success_rate_percent}% - QC fixes not working`,
        data: success
      });
    }
  }
  
  // Check costs
  const costAnalysis = await getCostAnalysis();
  for (const cost of costAnalysis) {
    if (cost.avg_calls_per_post > 1.5) {
      alerts.push({
        type: 'high_cost',
        severity: 'warning',
        mode: cost.mode,
        message: `${cost.mode} averaging ${cost.avg_calls_per_post} API calls per post - high regeneration rate`,
        data: cost
      });
    }
  }
  
  return alerts;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate a weekly QC report
 */
export async function generateWeeklyReport(): Promise<string> {
  const violationRates = await getWeeklyViolationRates();
  const violationTypes = await getViolationTypes();
  const regenSuccess = await getRegenerationSuccess();
  const costAnalysis = await getCostAnalysis();
  const alerts = await checkForAlerts();
  
  let report = `
╔════════════════════════════════════════════════════════════════════════════╗
║                      QC WEEKLY REPORT                                       ║
║                      ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VIOLATION RATES BY MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  violationRates.forEach(rate => {
    const status = rate.violation_rate_percent > 10 ? '🔴' : rate.violation_rate_percent > 5 ? '🟡' : '🟢';
    report += `${status} ${rate.mode.padEnd(25)} ${rate.violations}/${rate.total_posts} posts (${rate.violation_rate_percent}%)\n`;
  });
  
  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 TOP VIOLATION TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  const topViolations = violationTypes.slice(0, 10);
  topViolations.forEach(vt => {
    report += `• ${vt.mode} - ${vt.violation_type}: ${vt.occurrences} occurrences\n`;
  });
  
  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 REGENERATION SUCCESS RATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  regenSuccess.forEach(rs => {
    const status = rs.success_rate_percent < 50 ? '🔴' : rs.success_rate_percent < 80 ? '🟡' : '🟢';
    report += `${status} ${rs.mode.padEnd(25)} ${rs.successful_fixes}/${rs.total_regenerations} (${rs.success_rate_percent}%)\n`;
  });
  
  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 COST ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  costAnalysis.forEach(ca => {
    report += `• ${ca.mode.padEnd(25)} ${ca.total_api_calls} API calls for ${ca.total_posts} posts (${ca.avg_calls_per_post}x avg)\n`;
  });
  
  const costEstimate = await estimateMonthlyQCCost();
  report += `\nEstimated Monthly Cost: $${costEstimate.estimatedCost.toFixed(2)}\n`;
  
  if (alerts.length > 0) {
    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ALERTS (${alerts.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
    alerts.forEach(alert => {
      const icon = alert.severity === 'critical' ? '🔴' : '🟡';
      report += `${icon} ${alert.message}\n`;
    });
  }
  
  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return report;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getWeeklyViolationRates,
  getViolationTypes,
  getRegenerationSuccess,
  getCostAnalysis,
  getRecentFailures,
  checkForAlerts,
};
