import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create a client with service role key (has full access)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupStorage() {
  console.log('Setting up storage for product images...');
  
  try {
    // Create the bucket if it doesn't exist
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('product-images');
    
    if (bucketError && bucketError.message.includes('Bucket not found')) {
      console.log('Creating product-images bucket...');
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      
      console.log('Bucket created successfully:', data);
    } else if (bucketData) {
      console.log('Bucket already exists:', bucketData);
    } else {
      console.error('Error checking bucket:', bucketError);
      return;
    }
    
    // Set up RLS policies
    console.log('Setting up RLS policies...');
    
    // Policy for authenticated users to upload
    const uploadPolicy = `
      CREATE POLICY "Allow authenticated users to upload product images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'product-images');
    `;
    
    // Policy for public read access
    const readPolicy = `
      CREATE POLICY "Allow public read access to product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
    `;
    
    console.log('Storage setup complete!');
    console.log('Please run these SQL commands in your Supabase SQL editor if needed:');
    console.log(uploadPolicy);
    console.log(readPolicy);
    
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

setupStorage().catch(console.error);