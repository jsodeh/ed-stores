// Debug script to check profile loading issues
// Run this in the browser console while signed in as jsodeh@gmail.com

console.log('🔍 Debugging Profile Loading Issues...');

// Check if we can access the AuthContext
console.log('🔐 Checking AuthContext state...');

// Try to access the forceRefreshProfile function we added for debugging
if (typeof window.forceRefreshProfile === 'function') {
  console.log('✅ forceRefreshProfile function is available');
  console.log('🔄 Calling forceRefreshProfile to reload profile data...');
  window.forceRefreshProfile();
} else {
  console.log('❌ forceRefreshProfile function is not available');
}

// Check localStorage for any cached data
console.log('💾 Checking localStorage for cached data...');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('profile'))) {
    console.log('🔑 Found key:', key, 'Value:', localStorage.getItem(key));
  }
}

// Check sessionStorage for any cached data
console.log('💾 Checking sessionStorage for cached data...');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('profile'))) {
    console.log('🔑 Found key:', key, 'Value:', sessionStorage.getItem(key));
  }
}

// Try to manually fetch the profile
async function manualProfileFetch() {
  try {
    console.log('🔄 Manually fetching profile...');
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    console.log('👤 Current session:', session);
    
    if (session && session.user) {
      console.log('🆔 User ID:', session.user.id);
      console.log('📧 User Email:', session.user.email);
      
      // Try to fetch profile directly
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      console.log('📋 Direct profile fetch result:', { profile, error });
      
      // Also try fetching by email
      const { data: emailProfile, error: emailError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', session.user.email)
        .single();
        
      console.log('📧 Email profile fetch result:', { emailProfile, emailError });
    } else {
      console.log('❌ No active session found');
    }
  } catch (error) {
    console.error('❌ Manual profile fetch failed:', error);
  }
}

// Run the manual fetch
manualProfileFetch();

console.log('💡 Recommendations:');
console.log('1. Check browser console for detailed logs');
console.log('2. Look for "AuthContext: Profile loaded for user" messages');
console.log('3. Look for "AuthContext: isAdmin changed to:" messages');
console.log('4. Check if profile.role shows "super_admin"');
console.log('5. Try clearing browser cache and localStorage');
console.log('6. Try signing out and back in');