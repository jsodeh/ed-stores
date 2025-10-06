// Test storage setup
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create a client with service role key (has full access)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testStorageSetup() {
  console.log('🔍 Testing storage setup...\n');
  
  try {
    // 1. Check if the bucket exists
    console.log('1. Checking if product-images bucket exists...');
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('product-images');
    
    if (bucketError) {
      console.log('❌ Bucket error:', bucketError.message);
      if (bucketError.message.includes('Bucket not found')) {
        console.log('   Creating bucket...');
        const { data, error } = await supabase.storage.createBucket('product-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/*']
        });
        
        if (error) {
          console.error('   Error creating bucket:', error);
          return;
        }
        
        console.log('   ✅ Bucket created successfully:', data);
      }
    } else {
      console.log('   ✅ Bucket exists:', bucketData);
    }
    
    // 2. List all buckets
    console.log('\n2. Listing all storage buckets...');
    const { data: allBuckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.log('❌ Error listing buckets:', listError);
    } else {
      console.log('   Available buckets:');
      allBuckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
    // 3. Check policies
    console.log('\n3. Checking storage policies...');
    // This would normally be done via SQL, but we can at least verify access
    
    // 4. Try to upload a test file
    console.log('\n4. Testing file upload...');
    // Create a simple SVG image for testing
    const testSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="lightblue"/>
      <text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" dy=".3em">Test</text>
    </svg>`;
    const testFileName = `test-${Date.now()}.svg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFileName, testSvgContent, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      // Check if it's a policy issue
      if (uploadError.message.includes('denied') || uploadError.message.includes('permission')) {
        console.log('   🔐 This might be a policy/permission issue');
      }
    } else {
      console.log('   ✅ Upload test successful:', uploadData);
      
      // Try to get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(testFileName);
      
      console.log('   Public URL:', publicUrl);
      
      // Clean up - delete the test file
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([testFileName]);
      
      if (deleteError) {
        console.log('   ⚠️  Could not delete test file:', deleteError.message);
      } else {
        console.log('   🧹 Test file deleted successfully');
      }
    }
    
    console.log('\n✅ Storage setup test completed');
    
  } catch (error) {
    console.error('❌ Error during storage setup test:', error);
  }
}

testStorageSetup().catch(console.error);