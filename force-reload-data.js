// Force reload data script
// Run this in your browser console while signed in

console.log('🔄 Force reloading data...');

// Check if we can access the StoreContext
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('✅ React DevTools available');
} else {
  console.log('❌ React DevTools not available');
}

// Try to trigger a page reload to force data loading
console.log('🔄 Reloading page to force data loading...');
window.location.reload();
