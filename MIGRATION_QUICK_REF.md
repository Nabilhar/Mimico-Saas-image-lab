# Migration System Quick Reference

## 📁 File Structure
```
your-project/
├── MIGRATION_LOG.md          # Master tracking document (THIS IS THE SOURCE OF TRUTH)
└── migrations/
    ├── TEMPLATE.sql           # Copy this for new migrations
    ├── 001_tier_system_foundation.sql
    ├── 002_discovery_timestamp.sql
    ├── 003_tier_rpc_functions.sql
    └── 004_tier_data_migration.sql
```

---

## 🚀 Quick Start: Creating a New Migration

### Step 1: Create the file
```bash
# Copy template and rename with next number
cp migrations/TEMPLATE.sql migrations/005_your_feature_name.sql
```

### Step 2: Fill in the template
- Update the header (name, description, date, risk level)
- Write UP section (apply changes)
- Write DOWN section (rollback)
- Add verification queries
- Document testing checklist

### Step 3: Update MIGRATION_LOG.md
Add entry:
```markdown
### Migration 005: Your Feature Name
**Date Created:** 2026-MM-DD
**Status:** 🟡 DEV ONLY
**Category:** [Schema Change / Functions / Data Migration]
**Priority:** [LOW / MEDIUM / HIGH]

**Description:** Brief description

**File:** `migrations/005_your_feature_name.sql`
**Dependencies:** [Migration numbers or "None"]
**Risk Level:** [LOW / MEDIUM / HIGH]
**Estimated Downtime:** [None / X minutes]
**Rollback Available:** [✅ Yes / ⚠️ Partial / ❌ No]
```

### Step 4: Test in DEV
```sql
-- In Supabase SQL Editor (DEV database)
-- Copy-paste the UP section
-- Run verification queries
-- Test your application
-- Run DOWN section (test rollback)
-- Run UP section again (test repeatability)
```

### Step 5: Commit
```bash
git add migrations/005_your_feature_name.sql
git add MIGRATION_LOG.md
git commit -m "Migration 005: Your feature name"
git push origin dev
```

---

## 📊 Deploying to PROD

### Pre-Deployment Checklist
```markdown
- [ ] All migrations tested in DEV
- [ ] MIGRATION_LOG.md updated with all pending migrations
- [ ] Dependencies verified (migrations run in order)
- [ ] Backup PROD database (Supabase does this daily, but trigger manual if HIGH risk)
- [ ] Maintenance window scheduled (if needed for HIGH risk)
- [ ] Team notified (if user-facing changes)
- [ ] Support team briefed (if user-impacting)
```

### Deployment Steps
1. **Open Supabase SQL Editor** (PROD database)
2. **Run migrations in numerical order** (001, 002, 003, ...)
3. **Run verification queries** after EACH migration
4. **Update MIGRATION_LOG.md** status from "🟡 DEV ONLY" to "✅ APPLIED"
5. **Deploy application code** (merge main branch)
6. **Monitor** logs and user reports

### Post-Deployment
```markdown
- [ ] Run smoke tests
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Verify user reports
- [ ] Update MIGRATION_LOG.md with "Applied to PROD" date
```

---

## 🆘 Emergency Rollback

### If Migration Fails:

1. **Stay Calm** - Supabase has automatic backups
2. **Check Error** - Read SQL error message carefully
3. **Run Rollback** - Execute DOWN section from migration file
4. **Verify Rollback** - Run verification queries
5. **Restore from Backup** (if rollback insufficient)
   - Supabase Dashboard → Database → Backups
   - Select most recent backup before migration
6. **Document Issue** - Add to MIGRATION_LOG.md notes
7. **Fix in DEV** - Correct the migration, test again
8. **Try Again** - Deploy corrected version

---

## 🎯 Risk Level Guidelines

### LOW Risk (Most migrations)
- Additive changes only (new columns, tables, functions)
- No existing data modification
- No user-facing impact
- Can run anytime
- Example: Adding a new column with DEFAULT value

### MEDIUM Risk
- Modifies existing data
- Changes to RLS policies
- Structural changes to tables
- Run during low traffic
- Have rollback plan
- Example: Updating all user records

### HIGH Risk
- Destructive operations (DROP, DELETE)
- Complex data migrations
- Changes to authentication/security
- Requires maintenance window
- Multiple dependencies
- Example: Removing a column with data

---

## 📝 Common Scenarios

### Adding a New Column
```sql
-- LOW RISK - Always safe
ALTER TABLE table_name 
ADD COLUMN new_column_name data_type DEFAULT default_value;

-- Rollback
ALTER TABLE table_name DROP COLUMN new_column_name;
```

### Creating a New Table
```sql
-- LOW RISK - Always safe
CREATE TABLE new_table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- columns...
);

-- Rollback
DROP TABLE new_table_name;
```

### Creating an RPC Function
```sql
-- LOW RISK - Always safe
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ ... $$;

-- Rollback
DROP FUNCTION function_name(param_types);
```

### Updating Existing Data
```sql
-- MEDIUM RISK - Test carefully
UPDATE table_name
SET column = new_value
WHERE condition;

-- Rollback requires backup or complex logic
-- Document expected row count before running
```

### Dropping a Column
```sql
-- HIGH RISK - Data loss!
-- Make sure application doesn't use this column anymore
ALTER TABLE table_name DROP COLUMN column_name;

-- Rollback impossible without backup
-- Document data loss in migration notes
```

---

## 🔍 Verification Query Templates

### Check Column Exists
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'your_table'
  AND column_name = 'your_column';
```

### Check Table Exists
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'your_table';
```

### Check Function Exists
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'your_function';
```

### Check Index Exists
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'your_table'
  AND indexname = 'your_index';
```

### Check RLS Policy
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table';
```

---

## 💡 Best Practices

### DO:
✅ Write rollback scripts (DOWN section)
✅ Test in DEV first
✅ Add comments explaining WHY
✅ Include verification queries
✅ Use transactions (BEGIN/COMMIT)
✅ Document dependencies
✅ Add indexes for performance
✅ Use IF NOT EXISTS for idempotency
✅ Log affected row counts

### DON'T:
❌ Modify migration files after applied to PROD
❌ Skip testing in DEV
❌ Forget to update MIGRATION_LOG.md
❌ Run migrations out of order
❌ Deploy code before database is ready
❌ Ignore verification queries
❌ Skip rollback testing
❌ Forget to add comments

---

## 📞 Getting Help

**If stuck:**
1. Check MIGRATION_LOG.md for dependencies
2. Review similar migrations (001-004) for examples
3. Test in DEV database first
4. Ask team before running HIGH risk migrations

**Supabase Resources:**
- Docs: https://supabase.com/docs/guides/database
- SQL Editor: Dashboard → SQL Editor
- Backups: Dashboard → Database → Backups
- Logs: Dashboard → Logs → Postgres Logs

---

## 🔄 Current System Status

**DEV Database:**
- Migration 001: ✅ Applied
- Migration 002: ✅ Applied
- Migration 003: ✅ Applied
- Migration 004: ✅ Applied

**PROD Database:**
- Migration 001: ⏳ Pending
- Migration 002: ⏳ Pending
- Migration 003: ⏳ Pending
- Migration 004: ⏳ Pending

**Next Action:** Deploy migrations 001-004 to PROD before launch

---

**Last Updated:** 2026-05-11
**Maintained By:** Development Team
