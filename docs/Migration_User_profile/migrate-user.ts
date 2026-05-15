// migrate-user.ts
// Automated script to migrate a user from dev to prod database
// 
// Usage: npx tsx migrate-user.ts

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================
const DEV_CONFIG = {
  url: process.env.DEV_SUPABASE_URL!,
  serviceKey: process.env.DEV_SUPABASE_SERVICE_KEY!,
  oldUserId: 'user_3CgOcqAuswkCz4wME6LIFEZUnb1'
};

const PROD_CONFIG = {
  url: process.env.PROD_SUPABASE_URL!,
  serviceKey: process.env.PROD_SUPABASE_SERVICE_KEY!,
  newUserId: 'user_3DkTjTPUxh077oeL9dCOUSajw9k'
};

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================
async function migrateUser() {
  console.log('🚀 Starting user migration...\n');
  
  // Create Supabase clients
  const devDb = createClient(DEV_CONFIG.url, DEV_CONFIG.serviceKey);
  const prodDb = createClient(PROD_CONFIG.url, PROD_CONFIG.serviceKey);

  try {
    // ========================================================================
    // STEP 1: Extract data from DEV
    // ========================================================================
    console.log('📦 Step 1: Extracting data from DEV database...');
    
    const { data: profile, error: profileError } = await devDb
      .from('profiles')
      .select('*')
      .eq('id', DEV_CONFIG.oldUserId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found in dev: ${profileError?.message}`);
    }
    console.log('   ✅ Profile found:', profile.business_name);

    const { data: businesses, error: businessError } = await devDb
      .from('businesses')
      .select('*')
      .eq('user_id', DEV_CONFIG.oldUserId);

    if (businessError) {
      throw new Error(`Businesses fetch failed: ${businessError.message}`);
    }
    console.log(`   ✅ Found ${businesses?.length || 0} business(es)`);

    const { data: posts, error: postsError } = await devDb
      .from('community_posts')
      .select('*')
      .eq('business_id', DEV_CONFIG.oldUserId);

    if (postsError) {
      throw new Error(`Posts fetch failed: ${postsError.message}`);
    }
    console.log(`   ✅ Found ${posts?.length || 0} post(s)\n`);

    // ========================================================================
    // STEP 2: Check if user exists in PROD
    // ========================================================================
    console.log('🔍 Step 2: Checking if user exists in PROD...');
    
    const { data: existingProfile } = await prodDb
      .from('profiles')
      .select('id')
      .eq('id', PROD_CONFIG.newUserId)
      .maybeSingle();

    if (existingProfile) {
      console.log('   ⚠️  User already exists in PROD. Skipping profile creation.');
    }

    // ========================================================================
    // STEP 3: Insert profile into PROD
    // ========================================================================
    if (!existingProfile) {
      console.log('📝 Step 3: Creating profile in PROD...');
      
      const newProfile = {
        ...profile,
        id: PROD_CONFIG.newUserId,
        updated_at: new Date().toISOString()
      };

      const { error: insertProfileError } = await prodDb
        .from('profiles')
        .insert(newProfile);

      if (insertProfileError) {
        throw new Error(`Profile insert failed: ${insertProfileError.message}`);
      }
      console.log('   ✅ Profile created\n');
    } else {
      console.log('   ⏭️  Skipping profile creation\n');
    }

    // ========================================================================
    // STEP 4: Insert businesses into PROD
    // ========================================================================
    if (businesses && businesses.length > 0) {
      console.log('🏢 Step 4: Creating businesses in PROD...');
      
      const newBusinesses = businesses.map(biz => ({
        ...biz,
        user_id: PROD_CONFIG.newUserId,
        updated_at: new Date().toISOString()
      }));

      const { error: insertBizError } = await prodDb
        .from('businesses')
        .upsert(newBusinesses, { onConflict: 'id' });

      if (insertBizError) {
        throw new Error(`Businesses insert failed: ${insertBizError.message}`);
      }
      console.log(`   ✅ ${businesses.length} business(es) created\n`);
    }

    // ========================================================================
    // STEP 5: Insert community posts into PROD
    // ========================================================================
    if (posts && posts.length > 0) {
      console.log('📮 Step 5: Creating community posts in PROD...');
      
      const newPosts = posts.map(post => ({
        ...post,
        business_id: PROD_CONFIG.newUserId
      }));

      const { error: insertPostsError } = await prodDb
        .from('community_posts')
        .upsert(newPosts, { onConflict: 'id' });

      if (insertPostsError) {
        throw new Error(`Posts insert failed: ${insertPostsError.message}`);
      }
      console.log(`   ✅ ${posts.length} post(s) created\n`);
    }

    // ========================================================================
    // STEP 6: Verify migration
    // ========================================================================
    console.log('✅ Step 6: Verifying migration...');
    
    const { count: profileCount } = await prodDb
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id', PROD_CONFIG.newUserId);

    const { count: businessCount } = await prodDb
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', PROD_CONFIG.newUserId);

    const { count: postCount } = await prodDb
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', PROD_CONFIG.newUserId);

    console.log('\n📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Profiles migrated:  ${profileCount}`);
    console.log(`   Businesses migrated: ${businessCount}`);
    console.log(`   Posts migrated:      ${postCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Old User ID (dev):  ${DEV_CONFIG.oldUserId}`);
    console.log(`   New User ID (prod): ${PROD_CONFIG.newUserId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (profileCount === 0) {
      throw new Error('❌ Migration failed: No profile created!');
    }

    console.log('🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// RUN MIGRATION
// ============================================================================
migrateUser();
