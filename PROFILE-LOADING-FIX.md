# Profile Loading Fix

## Root Cause

The issue was in the profile loading mechanism in `client/lib/supabase.ts`. The functions were using `publicSupabase` (anon key client) instead of the authenticated `supabase` client to fetch user profiles.

This caused RLS policies to block access because:
1. `publicSupabase` uses the anon key which has no user context
2. RLS policies only allow users to access their own profile (`user_id = auth.uid()`)
3. Without user context, the query was blocked by RLS

## The Problem

In the original code:
```typescript
// Get user profile - WRONG: Using publicSupabase
getProfile: async (userId: string) => {
  const { data, error } = await publicSupabase  // ← This was the issue
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
},
```

## The Fix

Changed to use the authenticated `supabase` client:
```typescript
// Get user profile - CORRECT: Using authenticated supabase
getProfile: async (userId: string) => {
  const { data, error } = await supabase  // ← Fixed: Now using authenticated client
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
},
```

## Files Modified

1. `client/lib/supabase.ts` - Fixed three functions:
   - `profiles.getProfile`
   - `profiles.getProfileByEmail` 
   - `profiles.isAdmin`

## Verification

The fix can be verified by:
1. Signing in as `jsodeh@gmail.com`
2. Running `test-profile-fix.js` in the browser console
3. Checking that the profile loads successfully with `role: "super_admin"`
4. Confirming that `isAdmin` returns `true`

## Expected Results

After the fix:
- ✅ User profiles load correctly for authenticated users
- ✅ `isAdmin` correctly returns `true` for users with `admin` or `super_admin` roles
- ✅ No more RLS permission errors when loading profiles
- ✅ UserDebug component shows `Is Admin: Yes` for super_admin users
- ✅ Admin features appear immediately after login

## Why This Happened

The original implementation used `publicSupabase` for all read operations to avoid authentication issues, but this approach doesn't work for user-specific data like profiles because:

1. User profiles require authentication context to pass RLS checks
2. The anon key client has no user session
3. RLS policies correctly block access to other users' profiles

The fix maintains the performance benefits of the public client for truly public data (products, categories) while using the authenticated client for user-specific data (profiles, cart items, orders).