// Node.js script to check and fix user role for jsodeh@gmail.com
// Run with: node fix-user-role.js

// You'll need to install the Supabase client:
// npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

// Set your Supabase URL and Service Role Key (NOT the anon key)
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserRole() {
  try {
    console.log('🔍 Checking user with email: jsodeh@gmail.com');
    
    // Check if user exists in user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'jsodeh@gmail.com')
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error fetching user profile:', profileError);
      return;
    }

    if (!profile) {
      console.log('⚠️ User profile not found in user_profiles table');
      
      // Check if user exists in auth.users
      console.log('🔍 Checking auth.users table...');
      const { data: authUsers, error: authError } = await supabase
        .auth.admin.getUserByEmail('jsodeh@gmail.com');
        
      if (authError) {
        console.error('❌ Error fetching auth user:', authError);
        return;
      }
      
      if (!authUsers || !authUsers.user) {
        console.log('❌ User not found in auth system');
        return;
      }
      
      console.log('✅ User found in auth system');
      console.log('User ID:', authUsers.user.id);
      console.log('Email:', authUsers.user.email);
      
      // Create a profile for the user
      console.log('📝 Creating user profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUsers.user.id,
          email: 'jsodeh@gmail.com',
          full_name: 'Joseph Sodeh',
          role: 'super_admin'
        })
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        return;
      }
      
      console.log('✅ User profile created successfully');
      console.log('Profile:', newProfile);
    } else {
      console.log('✅ User profile found');
      console.log('ID:', profile.id);
      console.log('Email:', profile.email);
      console.log('Full Name:', profile.full_name);
      console.log('Current Role:', profile.role);
      
      // Check if user already has admin privileges
      const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
      if (isAdmin) {
        console.log('✅ User already has admin privileges');
        if (profile.role !== 'super_admin') {
          console.log('📝 Updating role to super_admin...');
          const { data: updated, error: updateError } = await supabase
            .from('user_profiles')
            .update({ role: 'super_admin' })
            .eq('id', profile.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('❌ Error updating user role:', updateError);
          } else {
            console.log('✅ User role updated to super_admin');
            console.log('New Role:', updated.role);
          }
        }
      } else {
        console.log('📝 Updating user role to super_admin...');
        const { data: updated, error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'super_admin' })
          .eq('id', profile.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Error updating user role:', updateError);
        } else {
          console.log('✅ User role updated to super_admin');
          console.log('New Role:', updated.role);
        }
      }
    }
    
    // Verify the final state
    console.log('\n🔍 Verifying final state...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'jsodeh@gmail.com')
      .single();
      
    if (finalError) {
      console.error('❌ Error verifying final state:', finalError);
    } else {
      console.log('✅ Final verification:');
      console.log('ID:', finalProfile.id);
      console.log('Email:', finalProfile.email);
      console.log('Full Name:', finalProfile.full_name);
      console.log('Role:', finalProfile.role);
      console.log('Is Admin:', finalProfile.role === 'admin' || finalProfile.role === 'super_admin');
      console.log('Is Super Admin:', finalProfile.role === 'super_admin');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixUserRole();