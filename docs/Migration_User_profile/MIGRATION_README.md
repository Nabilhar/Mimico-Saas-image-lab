# User Migration Scripts - README

This package contains scripts to migrate users from your dev database to your prod database.

## Files Included

1. **USER_MIGRATION_GUIDE.md** - Manual step-by-step guide
2. **migrate-user.ts** - Automated TypeScript script
3. **migrate_user_dev_to_prod.sql** - SQL-only script
4. **.env.migration.example** - Environment variables template

## Which Method Should I Use?

### Option 1: Automated TypeScript Script (RECOMMENDED)
**Best for:** Regular migrations, multiple users, production use
**Pros:** Automated, safe, includes verification
**Cons:** Requires Node.js setup

### Option 2: Manual SQL Guide
**Best for:** One-time migrations, learning how it works
**Pros:** Full control, no dependencies
**Cons:** Manual, more room for error

### Option 3: SQL Script
**Best for:** Advanced users who want SQL-only solution
**Pros:** Database-native, no external dependencies
**Cons:** Less user-friendly

---

## Quick Start: Automated Script

### Step 1: Setup

```bash
# Install dependencies
npm install @supabase/supabase-js dotenv

# Or if using tsx for TypeScript execution
npm install -g tsx
```

### Step 2: Configure Environment

```bash
# Copy the example file
cp .env.migration.example .env.migration

# Edit with your actual credentials
nano .env.migration
```

Add your Supabase URLs and service role keys:
```env
DEV_SUPABASE_URL=https://xxxxx.supabase.co
DEV_SUPABASE_SERVICE_KEY=eyJhbGc...
PROD_SUPABASE_URL=https://yyyyy.supabase.co
PROD_SUPABASE_SERVICE_KEY=eyJhbGc...
```

### Step 3: Update User IDs

Edit `migrate-user.ts` and update these values:

```typescript
const DEV_CONFIG = {
  oldUserId: 'user_3CgOcqAuswkCz4wME6LIFEZUnb1'  // ← Your dev user ID
};

const PROD_CONFIG = {
  newUserId: 'user_3DkTjTPUxh077oeL9dCOUSajw9k'  // ← Your prod user ID
};
```

### Step 4: Run Migration

```bash
# Load environment variables and run
npx tsx migrate-user.ts
```

You'll see output like:
```
🚀 Starting user migration...

📦 Step 1: Extracting data from DEV database...
   ✅ Profile found: Pie Bar
   ✅ Found 1 business(es)
   ✅ Found 0 post(s)

🔍 Step 2: Checking if user exists in PROD...
   
📝 Step 3: Creating profile in PROD...
   ✅ Profile created

🏢 Step 4: Creating businesses in PROD...
   ✅ 1 business(es) created

✅ Step 6: Verifying migration...

📊 Migration Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Profiles migrated:  1
   Businesses migrated: 1
   Posts migrated:      0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Old User ID (dev):  user_3CgOcqAuswkCz4wME6LIFEZUnb1
   New User ID (prod): user_3DkTjTPUxh077oeL9dCOUSajw9k
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Migration completed successfully!
```

---

## Verification After Migration

### 1. Check in Supabase Dashboard

Go to your PROD database → Table Editor:
- **profiles** table → Look for the new user ID
- **businesses** table → Check user_id column
- **community_posts** table → Check business_id column

### 2. Test Login

1. Go to your production site (shorelinestudio.ca)
2. Sign in with the account
3. Verify:
   - ✅ Correct tier shows up
   - ✅ Correct credits show up
   - ✅ Business data loads
   - ✅ Everything works as expected

### 3. Run SQL Verification

In PROD database SQL editor:

```sql
-- Check everything exists
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k') as profiles,
  (SELECT COUNT(*) FROM businesses WHERE user_id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k') as businesses,
  (SELECT COUNT(*) FROM community_posts WHERE business_id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k') as posts;
```

Expected: All counts should match what you had in dev.

---

## Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
**Solution:**
```bash
npm install @supabase/supabase-js
```

### Error: "Profile not found in dev"
**Solution:** Check that the `oldUserId` in the script matches your dev database.

### Error: "violates foreign key constraint"
**Solution:** Make sure CASCADE is enabled (see earlier fix we applied).

### Error: "duplicate key value"
**Solution:** User already exists in prod. The script will skip and continue.

### Script runs but data doesn't appear
**Solution:** 
1. Check environment variables are correct
2. Verify service role keys have proper permissions
3. Check RLS policies aren't blocking service role

---

## Safety Notes

⚠️ **Important:**
- Always test in a staging environment first
- Back up your production database before migrating
- Never commit `.env.migration` to git
- Keep service role keys secret
- Verify data before deleting from dev

---

## Migration Checklist

- [ ] Install dependencies
- [ ] Configure `.env.migration`
- [ ] Update user IDs in script
- [ ] Test on a dummy user first
- [ ] Run migration script
- [ ] Verify in Supabase dashboard
- [ ] Test login on production site
- [ ] Confirm all features work
- [ ] (Optional) Clean up dev database

---

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify your environment variables
3. Test database connections manually
4. Check Supabase logs for detailed errors
5. Refer to USER_MIGRATION_GUIDE.md for manual steps

---

## What Gets Migrated?

✅ **Included:**
- User profile (tier, credits, all settings)
- All businesses owned by the user
- All community posts by the user
- Business metadata (colors, visuals, etc.)

❌ **Not included:**
- Other users' data
- System-level settings
- Database schema changes

---

## Post-Migration

After successful migration, you may want to:

1. **Update Clerk Metadata** (if applicable)
2. **Test all features** on production
3. **Monitor for issues** in the first 24 hours
4. **Keep dev data** as backup for a week
5. **Document the migration** for your records
