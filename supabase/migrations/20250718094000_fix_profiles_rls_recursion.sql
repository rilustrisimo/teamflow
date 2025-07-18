-- Fix infinite recursion in profiles RLS policy
-- The issue is that the profiles policy is trying to query the profiles table from within itself

-- 1. Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;

-- 2. Create a simple function to get user's company_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM public.profiles 
        WHERE user_id = user_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create non-recursive RLS policies

-- Companies policies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "Admins can insert companies" ON public.companies
    FOR INSERT WITH CHECK (true); -- Allow during signup

CREATE POLICY "Admins can update their company" ON public.companies
    FOR UPDATE USING (
        id = public.get_user_company_id(auth.uid())
    );

-- Profiles policies - avoid recursion by using direct user_id check
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in same company" ON public.profiles
    FOR SELECT USING (
        company_id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "Allow profile creation during signup" ON public.profiles
    FOR INSERT WITH CHECK (true); -- Allow during signup

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (user_id = auth.uid());

-- 4. Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed profiles RLS infinite recursion by creating non-recursive policies';
END $$;
