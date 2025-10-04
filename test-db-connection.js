import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://isgqdllaunoydbjweiwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjU1NTIsImV4cCI6MjA2MzM0MTU1Mn0.nNq2iCvo26pxl52ijsiU0B6kYqzvNLJSRHJE-5NZ_70';

console.log('🔧 Testing Supabase connection...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testing basic connection with simple query...');
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Basic connection test failed:', error);
      return;
    }
    
    console.log('✅ Basic connection test passed');
    console.log('📦 Data:', data);
    
    console.log('🔍 Testing categories query...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError);
      return;
    }
    
    console.log('✅ Categories query passed');
    console.log('📦 Categories data:', categoriesData);
    
    console.log('🔍 Testing product_details view query...');
    const { data: productDetailsData, error: productDetailsError } = await supabase
      .from('product_details')
      .select('*')
      .limit(5);
    
    if (productDetailsError) {
      console.error('❌ Product details view query failed:', productDetailsError);
      return;
    }
    
    console.log('✅ Product details view query passed');
    console.log('📦 Product details data:', productDetailsData);
  } catch (err) {
    console.error('❌ Test connection error:', err);
  }
}

testConnection();