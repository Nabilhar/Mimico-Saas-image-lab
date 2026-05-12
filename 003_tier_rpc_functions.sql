-- ============================================================================
-- Migration 003: Tier System RPC Functions
-- ============================================================================
-- Description: Creates RPC functions for tier system operations
-- Date: 2026-05-11
-- Status: DEV ONLY
-- Risk Level: LOW (New functions only, no data modification)
-- Dependencies: Migration 001 (requires tier, free_text_discovery_used columns)
-- ============================================================================

-- ============================================================================
-- UP: Apply Migration
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION 1: get_user_profile
-- ─────────────────────────────────────────────────────────────────────────
-- Purpose: Fetch user's tier, credits, and free discovery status
-- Usage: SELECT * FROM get_user_profile('user_id_here');

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id TEXT)
RETURNS TABLE(
  tier INTEGER,
  credits BIGINT,  -- Changed from INTEGER to BIGINT to match profiles.credits column type
  free_text_discovery_used BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.tier, 1) as tier,  -- Default to Tier 1 if NULL
    COALESCE(p.credits, 0) as credits,  -- Default to 0 credits
    COALESCE(p.free_text_discovery_used, false) as free_text_discovery_used
  FROM profiles p
  WHERE p.id = p_user_id;
  
  -- If no profile found, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT 1::INTEGER, 0::BIGINT, false::BOOLEAN;
  END IF;
END;
$$;

COMMENT ON FUNCTION get_user_profile IS 'Fetches user tier, credits, and free discovery status. Returns defaults if profile not found.';

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION 2: deduct_credits
-- ─────────────────────────────────────────────────────────────────────────
-- Purpose: Safely deduct credits with validation and transaction logging
-- Usage: SELECT deduct_credits('user_id', 3, 'text_discovery', 'business_uuid', '{"key": "value"}');

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_reason TEXT,
  p_business_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits BIGINT;  -- Changed from INTEGER to BIGINT
  v_new_balance BIGINT;      -- Changed from INTEGER to BIGINT
BEGIN
  -- Get current credits
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if user exists
  IF v_current_credits IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User profile not found'
    );
  END IF;
  
  -- Check sufficient credits
  IF v_current_credits < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Insufficient credits',
      'current_credits', v_current_credits,
      'required', p_amount
    );
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, reason, business_id, metadata)
  VALUES (p_user_id, -p_amount, v_new_balance, p_reason, p_business_id, p_metadata);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Credits deducted successfully',
    'balance', v_new_balance,
    'deducted', p_amount
  );
END;
$$;

COMMENT ON FUNCTION deduct_credits IS 'Deducts credits with validation and transaction logging. Returns success status and new balance.';

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION 3: mark_free_discovery_used
-- ─────────────────────────────────────────────────────────────────────────
-- Purpose: Mark that Tier 1 user has consumed their first free text discovery
-- Usage: SELECT mark_free_discovery_used('user_id_here');

CREATE OR REPLACE FUNCTION mark_free_discovery_used(p_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET free_text_discovery_used = true
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION mark_free_discovery_used IS 'Marks that Tier 1 user has used their first free text discovery.';

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION 4: count_user_businesses
-- ─────────────────────────────────────────────────────────────────────────
-- Purpose: Count how many businesses a user has (for Tier 1 single-business limit)
-- Usage: SELECT count_user_businesses('user_id_here');

CREATE OR REPLACE FUNCTION count_user_businesses(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM businesses
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION count_user_businesses IS 'Returns the number of businesses owned by a user. Used to enforce Tier 1 single-business limit.';

COMMIT;

-- ============================================================================
-- VERIFICATION: Run these queries to verify migration success
-- ============================================================================

-- Check all functions were created
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_user_profile',
  'deduct_credits',
  'mark_free_discovery_used',
  'count_user_businesses'
)
ORDER BY routine_name;
-- Should return 4 rows

-- Test get_user_profile with non-existent user (should return defaults)
SELECT * FROM get_user_profile('test_fake_user_id_12345');
-- Expected: tier=1, credits=0, free_text_discovery_used=false

-- Test count_user_businesses with non-existent user
SELECT count_user_businesses('test_fake_user_id_12345');
-- Expected: 0

-- View function definitions (optional)
-- \df+ get_user_profile
-- \df+ deduct_credits
-- \df+ mark_free_discovery_used
-- \df+ count_user_businesses

-- ============================================================================
-- DOWN: Rollback Migration
-- ============================================================================

/*
BEGIN;

-- Drop all functions
DROP FUNCTION IF EXISTS get_user_profile(TEXT);
DROP FUNCTION IF EXISTS deduct_credits(TEXT, INTEGER, TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS mark_free_discovery_used(TEXT);
DROP FUNCTION IF EXISTS count_user_businesses(TEXT);

COMMIT;

-- Verification: Functions should be gone
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name IN (
  'get_user_profile',
  'deduct_credits',
  'mark_free_discovery_used',
  'count_user_businesses'
);
-- Should return 0 rows
*/

-- ============================================================================
-- TESTING EXAMPLES (Run in DEV after migration)
-- ============================================================================

/*
-- Assuming you have a test user with id 'test_user_123'

-- 1. Test get_user_profile
SELECT * FROM get_user_profile('test_user_123');

-- 2. Test deduct_credits (should fail - insufficient credits)
SELECT deduct_credits(
  'test_user_123', 
  5, 
  'test_deduction', 
  NULL, 
  '{"test": true}'::jsonb
);
-- Expected: {"success": false, "message": "Insufficient credits"}

-- 3. Give user some credits manually
UPDATE profiles SET credits = 10 WHERE id = 'test_user_123';

-- 4. Test deduct_credits again (should succeed)
SELECT deduct_credits(
  'test_user_123', 
  3, 
  'text_discovery', 
  NULL, 
  '{"business_name": "Test Business"}'::jsonb
);
-- Expected: {"success": true, "balance": 7, "deducted": 3}

-- 5. Verify credit transaction was logged
SELECT * FROM credit_transactions 
WHERE user_id = 'test_user_123' 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test mark_free_discovery_used
SELECT mark_free_discovery_used('test_user_123');

-- 7. Verify it was marked
SELECT free_text_discovery_used FROM profiles WHERE id = 'test_user_123';
-- Expected: true

-- 8. Test count_user_businesses
SELECT count_user_businesses('test_user_123');
-- Expected: 0 or 1 depending on your test data

-- 9. Clean up test data
UPDATE profiles SET credits = 0, free_text_discovery_used = false WHERE id = 'test_user_123';
DELETE FROM credit_transactions WHERE user_id = 'test_user_123';
*/

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================

/*
SAFE TO RUN IN PROD:

1. These functions do NOT modify any existing data
   - They only CREATE new functions
   - No UPDATE, INSERT, or DELETE statements on existing data

2. Dependencies:
   - REQUIRES Migration 001 to be applied first
   - Uses columns: tier, free_text_discovery_used, credits
   - Uses table: credit_transactions

3. Security:
   - All functions use SECURITY DEFINER (run with function owner's permissions)
   - RLS policies on credit_transactions still apply
   - No SQL injection risk (using parameterized queries)

4. After deployment:
   - Frontend can call these via supabase.rpc('function_name', {...})
   - Test each function with real user data
   - Monitor credit_transactions table for logging

5. No downtime expected

6. Rollback is safe - just DROP the functions
*/
