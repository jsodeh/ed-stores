# Storage Setup Guide for Product Images

## Current Status ✅ COMPLETED

Based on your Supabase dashboard and policy verification:
- ✅ `product-images` bucket created and configured as public
- ✅ Storage policies successfully applied
- ✅ Both admin-specific and general policies are active
- ✅ Public read access configured for customer viewing
- ✅ Admin upload/update/delete permissions configured

## Policy Status Analysis

Your current policies provide **dual-level access**:
1. **Admin-specific policies**: Restrict operations to admin/super_admin users only
2. **General authenticated policies**: Allow any authenticated user

**Recommendation**: Keep only admin-specific policies for better security.

## Step 1: Clean Up Policies (Optional but Recommended)

Since you have both general and admin-specific policies, run `cleanup-storage-policies.sql` to keep only admin-specific ones:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `cleanup-storage-policies.sql`
3. Click "Run" to remove redundant policies

This will ensure only admin users can manage product images while maintaining public read access.

## Step 2: Policies Already Applied ✅

Your verification shows these active policies:
- **admin_upload_product_images**: Only admins can upload
- **admin_update_product_images**: Only admins can update
- **admin_delete_product_images**: Only admins can delete
- **Allow public read access to product images**: Everyone can view

## Step 3: Test Image Upload

1. Sign in as an admin user
2. Go to Admin → Products
3. Edit a product or create a new one
4. Try uploading an image
5. The image should upload successfully and appear immediately in the product list

## Troubleshooting

### If Upload Still Fails:

1. **Check Console Logs**: Look for specific error messages in browser console
2. **Verify Policies**: Run this query in SQL Editor to confirm policies exist:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'objects' AND schemaname = 'storage'
   AND (qual LIKE '%product-images%' OR with_check LIKE '%product-images%');
   ```
3. **Check User Authentication**: Ensure you're signed in as an authenticated user
4. **Fallback Option**: Use the manual image URL input field if upload fails

### Common Error Messages:

- **"row-level security policy"** → Policies not applied, run the SQL script
- **"duplicate"** → File already exists, the app will auto-retry with new name
- **"permission denied"** → User not authenticated or policies incorrect

## Expected Behavior After Setup

- ✅ Admin users can upload product images through the form
- ✅ Images appear immediately in the product list after upload
- ✅ Public users can view product images on the store
- ✅ Graceful error handling with fallback to manual URL input
- ✅ Cache-busting ensures updated images display immediately

## Files Updated

1. `setup-storage-policies.sql` - Complete storage policies
2. `client/components/admin/ProductForm.tsx` - Simplified upload logic
3. `client/pages/admin/Products.tsx` - Enhanced refresh mechanism
4. `client/contexts/AuthContext.tsx` - Fixed admin button persistence

## Security Notes

- Only authenticated users can upload/modify images
- Public read access allows customers to view product images
- File names are randomized to prevent conflicts
- 5MB file size limit enforced by validation

Run the storage policies script and your image upload functionality should work perfectly!