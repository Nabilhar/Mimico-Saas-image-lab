-- ============================================================================
-- Migration XXX: [Short Descriptive Name]
-- ============================================================================
-- Description: [What does this migration do and why?]
-- Date: YYYY-MM-DD
-- Status: PLANNED / DEV ONLY / APPLIED
-- Risk Level: LOW / MEDIUM / HIGH
-- Dependencies: [Migration numbers this depends on, or "None"]
-- ============================================================================

-- ⚠️  [Add any critical warnings here if risk level is MEDIUM or HIGH]

-- ============================================================================
-- PRE-MIGRATION CHECKS (Optional for data modifications)
-- ============================================================================

/*
Run these queries BEFORE applying migration to understand current state:

-- Example: Count rows that will be affected
SELECT COUNT(*) as affected_rows
FROM table_name
WHERE condition;

-- Example: Check for conflicts
SELECT id, column_name
FROM table_name
WHERE potential_conflict_condition;
*/

-- ============================================================================
-- UP: Apply Migration
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: [First change]
-- ─────────────────────────────────────────────────────────────────────────
-- [Explain what this step does]

-- [Your SQL here]

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: [Second change]
-- ─────────────────────────────────────────────────────────────────────────
-- [Explain what this step does]

-- [Your SQL here]

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Run these queries AFTER applying migration to verify success:

-- 1. [Verification query 1]
-- Expected: [What you expect to see]

-- 2. [Verification query 2]
-- Expected: [What you expect to see]

-- ============================================================================
-- DOWN: Rollback Migration
-- ============================================================================

/*
[Explain rollback considerations - can it be fully rolled back? Any data loss?]

BEGIN;

-- [Your rollback SQL here]

COMMIT;

-- Verification after rollback:
-- [Verification queries]
*/

-- ============================================================================
-- TESTING CHECKLIST
-- ============================================================================

/*
✅ Before running migration:
- [ ] [Specific checks for this migration]
- [ ] Test on DEV database
- [ ] Review dependencies are satisfied
- [ ] Backup PROD database (if MEDIUM/HIGH risk)

✅ During migration:
- [ ] [Runtime checks]

✅ After migration:
- [ ] Run POST-MIGRATION VERIFICATION queries
- [ ] [Application-specific testing]
- [ ] Monitor logs for errors

✅ Rollback plan:
- [ ] [Specific rollback steps if needed]
*/

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================

/*
[Add any important notes for deploying to PROD:
- User impact
- Expected downtime (if any)
- Application code changes needed
- Support considerations
- Monitoring recommendations
]
*/
