// Test Supabase connection
// Run this in your browser console to test the connection

console.log('🧪 Testing Supabase connection...');

// Test basic connection
async function testSupabaseConnection() {
  try {
    console.log('1️⃣ Testing basic Supabase connection...');
    
    // Test if supabase is available
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase client is available');
    } else {
      console.log('❌ Supabase client not found');
      return;
    }
    
    // Test simple query
    console.log('2️⃣ Testing simple products query...');
    const { data, error } = await window.supabase
      .from('products')
      .select('id, name')
      .limit(5);
    
    if (error) {
      console.error('❌ Products query failed:', error);
    } else {
      console.log('✅ Products query succeeded:', data?.length, 'items');
      console.log('Sample data:', data);
    }
    
    // Test categories query
    console.log('3️⃣ Testing simple categories query...');
    const { data: catData, error: catError } = await window.supabase
      .from('categories')
      .select('id, name')
      .limit(5);
    
    if (catError) {
      console.error('❌ Categories query failed:', catError);
    } else {
      console.log('✅ Categories query succeeded:', catData?.length, 'items');
      console.log('Sample data:', catData);
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
  }
}

// Run the test
testSupabaseConnection();
