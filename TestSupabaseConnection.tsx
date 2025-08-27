// Test Component - Add this temporarily to debug the issue
// Save this as TestSupabaseConnection.tsx and import it in your main page

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function TestSupabaseConnection() {
  const [testResults, setTestResults] = useState<any[]>([]);

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    // Test 1: Basic connection
    addResult('Basic Connection', 'Testing...');
    try {
      const { data, error } = await supabase.from('categories').select('count', { count: 'exact' });
      addResult('Basic Connection', { success: true, count: data });
    } catch (error) {
      addResult('Basic Connection', { success: false, error: error.message });
    }

    // Test 2: Categories with RLS
    addResult('Categories Query', 'Testing...');
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);
      addResult('Categories Query', { 
        success: !error, 
        error: error?.message, 
        count: data?.length,
        data: data?.slice(0, 2) // First 2 items
      });
    } catch (error) {
      addResult('Categories Query', { success: false, error: error.message });
    }

    // Test 3: Products with RLS
    addResult('Products Query', 'Testing...');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      addResult('Products Query', { 
        success: !error, 
        error: error?.message, 
        count: data?.length,
        data: data?.slice(0, 1) // First item
      });
    } catch (error) {
      addResult('Products Query', { success: false, error: error.message });
    }

    // Test 4: Products with category join
    addResult('Products with Categories', 'Testing...');
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id, name, slug, color
          )
        `)
        .eq('is_active', true)
        .limit(2);
      addResult('Products with Categories', { 
        success: !error, 
        error: error?.message, 
        count: data?.length,
        sample: data?.[0] ? {
          name: data[0].name,
          category: data[0].categories?.name
        } : null
      });
    } catch (error) {
      addResult('Products with Categories', { success: false, error: error.message });
    }

    // Test 5: Environment variables
    addResult('Environment Check', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not set',
      supabaseKeyExists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      mode: import.meta.env.MODE
    });
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      maxHeight: '500px',
      overflow: 'auto',
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h3>Supabase Connection Test</h3>
      <button onClick={runTests} style={{ marginBottom: '10px', padding: '5px' }}>
        Re-run Tests
      </button>
      {testResults.map((result, index) => (
        <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
          <strong>{result.test}:</strong>
          <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
            {typeof result.result === 'string' 
              ? result.result 
              : JSON.stringify(result.result, null, 2)
            }
          </pre>
        </div>
      ))}
    </div>
  );
}