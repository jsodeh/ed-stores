// Comprehensive debug script for user profile and admin status issues
// Run this in the browser console while signed in as jsodeh@gmail.com

console.log('🔍 Comprehensive Debug for User Profile and Admin Status');

// Function to check current auth state
function checkAuthState() {
  console.log('🔐 Current Auth State:');
  
  // Check if Supabase is available
  if (typeof supabase !== 'undefined') {
    console.log('✅ Supabase client is available');
  } else {
    console.log('❌ Supabase client is not available');
    return;
  }
  
  // Get current session
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('❌ Error getting session:', error);
      return;
    }
    
    console.log('📱 Session:', session);
    
    if (session && session.user) {
      console.log('👤 User Info:');
      console.log('   ID:', session.user.id);
      console.log('   Email:', session.user.email);
      console.log('   User Metadata:', session.user.user_metadata);
      
      // Try to fetch profile directly
      console.log('📋 Fetching profile directly from database...');
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Error fetching profile:', error);
          } else {
            console.log('📄 Profile Data:', data);
            console.log('🔑 Role Check:', {
              role: data.role,
              isAdmin: data.role === 'admin' || data.role === 'super_admin',
              isSuperAdmin: data.role === 'super_admin'
            });
          }
        });
        
      // Also try fetching by email
      console.log('📧 Fetching profile by email...');
      supabase
        .from('user_profiles')
        .select('*')
        .eq('email', session.user.email)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Error fetching profile by email:', error);
          } else {
            console.log('📧 Email Profile Data:', data);
            console.log('🔑 Email Role Check:', {
              role: data.role,
              isAdmin: data.role === 'admin' || data.role === 'super_admin',
              isSuperAdmin: data.role === 'super_admin'
            });
          }
        });
    } else {
      console.log('🚪 No active session');
    }
  });
}

// Function to check localStorage and sessionStorage
function checkStorage() {
  console.log('💾 Storage Check:');
  
  console.log('📱 localStorage keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('profile'))) {
      console.log('   🔑', key, ':', localStorage.getItem(key).substring(0, 100) + '...');
    }
  }
  
  console.log('🖥️ sessionStorage keys:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('profile'))) {
      console.log('   🔑', key, ':', sessionStorage.getItem(key).substring(0, 100) + '...');
    }
  }
}

// Function to try force refresh
function tryForceRefresh() {
  console.log('🔄 Trying force refresh...');
  
  if (typeof window.forceRefreshProfile === 'function') {
    console.log('✅ Calling forceRefreshProfile...');
    window.forceRefreshProfile();
  } else {
    console.log('❌ forceRefreshProfile not available');
  }
}

// Run all checks
console.log('🚀 Running Comprehensive Debug...');
checkAuthState();
checkStorage();
tryForceRefresh();

console.log('💡 Recommendations:');
console.log('1. Check browser console for detailed logs');
console.log('2. Look for "AuthContext: Profile loaded for user" messages');
console.log('3. Look for "AuthContext: isAdmin changed to:" messages');
console.log('4. Verify that profile.role shows "super_admin"');
console.log('5. If issues persist, try clearing browser cache and localStorage');
console.log('6. Try signing out and back in');
console.log('7. Check Network tab for any failed API requests');