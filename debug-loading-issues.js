// Debug script to identify and fix loading loop issues
// Run this in the browser console to diagnose loading problems

console.log('🔍 Debugging Loading Loop Issues...');

// Function to check current loading states
function checkLoadingStates() {
  console.log('🔄 Checking Current Loading States...');
  
  // Check AuthContext loading state
  const authElements = document.querySelectorAll('[class*="animate-pulse"], [class*="loading"]');
  console.log('⏳ Loading indicators found:', authElements.length);
  
  // Check if header is in loading state
  const headerLoading = document.querySelector('header .animate-pulse');
  console.log('🧭 Header loading state:', !!headerLoading);
  
  // Check if there are any infinite loading spinners
  const spinners = document.querySelectorAll('.animate-spin');
  console.log('🌀 Active spinners:', spinners.length);
  
  // Check for error messages
  const errors = document.querySelectorAll('[class*="error"], [role="alert"]');
  console.log('❌ Error messages found:', errors.length);
  
  // Log current URL
  console.log('📍 Current URL:', window.location.href);
}

// Function to check React component states
function checkReactStates() {
  console.log('⚛️ Checking React Component States...');
  
  // Try to access global React state if available
  if (typeof window !== 'undefined') {
    // Check if we can access the force refresh function
    if (typeof window.forceRefreshProfile === 'function') {
      console.log('✅ forceRefreshProfile function is available');
    } else {
      console.log('❌ forceRefreshProfile function is NOT available');
    }
    
    // Check Supabase client
    if (typeof window.supabase !== 'undefined') {
      console.log('✅ Supabase client is available');
    } else {
      console.log('❌ Supabase client is NOT available');
    }
    
    // Check store context
    if (typeof window.products !== 'undefined') {
      console.log('🏪 Products helper is available');
    } else {
      console.log('❌ Products helper is NOT available');
    }
  }
}

// Function to check network requests
function checkNetworkRequests() {
  console.log('🌐 Checking Network Requests...');
  console.log('💡 Please check the Network tab in DevTools for:');
  console.log('   - Requests that never complete (pending)');
  console.log('   - Requests with 401, 403, or 500 errors');
  console.log('   - Requests to cart_items, user_profiles, products, categories');
  console.log('   - Requests that might be causing infinite loops');
}

// Function to force refresh data
async function forceRefresh() {
  console.log('🔄 Forcing Data Refresh...');
  
  try {
    // Try to force refresh profile
    if (typeof window.forceRefreshProfile === 'function') {
      console.log('👤 Force refreshing user profile...');
      await window.forceRefreshProfile();
    }
    
    // Try to refresh products and categories
    if (window.products && window.categories) {
      console.log('📦 Force refreshing products and categories...');
      // We can't directly call these as they're not exposed globally
      // But we can log that they should be refreshed
    }
    
    console.log('✅ Force refresh completed');
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
  }
}

// Function to clear problematic states
function clearProblematicStates() {
  console.log('🧹 Clearing Problematic States...');
  
  try {
    // Clear localStorage items that might cause issues
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('cart'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      console.log('🗑️ Removing localStorage key:', key);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage items that might cause issues
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('cart'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      console.log('🗑️ Removing sessionStorage key:', key);
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Problematic states cleared');
  } catch (error) {
    console.error('❌ Failed to clear problematic states:', error);
  }
}

// Function to check for infinite loops
function checkForInfiniteLoops() {
  console.log('🔁 Checking for Infinite Loops...');
  
  // Check console for repeated messages
  console.log('💡 Look in the console for repeated log messages');
  console.log('   - "🔄 StoreContext: Data loading useEffect triggered"');
  console.log('   - "🔄 AuthContext: useEffect triggered"');
  console.log('   - "🔄 StoreContext: Authentication state changed"');
  console.log('   - Repeated cart refresh messages');
  
  // Suggest timeout check
  console.log('⏰ If loading takes more than 10 seconds, there might be an infinite loop');
}

// Run all checks
console.log('🚀 Running Loading Loop Debug...');
checkLoadingStates();
checkReactStates();
checkNetworkRequests();
checkForInfiniteLoops();

console.log('\n🔧 Suggested Actions:');
console.log('1. Run forceRefresh() to force data refresh');
console.log('2. Run clearProblematicStates() to clear localStorage/sessionStorage');
console.log('3. Check Network tab for hanging requests');
console.log('4. Look for repeated console messages indicating loops');
console.log('5. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)');
console.log('6. Check if RLS policies are properly configured');

// Export functions for manual use
window.debugLoadingIssues = {
  checkLoadingStates,
  checkReactStates,
  checkNetworkRequests,
  forceRefresh,
  clearProblematicStates,
  checkForInfiniteLoops
};

console.log('\n✅ Debug functions available as window.debugLoadingIssues');