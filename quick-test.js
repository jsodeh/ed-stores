// Quick Test Script - Run this in browser console
// This will test if the RLS policies are working correctly

console.log('🧪 Quick RLS Test Starting...');

// Use the existing supabase client from the app
const testClient = window.supabase;

async function quickTest() {
  console.log('\n=== Testing Current Setup ===');
  
  // Test 1: Simple categories query
  console.log('🔍 Testing categories...');
  const categoriesResult = await testClient
    .from('categories')
    .select('id, name, slug, is_active')
    .limit(5);
  
  console.log('📁 Categories Result:', categoriesResult);
  
  if (categoriesResult.error) {
    console.error('❌ Categories Error:', categoriesResult.error);
  } else {
    console.log(`✅ Categories Success: ${categoriesResult.data?.length || 0} found`);
    console.log('📋 Sample category:', categoriesResult.data?.[0]);
  }
  
  // Test 2: Simple products query
  console.log('\n🔍 Testing products...');
  const productsResult = await testClient
    .from('products')
    .select('id, name, price, is_active, category_id')
    .limit(5);
  
  console.log('📦 Products Result:', productsResult);
  
  if (productsResult.error) {
    console.error('❌ Products Error:', productsResult.error);
  } else {
    console.log(`✅ Products Success: ${productsResult.data?.length || 0} found`);
    console.log('📋 Sample product:', productsResult.data?.[0]);
  }
  
  // Test 3: Check authentication status
  console.log('\n🔐 Checking auth status...');
  const { data: { session } } = await testClient.auth.getSession();
  console.log('Auth Session:', session ? 'Authenticated' : 'Anonymous');
  if (session) {
    console.log('User:', session.user?.email);
  }
  
  // Test 4: Test the app's functions directly
  console.log('\n🎯 Testing app functions...');
  if (window.products && window.products.getAll) {
    try {
      const appProductsResult = await window.products.getAll();
      console.log('🎯 App products.getAll():', appProductsResult);
    } catch (err) {
      console.error('❌ App products error:', err);
    }
  } else {
    console.log('⚠️ App products functions not available in window');
  }
  
  console.log('\n=== Test Complete ===');
}

quickTest().catch(console.error);