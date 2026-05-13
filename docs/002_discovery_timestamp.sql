-- ============================================================================
-- Migration 002: Discovery Timestamp Tracking
-- ============================================================================
-- Description: Adds timestamp tracking for when text discovery last ran
-- Date: 2026-05-11
-- Status: DEV ONLY
-- Risk Level: LOW (Additive only)
-- Dependencies: None
-- ============================================================================

-- ============================================================================
-- UP: Apply Migration
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Add last_text_discovery_at column to businesses table
-- ─────────────────────────────────────────────────────────────────────────
-- Tracks when text discovery (Haiku web search) last ran for this business
-- NULL = never run, TIMESTAMPTZ = last run date

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS last_text_discovery_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN businesses.last_text_discovery_at IS 'Timestamp when text discovery (Haiku web search) last ran for this business. NULL = never run.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Add index for faster lookups
-- ─────────────────────────────────────────────────────────────────────────
-- Useful for queries like "find businesses that need discovery refresh"

CREATE INDEX IF NOT EXISTS idx_businesses_last_text_discovery 
ON businesses(last_text_discovery_at);

COMMIT;

-- ============================================================================
-- VERIFICATION: Run these queries to verify migration success
-- ============================================================================

-- Check new column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'last_text_discovery_at';

-- Check index was created
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename = 'businesses'
  AND indexname = 'idx_businesses_last_text_discovery';

-- Check existing businesses have NULL (expected)
SELECT 
  COUNT(*) as total_businesses,
  COUNT(last_text_discovery_at) as businesses_with_discovery_timestamp
FROM businesses;
-- businesses_with_discovery_timestamp should be 0 after fresh migration

-- ============================================================================
-- DOWN: Rollback Migration
-- ============================================================================

/*
BEGIN;

-- 1. Drop index
DROP INDEX IF EXISTS idx_businesses_last_text_discovery;

-- 2. Remove column
ALTER TABLE businesses DROP COLUMN IF EXISTS last_text_discovery_at;

COMMIT;

-- Verification: Column and index should be gone
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'last_text_discovery_at';
-- Should return 0 rows

SELECT indexname 
FROM pg_indexes
WHERE indexname = 'idx_businesses_last_text_discovery';
-- Should return 0 rows
*/

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================

/*
SAFE TO RUN IN PROD:

1. This is a purely additive migration
   - No existing data is modified
   - No existing columns are changed
   - Application will work with or without this column

2. Expected behavior after migration:
   - All existing businesses will have last_text_discovery_at = NULL
   - New text discoveries will update this timestamp
   - Vision-only discoveries will NOT update this timestamp (by design)

3. No downtime expected

4. Application code can check this timestamp to show:
   - "Last discovery: 2 days ago"
   - "Re-run discovery" button state
   - Stale discovery warnings

5. Future use cases:
   - Auto-trigger discovery refresh after 30 days
   - Analytics: "How often do users re-run discovery?"
   - Support: "When was their last successful discovery?"
*/
