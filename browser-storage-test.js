// Browser console test script for storage functionality
// Copy and paste this in your browser's developer console

console.log('🔍 Testing Supabase storage functionality...');

// Test storage access
async function testStorage() {
  try {
    console.log('1. Testing storage bucket access...');
    
    // List buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Bucket listing error:', bucketError);
    } else {
      console.log('✅ Buckets found:', buckets);
      
      // Check if product-images bucket exists
      const productImagesBucket = buckets.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('✅ product-images bucket exists:', productImagesBucket);
      } else {
        console.log('⚠️ product-images bucket not found');
      }
    }
    
    console.log('2. Testing public URL generation...');
    
    // Try to generate a public URL (this doesn't require the file to exist)
    const testFileName = `test-${Date.now()}.jpg`;
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(testFileName);
    
    console.log('✅ Public URL generated:', publicUrl);
    
    console.log('3. Storage test completed');
    console.log('💡 If you want to test actual upload, select a small image file and run the upload test function');
    
  } catch (error) {
    console.error('❌ Storage test error:', error);
  }
}

// Test actual upload (requires a file)
async function testUpload(file) {
  if (!file) {
    console.log('Please provide a file. Usage: testUpload(yourFile)');
    return;
  }
  
  try {
    console.log('Starting upload test...', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });
    
    const fileName = `test-${Date.now()}-${file.name}`;
    
    console.log('Uploading file...');
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      return;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('✅ Public URL:', publicUrl);
    
    // Clean up - delete the test file
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([fileName]);
    
    if (deleteError) {
      console.log('⚠️ Could not delete test file:', deleteError.message);
    } else {
      console.log('🧹 Test file deleted successfully');
    }
    
  } catch (error) {
    console.error('❌ Upload test error:', error);
  }
}

// Run the basic test
testStorage();

// To test upload, you would call:
// testUpload(yourFileObject)
// where yourFileObject is a File object from an <input type="file"> element

console.log('🔧 Test functions available:');
console.log('- testStorage(): Test basic storage functionality');
console.log('- testUpload(file): Test file upload (pass a File object)');