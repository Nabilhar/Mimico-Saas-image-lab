# User Migration Guide: Dev → Prod Database

## Overview
This guide helps you migrate a user and all their data from your dev database to your prod database with a new Clerk user ID.

## Prerequisites
- Access to both Dev and Prod Supabase databases
- The old Clerk user ID (from dev)
- The new Clerk user ID (from prod)

---

## Step-by-Step Migration Process

### STEP 1: Extract Data from Dev Database

Run these queries in your **DEV database** SQL Editor:

```sql
-- 1.1 Get Profile Data
SELECT * FROM profiles WHERE id = 'user_3CgOcqAuswkCz4wME6LIFEZUnb1';

-- 1.2 Get Businesses Data
SELECT * FROM businesses WHERE user_id = 'user_3CgOcqAuswkCz4wME6LIFEZUnb1';

-- 1.3 Get Community Posts Data
SELECT * FROM community_posts WHERE business_id = 'user_3CgOcqAuswkCz4wME6LIFEZUnb1';
```

**📋 Save this data** - you'll need it for Step 2.

---

### STEP 2: Insert Data into Prod Database

Run these queries in your **PROD database** SQL Editor.

**⚠️ IMPORTANT:** Replace the `VALUES` with the actual data from Step 1!

```sql
-- Start transaction (so we can rollback if something goes wrong)
BEGIN;

-- 2.1 Insert Profile
INSERT INTO profiles (
  id, 
  tier, 
  credits, 
  free_text_discovery_used,
  first_name,
  last_name,
  email,
  business_name,
  category,
  voice,
  niche,
  street,
  city,
  province_state,
  country,
  postal_code,
  welcome_credits_claimed,
  business_description,
  brand_source,
  interior_layout,
  storefront_architecture,
  last_analyzed_business_name,
  last_analyzed_street,
  last_analyzed_city,
  contact_info,
  updated_at
)
VALUES (
  'user_3DkTjTPUxh077oeL9dCOUSajw9k',  -- ← NEW PROD USER ID
  2,                      -- tier (from dev data)
  5,                      -- credits (from dev data)
  false,                  -- free_text_discovery_used
  'Nabil',                -- first_name
  'Harti',                -- last_name
  'your@email.com',       -- email
  'Pie Bar',              -- business_name
  'Food & Beverage',      -- category
  'Warm & Conversational', -- voice
  'Pizza shop',           -- niche
  '123 Street',           -- street
  'Toronto',              -- city
  'ON',                   -- province_state
  'Canada',               -- country
  'M1M1M1',               -- postal_code
  false,                  -- welcome_credits_claimed
  '{"description": "..."}', -- business_description (JSON)
  'photos',               -- brand_source
  NULL,                   -- interior_layout
  NULL,                   -- storefront_architecture
  'Pie Bar',              -- last_analyzed_business_name
  '123 Street',           -- last_analyzed_street
  'Toronto',              -- last_analyzed_city
  NULL,                   -- contact_info
  NOW()                   -- updated_at
)
ON CONFLICT (id) DO NOTHING;

-- 2.2 Insert Businesses
-- ⚠️ Replace with actual data from dev
INSERT INTO businesses (
  id,
  user_id,
  business_name,
  street,
  city,
  province_state,
  country,
  postal_code,
  category,
  niche,
  voice,
  color_theme,
  business_visuals,
  storefront_architecture,
  interior_layout,
  business_description,
  brand_source,
  contact_info,
  is_active,
  timezone,
  last_text_discovery_at,
  created_at,
  updated_at
)
VALUES (
  'original-business-uuid-from-dev',  -- Keep same business ID
  'user_3DkTjTPUxh077oeL9dCOUSajw9k',  -- ← NEW PROD USER ID
  'Pie Bar',
  '123 Street',
  'Toronto',
  'ON',
  'Canada',
  'M1M1M1',
  'Food & Beverage',
  'Pizza shop',
  'Warm & Conversational',
  '{"primary": "#...", "secondary": "#..."}', -- JSON
  '{"logoColors": "..."}', -- JSON
  NULL,
  NULL,
  '{"description": "..."}', -- JSON
  'photos',
  NULL,
  true,
  'America/Toronto',
  NOW(),
  NOW(),
  NOW()
);

-- 2.3 Insert Community Posts (if any)
-- ⚠️ Only run this if you have posts to migrate
INSERT INTO community_posts (
  id,
  business_id,
  content,
  image_url,
  image_prompt,
  cognitive_lens,
  created_at
)
VALUES (
  'original-post-uuid-from-dev',
  'user_3DkTjTPUxh077oeL9dCOUSajw9k',  -- ← NEW PROD USER ID
  'Post content here',
  'https://...',
  'Image prompt',
  'some_lens',
  NOW()
);

-- If everything looks good, commit:
COMMIT;

-- If something went wrong, rollback:
-- ROLLBACK;
```

---

### STEP 3: Verify Migration

Run these verification queries in your **PROD database**:

```sql
-- Check profile exists
SELECT * FROM profiles WHERE id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k';

-- Check businesses exist
SELECT * FROM businesses WHERE user_id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k';

-- Check posts exist (if you migrated any)
SELECT * FROM community_posts WHERE business_id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k';

-- Verify counts
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k') as profile_count,
  (SELECT COUNT(*) FROM businesses WHERE user_id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k') as business_count,
  (SELECT COUNT(*) FROM community_posts WHERE business_id = 'user_3DkTjTPUxh077oeL9dCOUSajw9k') as post_count;
```

Expected result:
- profile_count: 1
- business_count: 1 (or more if multiple businesses)
- post_count: X (however many posts they had)

---

## Alternative: Export/Import Using Supabase Dashboard

### Method A: Using SQL Editor Copy/Paste

1. **In Dev Database:**
   ```sql
   -- Generate INSERT statements
   SELECT 'INSERT INTO profiles VALUES (' || 
          quote_literal(id) || ',' ||
          quote_literal(tier) || ',' ||
          -- ... etc
   FROM profiles WHERE id = 'old_user_id';
   ```

2. **Copy output** and modify the user ID

3. **Paste and run in Prod Database**

### Method B: Using CSV Export/Import

1. **Export from Dev:**
   - Run SELECT query → Download as CSV
   
2. **Modify CSV:**
   - Change old user ID to new user ID
   
3. **Import to Prod:**
   - Supabase Dashboard → Table Editor → Import CSV

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Solution:** The user already exists. Either:
- Skip the INSERT (they're already migrated)
- Delete the existing user first
- Use `ON CONFLICT DO NOTHING`

### Error: "violates foreign key constraint"
**Solution:** Insert in correct order:
1. profiles (parent)
2. businesses (child of profiles)
3. community_posts (child of profiles)

### Error: "column does not exist"
**Solution:** Your table schema might be different. Check:
```sql
\d profiles  -- Shows all columns
```

---

## Post-Migration Cleanup (Optional)

After verifying everything works in prod, you can optionally clean up the dev database:

```sql
-- ⚠️ DANGER: Only run this in DEV database after confirming prod works!
-- This deletes all data for the migrated user

BEGIN;

DELETE FROM community_posts WHERE business_id = 'user_3CgOcqAuswkCz4wME6LIFEZUnb1';
DELETE FROM businesses WHERE user_id = 'user_3CgOcqAuswkCz4wME6LIFEZUnb1';
DELETE FROM profiles WHERE id = 'user_3CgOcqAuswkCz4wME6LIFEZUnb1';

COMMIT;
```

---

## Quick Reference

### User IDs
- **Dev (old):** `user_3CgOcqAuswkCz4wME6LIFEZUnb1`
- **Prod (new):** `user_3DkTjTPUxh077oeL9dCOUSajw9k`

### Migration Checklist
- [ ] Extract data from dev database
- [ ] Modify user IDs in INSERT statements
- [ ] Run INSERT statements in prod database
- [ ] Verify data exists in prod
- [ ] Test login on prod (shorelinestudio.ca)
- [ ] Confirm everything works
- [ ] (Optional) Clean up dev database
