-- Fix the admin signup trigger based on actual schema
-- This trigger will work with the existing table structure

-- 1. First, let's make sure we have the user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timezone VARCHAR DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    theme VARCHAR DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Make sure profiles table has the right columns
-- Add missing columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'member';

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- 3. Create the corrected admin signup trigger function
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    user_role TEXT;
    company_name_val TEXT;
    user_full_name TEXT;
BEGIN
    -- Get values from user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
    company_name_val := NEW.raw_user_meta_data->>'company_name';
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    
    -- Log the attempt for debugging
    RAISE LOG 'Admin signup trigger called for user: %, role: %, company: %', NEW.email, user_role, company_name_val;
    
    -- Only handle admin signups
    IF user_role = 'admin' AND NEW.raw_user_meta_data->>'is_admin_signup' = 'true' THEN
        
        -- Validate required data
        IF company_name_val IS NULL OR company_name_val = '' THEN
            RAISE EXCEPTION 'Company name is required for admin signup';
        END IF;
        
        IF user_full_name IS NULL OR user_full_name = '' THEN
            RAISE EXCEPTION 'Full name is required for admin signup';
        END IF;
        
        BEGIN
            -- Create company first (using the actual schema structure)
            INSERT INTO public.companies (name, slug, admin_id)
            VALUES (
                company_name_val,
                LOWER(REPLACE(company_name_val, ' ', '-')),
                NEW.id
            )
            RETURNING id INTO new_company_id;
            
            RAISE LOG 'Company created with ID: %', new_company_id;
            
            -- Create profile
            INSERT INTO public.profiles (user_id, company_id, full_name, role)
            VALUES (
                NEW.id,
                new_company_id,
                user_full_name,
                'admin'
            );
            
            RAISE LOG 'Profile created for user: %', NEW.id;
            
            -- Create user settings
            INSERT INTO public.user_settings (user_id)
            VALUES (NEW.id);
            
            RAISE LOG 'User settings created for user: %', NEW.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Log the error details
                RAISE LOG 'Error in admin signup trigger: %', SQLERRM;
                RAISE EXCEPTION 'Admin signup failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        END;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_admin_user();

-- 5. Enable RLS and create basic policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for user_settings if it doesn't exist
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (user_id = auth.uid());

-- Log completion using a DO block
DO $$ 
BEGIN
    RAISE LOG 'Admin signup trigger setup completed successfully';
END $$;
