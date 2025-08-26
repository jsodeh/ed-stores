import { supabase, products, categories } from './supabase';

export const testAPI = async () => {
  console.log('🔧 Testing API connections...');
  
  try {
    // Test Supabase connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('🔑 Auth status:', authError ? 'Error' : 'Connected');
    if (authError) console.error('Auth error:', authError);
    
    // Test categories
    console.log('📂 Testing categories...');
    const { data: categoriesData, error: categoriesError } = await categories.getAll();
    console.log('📂 Categories result:', {
      success: !categoriesError,
      count: categoriesData?.length || 0,
      error: categoriesError
    });
    
    // Test products
    console.log('📦 Testing products...');
    const { data: productsData, error: productsError } = await products.getAll();
    console.log('📦 Products result:', {
      success: !productsError,
      count: productsData?.length || 0,
      error: productsError
    });
    
    return {
      categories: { data: categoriesData, error: categoriesError },
      products: { data: productsData, error: productsError }
    };
  } catch (error) {
    console.error('🚨 API Test failed:', error);
    return { error };
  }
};

// Auto-test on import in development
if (import.meta.env.DEV) {
  setTimeout(() => testAPI(), 1000);
}
