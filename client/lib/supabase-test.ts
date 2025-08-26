import { createClient } from '@supabase/supabase-js';

// Test the connection with explicit values
const supabaseUrl = 'https://isgqdllaunoydbjweiwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTc2MDcsImV4cCI6MjA1MzA5MzYwN30.O-w9MXPBBpMcWXUrH5dGqaorZNFzJ2jKi2LuGKmnXps';

const testClient = createClient(supabaseUrl, supabaseAnonKey);

export const directTest = async () => {
  console.log('🧪 Direct Supabase Test Starting...');
  
  try {
    // Test 1: Basic health check
    console.log('Test 1: Basic connection');
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('Health check status:', healthCheck.status);
    
    // Test 2: Categories
    console.log('Test 2: Categories table');
    const { data: categories, error: catError } = await testClient
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .limit(3);
    
    console.log('Categories result:', { categories, catError });
    
    // Test 3: RPC function
    console.log('Test 3: RPC function');
    const { data: products, error: prodError } = await testClient
      .rpc('get_product_details');
    
    console.log('Products RPC result:', { 
      count: products?.length, 
      error: prodError,
      sample: products?.[0] 
    });
    
    return {
      health: healthCheck.status,
      categories: { count: categories?.length, error: catError },
      products: { count: products?.length, error: prodError }
    };
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
    return { error };
  }
};

// Auto-run in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  setTimeout(() => {
    directTest();
  }, 2000);
}
