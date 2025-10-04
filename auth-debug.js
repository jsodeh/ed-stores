// Authentication and Data Debug Script
// Run this in browser console after signing in to diagnose the issue

console.log('🔍 Starting Auth and Data Debug...');

async function debugAuthAndData() {
  console.log('\n=== AUTHENTICATION DEBUG ===');
  
  // Check if supabase is available
  if (!window.supabase) {
    console.error('❌ Supabase client not found on window');
    return;
  }
  
  console.log('✅ Supabase client found');
  
  // Check current session
  const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
  console.log('🔐 Session status:', session ? 'Authenticated' : 'Not authenticated');
  if (session) {
    console.log('👤 User ID:', session.user?.id);
    console.log('📧 User email:', session.user?.email);
  }
  if (sessionError) {
    console.error('❌ Session error:', sessionError);
  }
  
  console.log('\n=== DATA ACCESS DEBUG ===');
  
  // Test 1: Try with publicSupabase (guest mode client)
  console.log('🧪 Test 1: Using publicSupabase client...');
  try {
    const publicTest = await window.publicSupabase
      .from('products')
      .select('id, name, is_active')
      .limit(2);
    console.log('📦 Public products result:', publicTest);
  } catch (err) {
    console.error('❌ Public products error:', err);
  }
  
  // Test 2: Try with authenticated supabase client
  console.log('\n🧪 Test 2: Using authenticated supabase client...');
  try {
    const authTest = await window.supabase
      .from('products')
      .select('id, name, is_active')
      .limit(2);
    console.log('📦 Auth products result:', authTest);
  } catch (err) {
    console.error('❌ Auth products error:', err);
  }
  
  // Test 3: Categories with publicSupabase
  console.log('\n🧪 Test 3: Categories with publicSupabase...');
  try {
    const publicCatTest = await window.publicSupabase
      .from('categories')
      .select('id, name, is_active')
      .limit(2);
    console.log('📁 Public categories result:', publicCatTest);
  } catch (err) {
    console.error('❌ Public categories error:', err);
  }
  
  // Test 4: Categories with authenticated supabase
  console.log('\n🧪 Test 4: Categories with authenticated supabase...');
  try {
    const authCatTest = await window.supabase
      .from('categories')
      .select('id, name, is_active')
      .limit(2);
    console.log('📁 Auth categories result:', authCatTest);
  } catch (err) {
    console.error('❌ Auth categories error:', err);
  }
  
  // Test 5: User-specific data (cart, favorites, profile)
  if (session) {
    console.log('\n🧪 Test 5: User-specific data...');
    
    // Test cart
    try {
      const cartTest = await window.supabase
        .from('cart_items')
        .select('id, product_id, quantity')
        .eq('user_id', session.user.id)
        .limit(2);
      console.log('🛒 Cart items result:', cartTest);
    } catch (err) {
      console.error('❌ Cart items error:', err);
    }
    
    // Test favorites
    try {
      const favTest = await window.supabase
        .from('favorites')
        .select('id, product_id')
        .eq('user_id', session.user.id)
        .limit(2);
      console.log('❤️ Favorites result:', favTest);
    } catch (err) {
      console.error('❌ Favorites error:', err);
    }
    
    // Test profile
    try {
      const profileTest = await window.supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', session.user.id);
      console.log('👤 Profile result:', profileTest);
    } catch (err) {
      console.error('❌ Profile error:', err);
    }
  }
  
  console.log('\n=== DEBUG SUMMARY ===');
  console.log('🔍 Look for:');
  console.log('  - 401/403 errors (authentication/permission issues)');
  console.log('  - Empty data arrays (policies filtering out all data)');
  console.log('  - Network errors (connection issues)');
  console.log('  - Differences between publicSupabase and supabase results');
}

// Run the debug function
debugAuthAndData().catch(console.error);