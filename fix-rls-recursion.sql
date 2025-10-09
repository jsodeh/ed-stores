-- Purpose: Fix the recursive RLS policy on user_profiles that prevents users from loading their own profile.
--
-- 1. Drop the problematic recursive policy.
DROP POLICY IF EXISTS "Users can view their own profile, and admins can view all" ON public.user_profiles;

-- 2. Create a simple, non-recursive policy for users to read their own profile.
-- This is the essential fix. A user must be able to read their own profile data.
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Create a separate policy for admins to view all profiles.
-- This relies on the get_my_role() function, but it will no longer cause a recursive loop for regular users.
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (get_my_role() IN ('admin', 'super_admin'));

-- 4. Ensure the update policy is still in place.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
