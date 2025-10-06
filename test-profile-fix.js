// Test script to verify the profile loading fix
// This script tests that the profile loading now works with the authenticated client

console.log('🔍 Testing Profile Loading Fix...');

async function testProfileLoading() {
  console.log('🧪 Testing profile loading with authenticated client...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.log('🚪 No active session - please sign in as jsodeh@gmail.com');
      return;
    }
    
    console.log('✅ Session found for user:', session.user.email);
    
    // Test the fixed profile loading
    console.log('👤 Testing profiles.getProfile...');
    const profileResult = await profiles.getProfile(session.user.id);
    console.log('📄 Profile Result:', profileResult);
    
    if (profileResult.error) {
      console.error('❌ Profile Loading Error:', profileResult.error);
    } else if (profileResult.data) {
      console.log('✅ Profile loaded successfully!');
      console.log('🔑 Role:', profileResult.data.role);
      console.log('.isAdmin:', profileResult.data.role === 'admin' || profileResult.data.role === 'super_admin');
      console.log('.isSuperAdmin:', profileResult.data.role === 'super_admin');
    }
    
    // Test the fixed isAdmin function
    console.log('🔐 Testing profiles.isAdmin...');
    const isAdminResult = await profiles.isAdmin(session.user.id);
    console.log('.isAdmin Result:', isAdminResult);
    
    // Test the fixed getProfileByEmail function
    console.log('📧 Testing profiles.getProfileByEmail...');
    const emailProfileResult = await profiles.getProfileByEmail(session.user.email);
    console.log('📧 Email Profile Result:', emailProfileResult);
    
    if (emailProfileResult.error) {
      console.error('❌ Email Profile Loading Error:', emailProfileResult.error);
    } else if (emailProfileResult.data) {
      console.log('✅ Email Profile loaded successfully!');
      console.log('📧 Role:', emailProfileResult.data.role);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testProfileLoading();

console.log('💡 Check the console for results:');
console.log('   - Look for "Profile loaded successfully!"');
console.log('   - Verify that role shows "super_admin"');
console.log('   - Check that .isAdmin is true');
console.log('   - Confirm no RLS permission errors');