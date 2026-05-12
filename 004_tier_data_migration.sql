-- ============================================================================
-- Migration 004: Tier System Data Migration
-- ============================================================================
-- Description: Sets default values for existing users and marks free discovery
--              status based on existing data
-- Date: 2026-05-11
-- Status: PLANNED
-- Risk Level: MEDIUM (Modifies existing data)
-- Dependencies: Migration 001, Migration 003
-- ============================================================================

-- ⚠️  WARNING: This migration modifies existing user data
-- ⚠️  Run during low traffic period
-- ⚠️  Verify in DEV before running in PROD
-- ⚠️  Have rollback plan ready

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

-- Run these queries BEFORE applying migration to understand current state:

/*
-- 1. Count users without tier set
SELECT COUNT(*) as users_without_tier
FROM profiles
WHERE tier IS NULL;

-- 2. Count users with existing business_description (should mark as free_discovery_used)
SELECT COUNT(DISTINCT p.id) as users_with_existing_discovery
FROM profiles p
JOIN businesses b ON p.id = b.user_id
WHERE b.business_description IS NOT NULL
  AND b.business_description != '{}'::jsonb;

-- 3. Count users with multiple businesses (candidates for manual Tier 2 upgrade)
SELECT 
  user_id,
  COUNT(*) as business_count
FROM businesses
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY business_count DESC;

-- 4. Verify admin user exists
SELECT id, tier, credits, free_text_discovery_used
FROM profiles
WHERE id = 'XXX';  -- Replace with your actual Clerk user ID
*/

-- ============================================================================
-- UP: Apply Migration
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: Set all existing users to Tier 1 (if tier is NULL)
-- ─────────────────────────────────────────────────────────────────────────

UPDATE profiles 
SET tier = 1 
WHERE tier IS NULL;

-- Log result
DO $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'Set tier=1 for % existing users', v_affected_rows;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: Set specific user to Tier 2 (admin account)
-- ─────────────────────────────────────────────────────────────────────────
-- ⚠️  IMPORTANT: Replace 'xxx' with your actual Clerk user ID before running!

UPDATE profiles 
SET tier = 2 
WHERE id = 'user_3Cg0cqAuswkCz4wME6LIFEZUnb1';  -- Replace with your Clerk user ID

-- Verify it was updated
DO $$
DECLARE
  v_admin_tier INTEGER;
BEGIN
  SELECT tier INTO v_admin_tier FROM profiles WHERE id = 'user_3Cg0cqAuswkCz4wME6LIFEZUnb1';  -- Replace
  
  IF v_admin_tier = 2 THEN
    RAISE NOTICE 'Admin account successfully set to Tier 2';
  ELSE
    RAISE WARNING 'Admin account NOT found or tier not set. Check user_id!';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3: Mark free_text_discovery_used for users with existing discoveries
-- ─────────────────────────────────────────────────────────────────────────
-- If a user already has business_description data, they've already had their
-- free discovery. Mark it as used so they pay for future discoveries.

UPDATE profiles p
SET free_text_discovery_used = true
FROM businesses b
WHERE p.id = b.user_id
  AND b.business_description IS NOT NULL
  AND b.business_description != '{}'::jsonb
  AND p.free_text_discovery_used = false;  -- Only update if not already marked

-- Log result
DO $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'Marked free_text_discovery_used=true for % users with existing discoveries', v_affected_rows;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 4: Optional - Identify users with multiple businesses for manual review
-- ─────────────────────────────────────────────────────────────────────────
-- These users might want to be upgraded to Tier 2
-- This is just a SELECT query for manual review, not an UPDATE

DO $$
DECLARE
  v_multi_business_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_multi_business_count
  FROM (
    SELECT user_id, COUNT(*) as business_count
    FROM businesses
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) subquery;
  
  RAISE NOTICE 'Found % users with multiple businesses (may want Tier 2)', v_multi_business_count;
END $$;

-- Output list for manual review (this stays in transaction but doesn't modify data)
SELECT 
  p.id as user_id,
  p.first_name || ' ' || p.last_name as user_name,
  p.email,
  COUNT(b.id) as business_count,
  p.credits
FROM profiles p
JOIN businesses b ON p.id = b.user_id
WHERE p.tier = 1  -- Only Tier 1 users
GROUP BY p.id, p.first_name, p.last_name, p.email, p.credits
HAVING COUNT(b.id) > 1
ORDER BY COUNT(b.id) DESC;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Run these queries AFTER applying migration:

-- 1. Verify all users have tier set (none should be NULL)
SELECT COUNT(*) as users_with_null_tier
FROM profiles
WHERE tier IS NULL;
-- Expected: 0

-- 2. Check tier distribution
SELECT 
  tier,
  COUNT(*) as user_count
FROM profiles
GROUP BY tier
ORDER BY tier;
-- Expected: Tier 1 (majority), Tier 2 (1 or a few)

-- 3. Verify admin is Tier 2
SELECT id, tier, credits, free_text_discovery_used
FROM profiles
WHERE tier = 2;
-- Expected: Your account with tier=2

-- 4. Check free_text_discovery_used distribution
SELECT 
  free_text_discovery_used,
  COUNT(*) as user_count
FROM profiles
GROUP BY free_text_discovery_used;

-- 5. Verify users with business_description have free_discovery_used=true
SELECT COUNT(*) as users_with_discovery_but_not_marked
FROM profiles p
JOIN businesses b ON p.id = b.user_id
WHERE b.business_description IS NOT NULL
  AND b.business_description != '{}'::jsonb
  AND p.free_text_discovery_used = false;
-- Expected: 0 (all should be marked)

-- ============================================================================
-- DOWN: Rollback Migration
-- ============================================================================

/*
⚠️  WARNING: Rollback is PARTIAL - you cannot accurately restore 
free_text_discovery_used to previous state if you don't have a backup.

Only run rollback if migration failed or you need to revert immediately.

BEGIN;

-- 1. Reset all tiers to NULL (if you want to start over)
UPDATE profiles 
SET tier = NULL;

-- 2. Reset free_text_discovery_used to false for all users
-- ⚠️  This is INACCURATE - some users may have legitimately used their free discovery
UPDATE profiles 
SET free_text_discovery_used = false;

-- 3. Verify
SELECT tier, COUNT(*) FROM profiles GROUP BY tier;
SELECT free_text_discovery_used, COUNT(*) FROM profiles GROUP BY free_text_discovery_used;

COMMIT;

-- Better rollback: Restore from backup if available
-- In Supabase Dashboard: Projects > [Your Project] > Database > Backups
*/

-- ============================================================================
-- TESTING CHECKLIST (Run in DEV before PROD)
-- ============================================================================

/*
✅ Before running migration:
- [ ] Take database backup (Supabase auto-backups daily)
- [ ] Run PRE-MIGRATION CHECKS queries
- [ ] Identify your admin user_id
- [ ] Replace all 'xxx' with your actual Clerk user ID
- [ ] Test on DEV database first

✅ During migration:
- [ ] Run migration during low traffic period
- [ ] Monitor for errors
- [ ] Check RAISE NOTICE messages for affected row counts

✅ After migration:
- [ ] Run POST-MIGRATION VERIFICATION queries
- [ ] Manually test with your account (should be Tier 2)
- [ ] Test with a test Tier 1 account
- [ ] Verify frontend loads user profile correctly
- [ ] Test text discovery flow (should respect tier)

✅ Rollback plan:
- [ ] If migration fails, run DOWN section
- [ ] If critical data loss, restore from backup
- [ ] Document what went wrong
*/

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================

/*
IMPORTANT CONSIDERATIONS:

1. Data Modification Risk: MEDIUM
   - This migration UPDATES existing user data
   - Cannot be perfectly rolled back without backup
   - Test thoroughly in DEV first

2. User Impact:
   - Existing users moved to Tier 1 (most restrictive)
   - Users with existing discoveries marked as "free discovery used"
   - This means they'll be charged 3 credits for next text discovery
   - Your account set to Tier 2 (unlimited free discovery)

3. Business Logic:
   - Users who already benefited from discovery don't get free 2nd discovery
   - Fair approach: they got their free discovery before this feature existed
   - Alternative: Give everyone 3 free credits to offset first paid discovery

4. Communication Plan:
   - Consider announcing tier system to users
   - Explain why some users marked as "free discovery used"
   - Offer option to purchase credits or upgrade

5. Support Preparation:
   - Users may ask "Why am I being charged now?"
   - Response: "You already received 1 free discovery. Additional discoveries cost 3 credits."
   - Have credit purchase system ready or manual credit grants

6. Monitoring:
   - Watch credit_transactions table after deployment
   - Monitor support tickets for credit-related issues
   - Track conversion rate from Tier 1 to Tier 2

7. Optional Post-Migration Actions:
   - Grant all existing users 3 free credits as goodwill gesture
   - Manually upgrade power users to Tier 2
   - Send email explaining new tier system
*/

-- ============================================================================
-- OPTIONAL: Grant Free Credits to Existing Users (Goodwill Gesture)
-- ============================================================================

/*
If you want to give existing users some free credits to soften the transition:

BEGIN;

-- Give all existing Tier 1 users 3 free credits
UPDATE profiles 
SET credits = credits + 3 
WHERE tier = 1;

-- Log these credit grants
INSERT INTO credit_transactions (user_id, amount, balance_after, reason, metadata)
SELECT 
  id,
  3,
  credits,
  'tier_system_launch_bonus',
  '{"note": "Free credits for existing users during tier system launch"}'::jsonb
FROM profiles
WHERE tier = 1;

COMMIT;

-- Verify
SELECT tier, AVG(credits), MIN(credits), MAX(credits)
FROM profiles
GROUP BY tier;
*/
