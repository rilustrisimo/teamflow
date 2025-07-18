-- Fix infinite recursion in profiles RLS policy - Clean approach
-- Drop ALL existing policies first, then recreate them properly

-- 1. Drop ALL policies from all tables to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies from companies table
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'companies'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.companies';
    END LOOP;
    
    -- Drop all policies from profiles table
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop all policies from user_settings table
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_settings'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.user_settings';
    END LOOP;
    
    RAISE LOG 'Dropped all existing RLS policies';
END $$;

-- 2. Create a helper function that doesn't cause recursion
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

-- 3. Create clean, non-recursive RLS policies

-- Companies policies
CREATE POLICY "companies_select_own" ON public.companies
    FOR SELECT USING (
        id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "companies_insert_signup" ON public.companies
    FOR INSERT WITH CHECK (true); -- Allow during signup

CREATE POLICY "companies_update_own" ON public.companies
    FOR UPDATE USING (
        id = public.get_user_company_id(auth.uid())
    );

-- Profiles policies - simple and direct
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_select_company" ON public.profiles
    FOR SELECT USING (
        company_id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "profiles_insert_signup" ON public.profiles
    FOR INSERT WITH CHECK (true); -- Allow during signup

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

-- User settings policies
CREATE POLICY "user_settings_all_own" ON public.user_settings
    FOR ALL USING (user_id = auth.uid());

-- 4. Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Successfully created clean RLS policies without recursion';
END $$;
