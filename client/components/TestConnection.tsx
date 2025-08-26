import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function TestConnection() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      // Test 1: Basic connection
      console.log('🔧 Testing Supabase connection...');
      
      // Test 2: Test RPC function directly
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_product_details');
      
      console.log('RPC Test Result:', { data: rpcData?.length, error: rpcError });
      
      // Test 3: Test categories table
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      console.log('Categories Test Result:', { data: catData?.length, error: catError });
      
      const results = [
        `✅ Connection: OK`,
        `📦 Products RPC: ${rpcError ? '❌ ' + rpcError.message : '✅ ' + (rpcData?.length || 0) + ' items'}`,
        `📂 Categories: ${catError ? '❌ ' + catError.message : '✅ ' + (catData?.length || 0) + ' items'}`,
      ];
      
      setTestResult(results.join('\n'));
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult('❌ Connection failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={testSupabaseConnection}
        disabled={isLoading}
        className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium disabled:opacity-50"
      >
        {isLoading ? '⏳' : '🔧'} Test API
      </button>
      
      {testResult && (
        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
          <h3 className="font-bold mb-2">API Test Results</h3>
          <pre className="text-xs whitespace-pre-wrap text-gray-700">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
}
