-- This script provides a final, simplified RLS policy for user_profiles to prevent recursion.

-- 1. Drop all existing policies on the user_profiles table to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile, and admins can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- 2. Create a single, non-recursive policy for authenticated users to view and update their own profile.
CREATE POLICY "Users can manage their own profile"
ON public.user_profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
