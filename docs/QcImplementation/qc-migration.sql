-- ============================================================================
-- QC SYSTEM DATABASE MIGRATION
-- ============================================================================
-- This migration adds quality control tracking to the Shoreline system.
-- Run this in Supabase SQL Editor.

-- ============================================================================
-- STEP 1: Add QC fields to community_posts table (Optional - for post-level tracking)
-- ============================================================================

-- Add QC status tracking to posts
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS qc_status TEXT CHECK (qc_status IN ('passed', 'failed', 'skipped'));

-- Store QC violations as JSON
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS qc_violations JSONB;

-- Track which AI model generated the post
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS generation_model TEXT;

-- Track if post was regenerated after QC failure
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS regenerated BOOLEAN DEFAULT FALSE;

-- Add mode and voice tracking (if not already present)
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS mode TEXT;

ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS voice TEXT;

-- Add word count for analytics
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS word_count INTEGER;

-- Create index for QC filtering
CREATE INDEX IF NOT EXISTS idx_community_posts_qc_status 
ON community_posts(qc_status);

CREATE INDEX IF NOT EXISTS idx_community_posts_mode 
ON community_posts(mode);

-- ============================================================================
-- STEP 2: Create dedicated qc_logs table (Recommended - for detailed analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qc_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to the post (optional - null if post wasn't saved yet)
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  
  -- Mode and voice used
  mode TEXT NOT NULL,
  voice TEXT NOT NULL,
  
  -- Which model generated the post
  generation_model TEXT NOT NULL,
  
  -- QC outcome
  qc_status TEXT NOT NULL CHECK (qc_status IN ('passed', 'failed', 'skipped')),
  
  -- Detailed violations (JSON array)
  violations JSONB DEFAULT '[]'::jsonb,
  
  -- Was the post regenerated after QC?
  regenerated BOOLEAN DEFAULT FALSE,
  
  -- Word count of the generated post
  word_count INTEGER,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_qc_logs_mode 
ON qc_logs(mode);

CREATE INDEX IF NOT EXISTS idx_qc_logs_qc_status 
ON qc_logs(qc_status);

CREATE INDEX IF NOT EXISTS idx_qc_logs_created_at 
ON qc_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_qc_logs_mode_status 
ON qc_logs(mode, qc_status);

-- ============================================================================
-- STEP 3: Create monitoring views for easy analytics
-- ============================================================================

-- View: Weekly violation rates by mode
CREATE OR REPLACE VIEW qc_weekly_violations AS
SELECT 
  mode,
  COUNT(*) as total_posts,
  SUM(CASE WHEN qc_status = 'failed' THEN 1 ELSE 0 END) as violations,
  ROUND(100.0 * SUM(CASE WHEN qc_status = 'failed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as violation_rate_percent
FROM qc_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY mode
ORDER BY violation_rate_percent DESC;

-- View: Violation type breakdown
CREATE OR REPLACE VIEW qc_violation_types AS
SELECT 
  mode,
  jsonb_array_elements(violations)->>'type' as violation_type,
  COUNT(*) as occurrences
FROM qc_logs
WHERE qc_status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
  AND violations IS NOT NULL
  AND jsonb_array_length(violations) > 0
GROUP BY mode, violation_type
ORDER BY mode, occurrences DESC;

-- View: Regeneration success rates
CREATE OR REPLACE VIEW qc_regeneration_success AS
SELECT 
  mode,
  COUNT(*) as total_regenerations,
  SUM(CASE WHEN qc_status = 'passed' THEN 1 ELSE 0 END) as successful_fixes,
  ROUND(100.0 * SUM(CASE WHEN qc_status = 'passed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as success_rate_percent
FROM qc_logs
WHERE regenerated = true
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY mode
ORDER BY success_rate_percent DESC;

-- View: Cost analysis (API calls per post)
CREATE OR REPLACE VIEW qc_cost_analysis AS
SELECT 
  mode,
  COUNT(*) as total_posts,
  SUM(CASE WHEN qc_status != 'skipped' THEN 1 ELSE 0 END) as qc_runs,
  SUM(CASE WHEN regenerated THEN 2 ELSE 1 END) as total_api_calls,
  ROUND(SUM(CASE WHEN regenerated THEN 2 ELSE 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric, 2) as avg_calls_per_post
FROM qc_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY mode
ORDER BY avg_calls_per_post DESC;

-- ============================================================================
-- STEP 4: Sample queries for monitoring
-- ============================================================================

-- Query 1: Check current week's violation rates
-- SELECT * FROM qc_weekly_violations;

-- Query 2: See which violation types are most common
-- SELECT * FROM qc_violation_types;

-- Query 3: Check regeneration success rates
-- SELECT * FROM qc_regeneration_success;

-- Query 4: Analyze API call costs
-- SELECT * FROM qc_cost_analysis;

-- Query 5: Find specific problematic posts
-- SELECT 
--   ql.mode,
--   ql.qc_status,
--   ql.violations,
--   cp.content,
--   cp.created_at
-- FROM qc_logs ql
-- LEFT JOIN community_posts cp ON ql.post_id = cp.id
-- WHERE ql.qc_status = 'failed'
--   AND ql.created_at > NOW() - INTERVAL '24 hours'
-- ORDER BY ql.created_at DESC
-- LIMIT 10;

-- ============================================================================
-- STEP 5: Grant necessary permissions (adjust role as needed)
-- ============================================================================

-- Grant access to authenticated users (if using RLS)
-- ALTER TABLE qc_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for qc_logs (users can only see their own QC logs)
-- CREATE POLICY "Users can view their own QC logs"
--   ON qc_logs FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM community_posts 
--       WHERE community_posts.id = qc_logs.post_id 
--       AND community_posts.business_id = auth.uid()
--     )
--   );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('qc_logs', 'community_posts');

-- Verify columns were added to community_posts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_posts' 
  AND column_name IN ('qc_status', 'qc_violations', 'generation_model', 'regenerated', 'mode', 'voice', 'word_count');

-- Verify indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('qc_logs', 'community_posts') 
  AND indexname LIKE 'idx_%qc%' OR indexname LIKE 'idx_%mode%';

-- Verify views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'qc_%';

-- ============================================================================
-- CLEANUP (if you need to rollback)
-- ============================================================================

-- DROP VIEW IF EXISTS qc_cost_analysis;
-- DROP VIEW IF EXISTS qc_regeneration_success;
-- DROP VIEW IF EXISTS qc_violation_types;
-- DROP VIEW IF EXISTS qc_weekly_violations;
-- DROP TABLE IF EXISTS qc_logs;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS qc_status;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS qc_violations;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS generation_model;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS regenerated;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS mode;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS voice;
-- ALTER TABLE community_posts DROP COLUMN IF EXISTS word_count;
