-- ============================================================================
-- Migration 001: Tier System Foundation
-- ============================================================================
-- Description: Adds tier system to profiles table and creates credit 
--              transaction logging infrastructure
-- Date: 2026-05-11
-- Status: DEV ONLY
-- Risk Level: LOW (Additive only, no data modification)
-- Dependencies: None
-- ============================================================================

-- ============================================================================
-- UP: Apply Migration
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Add tier column to profiles table
-- ─────────────────────────────────────────────────────────────────────────
-- tier = 1 (default): Single business, first discovery free, then 3 credits
-- tier = 2: Multiple businesses, unlimited free discovery

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2));

COMMENT ON COLUMN profiles.tier IS 'User tier: 1 = Free (single business, paid discovery), 2 = Premium (multiple businesses, free discovery)';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Add free text discovery tracking
-- ─────────────────────────────────────────────────────────────────────────
-- Tracks if Tier 1 user has consumed their first free text discovery

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS free_text_discovery_used BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.free_text_discovery_used IS 'TRUE if Tier 1 user has used their first free text discovery';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Add index for faster tier lookups
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_tier 
ON profiles(tier);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Create credit_transactions table
-- ─────────────────────────────────────────────────────────────────────────
-- Logs all credit additions and deductions for auditing

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount BIGINT NOT NULL,  -- Changed from INTEGER to BIGINT to match profiles.credits
  balance_after BIGINT NOT NULL,  -- Changed from INTEGER to BIGINT
  reason TEXT NOT NULL,  -- 'text_discovery', 'purchase', 'manual_addition', 'refund', etc.
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,  -- Link to business if relevant
  metadata JSONB DEFAULT '{}'::jsonb,  -- Additional context (e.g., business_name, timestamp)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credit_transactions IS 'Audit log of all credit transactions (additions and deductions)';
COMMENT ON COLUMN credit_transactions.amount IS 'Negative = deduction, Positive = addition';
COMMENT ON COLUMN credit_transactions.balance_after IS 'User credit balance snapshot after this transaction';
COMMENT ON COLUMN credit_transactions.reason IS 'Why credits changed: text_discovery, purchase, manual_addition, refund, etc.';
COMMENT ON COLUMN credit_transactions.metadata IS 'Additional context in JSON format';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Add indexes for credit_transactions
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user 
ON credit_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_created 
ON credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_reason 
ON credit_transactions(reason);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Enable RLS on credit_transactions
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. RLS Policy: Users can only see their own transactions
-- ─────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own credit transactions"
ON credit_transactions FOR SELECT
USING (user_id = (auth.jwt() ->> 'sub'));

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Set your admin account to Tier 2 (PROD: Update with actual user_id)
-- ─────────────────────────────────────────────────────────────────────────

-- IMPORTANT: Replace 'xxx' with your actual Clerk user ID before running in PROD
-- In DEV, you can leave this commented out or run manually after migration

-- UPDATE profiles 
-- SET tier = 2 
-- WHERE id = 'xxx';  -- Replace with your Clerk user ID

COMMIT;

-- ============================================================================
-- VERIFICATION: Run these queries to verify migration success
-- ============================================================================

-- Check new columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('tier', 'free_text_discovery_used')
ORDER BY ordinal_position;

-- Check credit_transactions table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'credit_transactions';

-- Check indexes were created
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('profiles', 'credit_transactions')
  AND indexname LIKE '%tier%' OR indexname LIKE '%credit%'
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'credit_transactions';

-- ============================================================================
-- DOWN: Rollback Migration
-- ============================================================================

-- WARNING: This will delete all credit transaction history!
-- Only run this if you need to rollback the migration.

/*
BEGIN;

-- 1. Drop RLS policy
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;

-- 2. Drop credit_transactions table (and all data)
DROP TABLE IF EXISTS credit_transactions;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_profiles_tier;
DROP INDEX IF EXISTS idx_credit_transactions_user;
DROP INDEX IF EXISTS idx_credit_transactions_created;
DROP INDEX IF EXISTS idx_credit_transactions_reason;

-- 4. Remove columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS free_text_discovery_used;
ALTER TABLE profiles DROP COLUMN IF EXISTS tier;

COMMIT;

-- Verification: Columns and table should be gone
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('tier', 'free_text_discovery_used');
-- Should return 0 rows

SELECT table_name 
FROM information_schema.tables
WHERE table_name = 'credit_transactions';
-- Should return 0 rows
*/

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================

/*
BEFORE RUNNING IN PROD:

1. Update the admin user_id:
   - Replace 'xxx' in the UPDATE statement (line 94) with your actual Clerk user ID
   - Or run the UPDATE separately after migration

2. Verify no application code is running that expects these columns
   - This is ADDITIVE only, so should be safe
   - But verify your app can handle NULL tier (defaults to 1)

3. Expected results:
   - All existing users will have tier = 1 (default)
   - All existing users will have free_text_discovery_used = false
   - credit_transactions table will be empty
   - Your account will be tier = 2 (if you run the UPDATE)

4. After migration, existing users:
   - Can continue using the app normally
   - Will be Tier 1 by default
   - First text discovery will be free
   - Photo analysis remains free

5. No downtime expected - these are additive DDL changes
*/
