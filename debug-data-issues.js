// Debug script to help identify data issues
// Add this to your browser console to debug the data loading

console.log('🔍 Debugging StoreContext Data Issues...');

// Check if StoreContext is available
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('✅ React DevTools available');
} else {
  console.log('❌ React DevTools not available');
}

// Check localStorage for guest cart
const guestCart = localStorage.getItem('guestCart');
console.log('🛒 Guest cart in localStorage:', guestCart ? JSON.parse(guestCart) : 'None');

// Check if there are any network errors
console.log('🌐 Check Network tab for failed requests');

// Manual data fetch test
async function testDataFetch() {
  try {
    console.log('🧪 Testing manual data fetch...');
    
    // Test products fetch
    const productsResponse = await fetch('/api/products');
    console.log('📦 Products API response:', productsResponse.status);
    
    // Test categories fetch  
    const categoriesResponse = await fetch('/api/categories');
    console.log('📂 Categories API response:', categoriesResponse.status);
    
  } catch (error) {
    console.error('❌ Manual fetch test failed:', error);
  }
}

// Run the test
testDataFetch();

console.log('💡 If you see 500 errors in Network tab, the RLS policies need to be fixed');
console.log('💡 If you see 200 responses but no data, check the data transformation logic');
