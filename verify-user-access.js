// Script to verify user access and RLS policies
// Run with: node verify-user-access.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUserAccess() {
  try {
    console.log('🔍 Verifying user access for jsodeh@gmail.com...\n');
    
    // 1. Check user profile with service role (bypass RLS)
    console.log('1. Checking user profile with service role (bypass RLS)...');
    const { data: profileService, error: profileServiceError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('email', 'jsodeh@gmail.com')
      .single();

    if (profileServiceError) {
      console.error('❌ Error fetching profile with service role:', profileServiceError);
      return;
    }

    console.log('✅ Profile found with service role:');
    console.log('   ID:', profileService.id);
    console.log('   Email:', profileService.email);
    console.log('   Full Name:', profileService.full_name);
    console.log('   Role:', profileService.role);
    console.log('   Is Admin:', profileService.role === 'admin' || profileService.role === 'super_admin');
    console.log('   Is Super Admin:', profileService.role === 'super_admin');
    console.log();

    // 2. Check RLS policies for user_profiles table
    console.log('2. Checking RLS policies for user_profiles table...');
    const { data: policies, error: policiesError } = await supabaseService
      .rpc('get_policies_for_table', { table_name: 'user_profiles' });

    if (policiesError) {
      // Fallback: Check policies directly
      console.log('   Using fallback method to check policies...');
      const { data: directPolicies, error: directError } = await supabaseService
        .rpc('get_all_policies');
        
      if (!directError && directPolicies) {
        const userProfilePolicies = directPolicies.filter(p => p.tablename === 'user_profiles');
        console.log('   Found', userProfilePolicies.length, 'policies for user_profiles:');
        userProfilePolicies.forEach(policy => {
          console.log('   -', policy.policyname, ':', policy.cmd, 'for', policy.roles);
        });
      } else {
        console.log('   Could not retrieve policy information');
      }
    } else {
      console.log('   Found', policies.length, 'policies for user_profiles');
      policies.forEach(policy => {
        console.log('   -', policy.policyname);
      });
    }
    console.log();

    // 3. Test access to admin tables with user role
    console.log('3. Testing access to admin tables...');
    
    // Test accessing user_profiles with anon key (should work if RLS allows)
    const { data: profileAnon, error: profileAnonError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', profileService.id)
      .single();

    if (profileAnonError) {
      console.log('⚠️  Cannot read own profile with anon key:', profileAnonError.message);
    } else {
      console.log('✅ Can read own profile with anon key');
    }

    // Test accessing all user_profiles with anon key (should be restricted)
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role');

    if (allProfilesError) {
      console.log('✅ Correctly restricted from reading all profiles:', allProfilesError.message);
    } else {
      console.log('⚠️  Can read all profiles (potential security issue)');
      console.log('   Found', allProfiles.length, 'profiles');
    }
    console.log();

    // 4. Check if user can access admin dashboard tables
    console.log('4. Testing access to admin dashboard tables...');
    
    // Test accessing products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    if (productsError) {
      console.log('⚠️  Cannot read products:', productsError.message);
    } else {
      console.log('✅ Can read products');
    }

    // Test accessing orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError) {
      console.log('✅ Correctly restricted from reading orders:', ordersError.message);
    } else {
      console.log('⚠️  Can read orders without restriction');
    }
    console.log();

    // 5. Summary
    console.log('5. Summary:');
    const isSuperAdmin = profileService.role === 'super_admin';
    console.log('   User Role:', profileService.role);
    console.log('   Is Super Admin:', isSuperAdmin);
    
    if (isSuperAdmin) {
      console.log('✅ User has super_admin role. If still experiencing issues, check:');
      console.log('   - Browser cache and localStorage');
      console.log('   - Session refresh (try signing out and back in)');
      console.log('   - Frontend code for role checking logic');
    } else {
      console.log('❌ User does not have super_admin role');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run verification
verifyUserAccess();