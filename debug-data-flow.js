// Complete Data Flow Debug Script
// Run this in browser console to test the entire data pipeline

console.log('🔍 Starting Complete Data Flow Debug...');

async function debugDataFlow() {
  console.log('\n=== 1. Testing Raw Supabase Connection ===');
  
  // Test 1: Raw supabase client
  const rawSupabase = window.supabase;
  if (!rawSupabase) {
    console.error('❌ Supabase client not available on window');
    return;
  }
  
  console.log('✅ Supabase client found');
  
  // Test 2: Check authentication
  console.log('\n=== 2. Authentication Status ===');
  const { data: { session } } = await rawSupabase.auth.getSession();
  console.log('🔐 Session:', session ? 'Authenticated' : 'Anonymous');
  if (session) {
    console.log('👤 User:', session.user?.email);
  }
  
  // Test 3: Direct table queries
  console.log('\n=== 3. Direct Table Queries ===');
  
  console.log('🔍 Testing categories table...');
  const categoriesResult = await rawSupabase
    .from('categories')
    .select('*')
    .limit(5);
  console.log('📁 Categories Result:', categoriesResult);
  
  console.log('🔍 Testing products table...');
  const productsResult = await rawSupabase
    .from('products')
    .select('*')
    .limit(5);
  console.log('📦 Products Result:', productsResult);
  
  // Test 4: App wrapper functions
  console.log('\n=== 4. App Wrapper Functions ===');
  
  if (window.categories && window.categories.getAll) {
    console.log('🔍 Testing app categories.getAll()...');
    try {
      const appCategoriesResult = await window.categories.getAll();
      console.log('📁 App Categories Result:', appCategoriesResult);
    } catch (err) {
      console.error('❌ App categories error:', err);
    }
  }
  
  if (window.products && window.products.getAll) {
    console.log('🔍 Testing app products.getAll()...');
    try {
      const appProductsResult = await window.products.getAll();
      console.log('📦 App Products Result:', appProductsResult);
    } catch (err) {
      console.error('❌ App products error:', err);
    }
  }
  
  // Test 5: Check React Context State
  console.log('\n=== 5. React Context State ===');
  
  // Try to access React context data
  if (window.React) {
    console.log('⚛️ React is available');
    // Note: We can't directly access context from console, but we can check if the hooks are working
  }
  
  // Test 6: Database content verification
  console.log('\n=== 6. Database Content Check ===');
  
  console.log('🔍 Checking if database has data...');
  const categoriesCount = await rawSupabase
    .from('categories')
    .select('id', { count: 'exact', head: true });
  console.log('📊 Categories count:', categoriesCount);
  
  const productsCount = await rawSupabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  console.log('📊 Products count:', productsCount);
  
  // Test 7: RLS Policy Check
  console.log('\n=== 7. RLS Policy Verification ===');
  
  console.log('🔍 Testing with different filters...');
  
  // Test with is_active filter
  const activeProducts = await rawSupabase
    .from('products')
    .select('id, name, is_active')
    .eq('is_active', true)
    .limit(3);
  console.log('🎯 Active products test:', activeProducts);
  
  // Test without filters
  const allProducts = await rawSupabase
    .from('products')
    .select('id, name, is_active')
    .limit(3);
  console.log('🎯 All products test:', allProducts);
  
  console.log('\n=== Debug Summary ===');
  console.log('✅ Check each section above for errors');
  console.log('🔍 Look for 401 errors, empty data arrays, or exception messages');
  console.log('📊 If data exists but app shows empty, the issue is in React state management');
  console.log('🔐 If queries fail, the issue is with RLS policies or authentication');
}

// Helper function to inspect current app state
function inspectAppState() {
  console.log('\n=== Current App State Inspection ===');
  
  // Try to get store context data from DOM
  const storeElement = document.querySelector('[data-store-context]');
  if (storeElement) {
    console.log('🏪 Store context element found');
  }
  
  // Check for loading indicators
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="skeleton"], [class*="animate-pulse"]');
  console.log('⏳ Loading elements found:', loadingElements.length);
  
  // Check for error messages
  const errorElements = document.querySelectorAll('[class*="error"], [role="alert"]');
  console.log('❌ Error elements found:', errorElements.length);
  
  // Check if products container exists
  const productsContainer = document.querySelector('[class*="grid"], [class*="product"]');
  console.log('📦 Products container found:', !!productsContainer);
  
  // Check for "No products found" message
  const noProductsMessage = document.querySelector('h2:has-text("No products found"), [text*="No products"]');
  console.log('📭 "No products" message visible:', !!noProductsMessage);
}

// Run all tests
debugDataFlow().then(() => {
  inspectAppState();
  console.log('\n🔍 Data flow debug completed! Check results above.');
}).catch(console.error);