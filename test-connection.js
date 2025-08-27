// Test Supabase Connection - Run this in browser console
// 1. First test the basic connection and data availability

console.log('🔍 Testing Supabase connection...');

// Test if we can access the global supabase instance
if (window.supabase) {
  console.log('✅ Supabase client found');
  
  // Test categories
  window.supabase.from('categories').select('*').eq('is_active', true).then(result => {
    console.log('📁 Categories test:', result);
    if (result.error) {
      console.error('❌ Categories error:', result.error);
    } else {
      console.log(`✅ Found ${result.data?.length || 0} categories`);
      console.log('📋 Categories data:', result.data);
    }
  });
  
  // Test products
  window.supabase.from('products').select('*').eq('is_active', true).limit(5).then(result => {
    console.log('📦 Products test:', result);
    if (result.error) {
      console.error('❌ Products error:', result.error);
    } else {
      console.log(`✅ Found ${result.data?.length || 0} products`);
      console.log('📋 Products data:', result.data);
    }
  });
  
} else {
  console.error('❌ Supabase client not found in window object');
  console.log('Available globals:', Object.keys(window).filter(k => k.includes('supabase') || k.includes('Supabase')));
}