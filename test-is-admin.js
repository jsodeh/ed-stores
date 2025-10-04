import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create a client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Test user email (the super admin user)
const testUserEmail = 'jsodeh@gmail.com';
const testUserId = '64411142-72a2-4ce7-9b8f-cb8eb2dd69ee';

async function testIsAdmin() {
  console.log('Testing isAdmin for user with email:', testUserEmail);
  
  // First, let's try to create the user profile if it doesn't exist
  console.log('Checking if user profile exists...');
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", testUserEmail)
    .single();
  
  if (existingProfileError && existingProfileError.code === 'PGRST116') {
    console.log('User profile does not exist. Creating it...');
    
    // Create the user profile
    const { data: newProfile, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        id: testUserId,
        email: testUserEmail,
        full_name: "Joseph Sodeh",
        role: "super_admin"
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user profile:', createError);
    } else {
      console.log('User profile created:', newProfile);
    }
  } else if (existingProfile) {
    console.log('User profile already exists:', existingProfile);
    
    // Update the role to super_admin if it's not already
    if (existingProfile.role !== 'super_admin') {
      console.log('Updating user role to super_admin...');
      const { data: updatedProfile, error: updateError } = await supabase
        .from("user_profiles")
        .update({ role: 'super_admin' })
        .eq("id", existingProfile.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user profile:', updateError);
      } else {
        console.log('User profile updated:', updatedProfile);
      }
    }
  }
  
  // Now test the isAdmin function
  console.log('Testing isAdmin function...');
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", testUserEmail)
    .single();
  
  console.log('Profile data:', profile);
  console.log('Profile error:', profileError);
  
  if (profile) {
    console.log('Profile ID:', profile.id);
    console.log('Profile role:', profile.role);
    console.log('Is admin (direct check):', profile.role === 'admin' || profile.role === 'super_admin');
  }
}

testIsAdmin().catch(console.error);