// RLS Debug Script - Run this in browser console
// This will test different approaches to access your data

console.log('🔍 RLS Debug Test Starting...');

// Get the supabase client from the app
const testSupabase = window.supabase || (() => {
  console.log('Creating new Supabase client...');
  return supabaseJs.createClient(
    'https://isgqdllaunoydbjweiwo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTc2MDcsImV4cCI6MjA1MzA5MzYwN30.O-w9MXPBBpMcWXUrH5dGqaorZNFzJ2jKi2LuGKmnXps'
  );
})();

async function runRLSTests() {
  console.log('\n=== Testing Authentication State ===');
  const { data: { session }, error: sessionError } = await testSupabase.auth.getSession();
  console.log('Current session:', session ? 'Authenticated' : 'Anonymous');
  console.log('User:', session?.user?.email || 'None');
  
  console.log('\n=== Test 1: Categories without filters ===');
  const categoriesTest1 = await testSupabase
    .from('categories')
    .select('*');
  console.log('Categories (no filter):', categoriesTest1);
  
  console.log('\n=== Test 2: Categories with is_active filter ===');
  const categoriesTest2 = await testSupabase
    .from('categories')
    .select('*')
    .eq('is_active', true);
  console.log('Categories (is_active=true):', categoriesTest2);
  
  console.log('\n=== Test 3: Products without filters ===');
  const productsTest1 = await testSupabase
    .from('products')
    .select('*')
    .limit(3);
  console.log('Products (no filter):', productsTest1);
  
  console.log('\n=== Test 4: Products with is_active filter ===');
  const productsTest2 = await testSupabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .limit(3);
  console.log('Products (is_active=true):', productsTest2);
  
  console.log('\n=== Test 5: Product_details view ===');
  const viewTest = await testSupabase
    .from('product_details')
    .select('*')
    .limit(3);
  console.log('Product_details view:', viewTest);
  
  console.log('\n=== Test 6: Manual RLS bypass attempt ===');
  // Try using the service role (if available) or check if anon role has proper permissions
  const bypassTest = await testSupabase.rpc('get_public_products').catch(err => {
    console.log('RPC function not available (expected)');
    return { error: 'No RPC function' };
  });
  
  console.log('\n=== Summary ===');
  console.log('If all tests show 401 errors, your RLS policies need to be updated.');
  console.log('Categories should be publicly readable.');
  console.log('Products should be publicly readable when is_active=true.');
}

runRLSTests().catch(console.error);