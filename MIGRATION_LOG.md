# Database Migration Log

**Project:** Your App  
**Databases:**  
- **DEV:** Supabase Dev Database (dev branch)  
- **PROD:** Supabase Prod Database (main branch)

**Purpose:** Track all database schema changes, RPC functions, triggers, and policies between dev and prod environments.

---

## 📋 Migration Status Legend

| Status | Meaning |
|--------|---------|
| ✅ APPLIED | Successfully applied to both DEV and PROD |
| 🟡 DEV ONLY | Applied to DEV, pending PROD deployment |
| ⏳ PLANNED | Documented but not yet applied to DEV |
| ❌ FAILED | Attempted but failed, needs investigation |
| 🔄 ROLLED BACK | Was applied but rolled back |

---

## 🗂️ Migration History

### Current Status Summary
- Total Migrations: 2
- Applied to DEV: 2
- Applied to PROD: 0
- Pending PROD: 2

---

## Migrations

### Migration 001: Tier System Foundation
**Date Created:** 2026-05-11  
**Status:** 🟡 DEV ONLY  
**Category:** Schema Change + New Tables  
**Priority:** HIGH (Required for credit system)

**Description:**  
Adds tier system to profiles table and creates credit transaction logging infrastructure.

**Changes:**
- Add `tier` column to `profiles` table
- Add `free_text_discovery_used` column to `profiles` table
- Create `credit_transactions` table with RLS
- Add indexes for performance

**File:** `migrations/001_tier_system_foundation.sql`

**Dependencies:** None

**Risk Level:** LOW (Additive only, no data modification)

**Estimated Downtime:** None (online DDL)

**Rollback Available:** ✅ Yes

---

### Migration 002: Discovery Timestamp Tracking
**Date Created:** 2026-05-11  
**Status:** 🟡 DEV ONLY  
**Category:** Schema Change  
**Priority:** MEDIUM (Supports tier system)

**Description:**  
Adds timestamp tracking for when text discovery last ran on each business.

**Changes:**
- Add `last_text_discovery_at` column to `businesses` table
- Add index on `last_text_discovery_at`

**File:** `migrations/002_discovery_timestamp.sql`

**Dependencies:** None

**Risk Level:** LOW (Additive only)

**Estimated Downtime:** None

**Rollback Available:** ✅ Yes

---

### Migration 003: Tier System RPC Functions
**Date Created:** 2026-05-11  
**Status:** 🟡 DEV ONLY  
**Category:** Functions  
**Priority:** HIGH (Required for tier system)

**Description:**  
Creates RPC functions for tier system operations: profile fetching, credit deduction, and business counting.

**Changes:**
- Create `get_user_profile(p_user_id)` function
- Create `deduct_credits(...)` function
- Create `mark_free_discovery_used(p_user_id)` function
- Create `count_user_businesses(p_user_id)` function

**File:** `migrations/003_tier_rpc_functions.sql`

**Dependencies:** Migration 001 (needs new columns)

**Risk Level:** LOW (New functions only)

**Estimated Downtime:** None

**Rollback Available:** ✅ Yes

---

### Migration 004: Tier System Data Migration
**Date Created:** 2026-05-11  
**Status:** ⏳ PLANNED  
**Category:** Data Migration  
**Priority:** HIGH (Must run after 001 applied to PROD)

**Description:**  
Sets default values for existing users and marks free discovery status based on existing data.

**Changes:**
- Set all existing users to `tier = 1`
- Set specific user to `tier = 2`
- Mark `free_text_discovery_used = true` for users with existing business_description

**File:** `migrations/004_tier_data_migration.sql`

**Dependencies:** Migration 001, Migration 003

**Risk Level:** MEDIUM (Modifies existing data)

**Estimated Downtime:** None (but should run during low traffic)

**Rollback Available:** ⚠️ Partial (can reset tier but not free_discovery_used accurately)

---

## 🔧 How to Use This System

### When Making Changes in DEV:

1. **Create Migration File**
   ```bash
   # Next number in sequence
   touch migrations/005_descriptive_name.sql
   ```

2. **Write Migration**
   - Include `-- UP` section (apply changes)
   - Include `-- DOWN` section (rollback)
   - Add comments explaining WHY

3. **Update This Log**
   - Add new entry with status "🟡 DEV ONLY"
   - Document dependencies
   - Note risk level

4. **Test in DEV**
   - Run UP migration
   - Test application
   - Run DOWN migration
   - Run UP again to verify idempotency

5. **Commit Both**
   ```bash
   git add migrations/005_descriptive_name.sql
   git add MIGRATION_LOG.md
   git commit -m "Migration 005: Description"
   ```

### When Deploying to PROD:

1. **Review Pending Migrations**
   - Check all "🟡 DEV ONLY" entries
   - Verify dependencies are satisfied
   - Check risk levels

2. **Schedule Deployment**
   - HIGH risk → Maintenance window
   - MEDIUM risk → Low traffic period
   - LOW risk → Anytime

3. **Backup PROD**
   ```bash
   # Supabase automatic backups are daily
   # For critical migrations, trigger manual backup in dashboard
   ```

4. **Run Migrations in Order**
   - Execute each numbered migration sequentially
   - Verify each step before proceeding
   - Run verification queries

5. **Update Status**
   - Change status from "🟡 DEV ONLY" to "✅ APPLIED"
   - Add "Applied to PROD" date
   - Note any issues encountered

6. **Deploy Application Code**
   - Merge main branch after database is ready
   - Deploy application that uses new schema

### Rollback Procedure:

```sql
-- If migration fails, run the DOWN section
-- Example for Migration 001:
BEGIN;
  -- Run rollback from migration file
  -- Verify with SELECT statements
COMMIT; -- or ROLLBACK if issues found
```

---

## 📊 Production Deployment Checklist Template

Use this before each PROD deployment:

```markdown
## PROD Deployment: [Date]

### Pre-Deployment
- [ ] All migrations tested in DEV
- [ ] Dependencies verified
- [ ] Backup confirmed (check Supabase dashboard)
- [ ] Maintenance window scheduled (if needed)
- [ ] Team notified

### Migrations to Apply
- [ ] Migration XXX: Description
- [ ] Migration YYY: Description

### Deployment Steps
1. [ ] Connect to PROD database (Supabase SQL Editor)
2. [ ] Run Migration XXX
3. [ ] Verify Migration XXX with test queries
4. [ ] Run Migration YYY
5. [ ] Verify Migration YYY with test queries
6. [ ] Update MIGRATION_LOG.md status

### Post-Deployment
- [ ] Application code deployed (merge main branch)
- [ ] Smoke tests passed
- [ ] Monitoring shows no errors
- [ ] Users can access features

### Rollback Plan (if needed)
- [ ] Run DOWN migrations in reverse order
- [ ] Revert application code
- [ ] Verify system stable
```

---

## 🚨 Emergency Contacts

**If Migration Fails:**
1. DO NOT PANIC - Supabase has automatic backups
2. Run rollback (DOWN section)
3. Check Supabase logs for error details
4. Contact team: [Add team contact info]

**Supabase Support:**
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

## 📝 Notes

### Best Practices:
- Always write rollback scripts
- Test migrations in DEV first
- Never modify migration files after applied to PROD
- Use transactions when possible
- Document WHY not just WHAT

### Common Pitfalls:
- Forgetting to add indexes → slow queries in PROD
- Not testing rollback → stuck if migration fails
- Applying migrations out of order → dependency errors
- Missing RLS policies → security vulnerabilities

---

## 🔄 Sync Status

**Last DEV → PROD Sync:** Never (initial setup)  
**Next Planned Sync:** TBD (after tier system complete in DEV)  
**Pending Migrations for PROD:** 4 migrations (001-004)

---

## Future Migrations (Planned)

*List future database changes here as they're planned:*

- **Migration 005:** Credit purchase system (Stripe integration)
- **Migration 006:** Post scheduling table
- **Migration 007:** Image generation history table

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-11  
**Maintained By:** Development Team  
**Review Frequency:** After each DEV database change
