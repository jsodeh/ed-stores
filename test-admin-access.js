// Quick test script to verify admin dashboard access
// Run this in browser console when signed in as admin

console.log('🧪 Testing Admin Access...');

// Check authentication state
const checkAuthState = () => {
  console.log('🔍 Current Auth State:', {
    localStorage_admin: localStorage.getItem('userIsAdmin'),
    localStorage_role: localStorage.getItem('userRole'),
    current_url: window.location.href,
    timestamp: new Date().toISOString()
  });
};

// Test navigation to admin dashboard
const testAdminNavigation = () => {
  console.log('🚀 Testing admin dashboard navigation...');
  
  // Clear any stuck states
  console.log('🧹 Clearing potentially stuck states...');
  
  // Navigate to admin dashboard
  console.log('📍 Navigating to /admin...');
  window.location.href = '/admin';
};

// Run tests
checkAuthState();

// Wait 2 seconds then test navigation
setTimeout(() => {
  console.log('⏰ Running navigation test...');
  testAdminNavigation();
}, 2000);

console.log('✅ Test script loaded. Check console for results.');
console.log('💡 If admin dashboard still loads infinitely, try:');
console.log('   1. Clear browser cache and cookies');
console.log('   2. Sign out and sign in again');
console.log('   3. Check browser console for error messages');