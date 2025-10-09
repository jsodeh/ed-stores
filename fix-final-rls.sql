-- 1. Create a function to get the current user's role, with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old, problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- 3. Create a new, non-recursive policy using the helper function
CREATE POLICY "Users can view their own profile, and admins can view all"
ON public.user_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR get_my_role() IN ('admin', 'super_admin')
);

-- 4. Re-create the update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
