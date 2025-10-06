// Simple script to check specific user access
// Run with: node check-specific-user.js

import { createClient } from '@supabase/supabase-js';

// Since we're in an ES module, we'll load env vars manually
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
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '64411142-72a2-4ce7-9b8f-cb8eb2dd69ee';
const USER_EMAIL = 'jsodeh@gmail.com';

async function checkUser() {
  console.log('🔍 Checking user access for:', USER_EMAIL);
  console.log('👤 User ID:', USER_ID);
  console.log();

  try {
    // Check profile with service role
    console.log('1. Checking profile with service role...');
    const { data: profile, error } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Profile found:');
    console.log('   Role:', profile.role);
    console.log('   Is Super Admin:', profile.role === 'super_admin');
    console.log();

    // Check RLS policies
    console.log('2. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('id', USER_ID);

    if (policiesError) {
      console.log('⚠️  RLS might be restricting access:', policiesError.message);
    } else {
      console.log('✅ RLS allows access to own profile');
    }
    console.log();

    // Test with anon key
    console.log('3. Testing with anon key...');
    const { data: anonData, error: anonError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (anonError) {
      console.log('⚠️  Anon key access restricted:', anonError.message);
      console.log('   This is expected behavior for RLS');
    } else {
      console.log('✅ Anon key allows access to own profile');
    }
    console.log();

    // Summary
    console.log('4. Summary:');
    if (profile.role === 'super_admin') {
      console.log('✅ User has super_admin role');
      console.log('💡 If still experiencing issues, try:');
      console.log('   - Clearing browser cache and localStorage');
      console.log('   - Signing out and back in');
      console.log('   - Checking frontend role checking logic');
    } else {
      console.log('❌ User does not have super_admin role');
      console.log('   Current role:', profile.role);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUser();