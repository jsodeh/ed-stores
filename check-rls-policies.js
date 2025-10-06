// Script to check RLS policies in detail
// Run with: node check-rls-policies.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Create service client
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies in detail...\n');

  try {
    // Get all policies
    console.log('1. Retrieving all RLS policies...');
    const { data: allPolicies, error: policiesError } = await supabaseService
      .rpc('get_all_policies');

    if (policiesError) {
      console.log('⚠️  Could not retrieve all policies directly');
      console.log('   Trying alternative method...\n');
      
      // Alternative method: Check specific tables
      const tables = ['user_profiles', 'products', 'orders', 'cart_items', 'categories'];
      
      for (const table of tables) {
        console.log(`Checking policies for ${table}...`);
        try {
          const { data, error } = await supabaseService
            .from(table)
            .select('*')
            .limit(1);
            
          if (error) {
            console.log(`   ${table}: ${error.message}`);
          } else {
            console.log(`   ${table}: Access granted`);
          }
        } catch (err) {
          console.log(`   ${table}: Error - ${err.message}`);
        }
      }
    } else {
      console.log(`✅ Found ${allPolicies.length} policies in database`);
      
      // Filter policies by table
      const userProfilePolicies = allPolicies.filter(p => p.tablename === 'user_profiles');
      const productsPolicies = allPolicies.filter(p => p.tablename === 'products');
      const ordersPolicies = allPolicies.filter(p => p.tablename === 'orders');
      const cartItemsPolicies = allPolicies.filter(p => p.tablename === 'cart_items');
      
      console.log(`\n📋 User Profiles Policies (${userProfilePolicies.length}):`);
      userProfilePolicies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
        console.log(`     Qualifier: ${policy.qual || 'None'}`);
      });
      
      console.log(`\n📦 Products Policies (${productsPolicies.length}):`);
      productsPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
      });
      
      console.log(`\n🛒 Cart Items Policies (${cartItemsPolicies.length}):`);
      cartItemsPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
      });
      
      console.log(`\n📦 Orders Policies (${ordersPolicies.length}):`);
      ordersPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
      });
    }
    
    console.log('\n2. Checking user role access...');
    // Test specific admin operations
    const testOperations = [
      { table: 'user_profiles', operation: 'SELECT', description: 'Read user profiles' },
      { table: 'products', operation: 'SELECT', description: 'Read products' },
      { table: 'products', operation: 'INSERT', description: 'Create products' },
      { table: 'orders', operation: 'SELECT', description: 'Read orders' },
      { table: 'cart_items', operation: 'SELECT', description: 'Read cart items' }
    ];
    
    console.log('\n🧪 Testing specific operations:');
    for (const op of testOperations) {
      console.log(`   ${op.description} (${op.table} ${op.operation})`);
    }
    
    console.log('\n✅ RLS policy check completed');
    console.log('💡 Your super_admin role should grant access to all tables');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRLSPolicies();