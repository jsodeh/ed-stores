// Final debug script to identify user profile and admin status issues
// Run this in the browser console while signed in as jsodeh@gmail.com

console.log('🔍 Final Debug for User Profile and Admin Status');

// Function to check detailed profile information
async function checkDetailedProfile() {
  console.log('📋 Checking Detailed Profile Information...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.log('🚪 No active session');
      return;
    }
    
    console.log('📱 Session User:', session.user);
    
    // Check profile by ID
    console.log('🆔 Checking profile by ID...');
    const { data: profileById, error: idError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (idError) {
      console.error('❌ Profile by ID Error:', idError);
    } else {
      console.log('📄 Profile by ID:', profileById);
      console.log('🔑 Profile by ID Role Check:', {
        role: profileById.role,
        type: typeof profileById.role,
        isAdmin: profileById.role === 'admin' || profileById.role === 'super_admin',
        isSuperAdmin: profileById.role === 'super_admin'
      });
    }
    
    // Check profile by email
    console.log('📧 Checking profile by email...');
    const { data: profileByEmail, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', session.user.email)
      .single();
      
    if (emailError) {
      console.error('❌ Profile by Email Error:', emailError);
    } else {
      console.log('📧 Profile by Email:', profileByEmail);
      console.log('🔑 Profile by Email Role Check:', {
        role: profileByEmail.role,
        type: typeof profileByEmail.role,
        isAdmin: profileByEmail.role === 'admin' || profileByEmail.role === 'super_admin',
        isSuperAdmin: profileByEmail.role === 'super_admin'
      });
    }
    
    // Check if we can access the React context
    console.log('⚛️ Checking React Context Access...');
    if (typeof useAuth !== 'undefined') {
      console.log('✅ useAuth hook is available');
      // Note: We can't call hooks outside of React components
    } else {
      console.log('❌ useAuth hook is not directly accessible');
    }
    
  } catch (error) {
    console.error('❌ Detailed Profile Check Error:', error);
  }
}

// Function to check all localStorage and sessionStorage items
function checkAllStorage() {
  console.log('💾 Checking All Storage Items...');
  
  console.log('📱 localStorage items:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log('   🔑', key, ':', value.substring(0, 100) + (value.length > 100 ? '...' : ''));
  }
  
  console.log('🖥️ sessionStorage items:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    console.log('   🔑', key, ':', value.substring(0, 100) + (value.length > 100 ? '...' : ''));
  }
}

// Function to check network requests
function checkNetworkRequests() {
  console.log('🌐 Network Request Check:');
  console.log('💡 Please check the Network tab in DevTools for:');
  console.log('   - Requests to user_profiles table');
  console.log('   - Any 401, 403, or permission errors');
  console.log('   - Successful profile fetch requests');
}

// Function to try manual isAdmin check
async function manualIsAdminCheck() {
  console.log('🔐 Manual isAdmin Check...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && session.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
        console.log('📋 Manual isAdmin Result:', {
          userId: session.user.id,
          role: profile.role,
          isAdmin: isAdmin,
          isSuperAdmin: profile.role === 'super_admin'
        });
      }
    }
  } catch (error) {
    console.error('❌ Manual isAdmin Check Error:', error);
  }
}

// Run all checks
console.log('🚀 Running Final Debug...');
checkDetailedProfile();
checkAllStorage();
checkNetworkRequests();
manualIsAdminCheck();

console.log('💡 Final Recommendations:');
console.log('1. Check browser console for detailed logs');
console.log('2. Look for "AuthContext: Profile loaded for user" messages');
console.log('3. Look for "AuthContext: isAdmin changed to:" messages');
console.log('4. Check if profile.role shows "super_admin"');
console.log('5. Check Network tab for any failed requests to user_profiles');
console.log('6. If issues persist, try:');
console.log('   a. Clearing browser cache and localStorage');
console.log('   b. Signing out and back in');
console.log('   c. Checking if the profile is being loaded correctly in AuthContext');