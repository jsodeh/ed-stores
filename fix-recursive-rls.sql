-- This script fixes the infinite recursion issue with the user_profiles RLS policy.

-- 1. Drop all existing policies on the user_profiles table to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- 2. Create a new, non-recursive policy that allows authenticated users to view their own profile.
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Re-create the policy for updating profiles, which is also non-recursive.
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
