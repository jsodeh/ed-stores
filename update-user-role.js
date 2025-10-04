import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://isgqdllaunoydbjweiwo.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Updating user role...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Service Role Key exists:', !!supabaseServiceRoleKey);

if (!supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.error('Please add your service role key to the .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserRole() {
  try {
    const userEmail = 'jsodeh@gmail.com';
    console.log(`🔍 Looking for user with email: ${userEmail}`);
    
    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }
    
    if (!userData) {
      console.error('❌ User not found with email:', userEmail);
      console.error('Please make sure the user has signed up and the email is correct');
      return;
    }
    
    console.log('✅ Found user:', userData);
    
    // Check if user is already super_admin
    if (userData.role === 'super_admin') {
      console.log('ℹ️ User is already a super_admin');
      return;
    }
    
    // Update the user's role to super_admin
    console.log('🔄 Updating user role to super_admin...');
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'super_admin' })
      .eq('id', userData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return;
    }
    
    console.log('✅ User role updated successfully:', updateData);
  } catch (err) {
    console.error('❌ Update user role error:', err);
  }
}

updateUserRole();