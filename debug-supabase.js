// Debug script - Run this in browser console to test Supabase connection
// Copy and paste this entire script in the browser console

console.log('🔍 Testing Supabase connection and data...');

// Test 1: Check categories table directly
console.log('\n=== Testing Categories ===');
const { createClient } = supabaseJs;
const supabaseUrl = 'https://isgqdllaunoydbjweiwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTc2MDcsImV4cCI6MjA1MzA5MzYwN30.O-w9MXPBBpMcWXUrH5dGqaorZNFzJ2jKi2LuGKmnXps';

const debugSupabase = createClient(supabaseUrl, supabaseKey);

// Test categories
debugSupabase.from('categories').select('*').then(result => {
  console.log('📁 Categories result:', result);
  if (result.error) {
    console.error('❌ Categories error:', result.error);
  } else {
    console.log(`✅ Found ${result.data?.length || 0} categories`);
    if (result.data?.length > 0) {
      console.log('📋 First category:', result.data[0]);
    }
  }
});

// Test products
debugSupabase.from('products').select('*').then(result => {
  console.log('📦 Products result:', result);
  if (result.error) {
    console.error('❌ Products error:', result.error);
  } else {
    console.log(`✅ Found ${result.data?.length || 0} products`);
    if (result.data?.length > 0) {
      console.log('📋 First product:', result.data[0]);
    }
  }
});

// Test product_details view
debugSupabase.from('product_details').select('*').then(result => {
  console.log('📊 Product details view result:', result);
  if (result.error) {
    console.error('❌ Product details error:', result.error);
  } else {
    console.log(`✅ Found ${result.data?.length || 0} product details`);
    if (result.data?.length > 0) {
      console.log('📋 First product detail:', result.data[0]);
    }
  }
});

console.log('🕐 Wait a moment for results...');