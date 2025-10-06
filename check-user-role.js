// Node.js script to check user role
// Run with: node check-user-role.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  try {
    console.log('🔍 Checking user with email: jsodeh@gmail.com');
    
    // Check if user exists in user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'jsodeh@gmail.com')
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return;
    }

    if (!profile) {
      console.log('⚠️ User profile not found in user_profiles table');
      console.log('You may need to create a profile for this user');
      return;
    }

    console.log('✅ User Profile Found:');
    console.log('ID:', profile.id);
    console.log('Email:', profile.email);
    console.log('Full Name:', profile.full_name);
    console.log('Role:', profile.role);
    console.log('Created At:', profile.created_at);
    
    // Check if user is admin/super_admin
    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
    console.log('Is Admin:', isAdmin);
    
    if (!isAdmin) {
      console.log('⚠️ User is not an admin. Updating role to super_admin...');
      
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'super_admin' })
        .eq('id', profile.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Error updating user role:', updateError);
      } else {
        console.log('✅ User role updated successfully');
        console.log('New Role:', updated.role);
      }
    } else {
      console.log('✅ User already has admin privileges');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUser();