# RLS Policy Fix for Authenticated User Access

## Problem Description
When users were not logged in (anonymous), products and categories displayed correctly. However, when users logged in and reloaded the site, it got stuck in a loading loop. This was caused by Row Level Security (RLS) policies that only granted access to the `public` role but not to `authenticated` users.

## Root Cause
The original RLS policies in [fix-rls-policies.sql](file:///Users/odehn/Documents/Judith/ed-stores/fix-rls-policies.sql) only granted access to:
- `public` role for anonymous users

But did not explicitly grant access to:
- `authenticated` role for logged-in users

When a user logs in, they get the `authenticated` role, but without explicit policies allowing access, Supabase blocks the queries, causing the loading loop.

## Solution
Created new RLS policies that explicitly grant access to both `public` and `authenticated` roles:

1. **For Categories:**
   - Allow public read access to active categories
   - Allow public read access to all categories
   - Allow authenticated read access to active categories
   - Allow authenticated read access to all categories

2. **For Products:**
   - Allow public read access to active products
   - Allow public read access to all products
   - Allow authenticated read access to active products
   - Allow authenticated read access to all products

## Files Modified
1. Created [fix-authenticated-access.sql](file:///Users/odehn/Documents/Judith/ed-stores/fix-authenticated-access.sql) - New SQL file with policies for authenticated users
2. Enhanced error handling in [client/lib/supabase.ts](file:///Users/odehn/Documents/Judith/ed-stores/client/lib/supabase.ts) - Better detection and reporting of permission errors
3. Enhanced error handling in [client/contexts/StoreContext.tsx](file:///Users/odehn/Documents/Judith/ed-stores/client/contexts/StoreContext.tsx) - Better user feedback for permission errors

## How to Apply the Fix
1. Execute the SQL in [fix-authenticated-access.sql](file:///Users/odehn/Documents/Judith/ed-stores/fix-authenticated-access.sql) in your Supabase SQL Editor
2. No code changes are required - the enhanced error handling is for better debugging

## Verification
After applying the fix:
1. Anonymous users should still be able to view products and categories
2. Authenticated users should be able to view products and categories after logging in
3. No more loading loops when reloading the site as an authenticated user

## Additional Notes
- The policies are permissive for read access but restrictive for write operations
- Both active and inactive items are accessible through separate policies
- The RLS policies can be further refined based on business requirements