-- This script reverts the RLS policy on user_profiles to a known stable state.

-- 1. Drop all existing policies on the user_profiles table.
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile, and admins can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- 2. Create a simple policy that allows authenticated users to view their own profile.
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
