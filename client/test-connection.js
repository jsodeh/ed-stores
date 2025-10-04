import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase connection...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 API Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

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
    
    console.log('🔍 Testing full products query...');
    const { data: fullData, error: fullError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (fullError) {
      console.error('❌ Full products query failed:', fullError);
      return;
    }
    
    console.log('✅ Full products query passed');
    console.log('📦 Full data count:', fullData?.length);
    console.log('📦 First item:', fullData?.[0]);
  } catch (err) {
    console.error('❌ Test connection error:', err);
  }
}

testConnection();