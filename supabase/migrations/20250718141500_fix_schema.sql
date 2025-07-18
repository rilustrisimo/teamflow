-- Fix missing columns and add trigger for admin signup

-- 1. Add missing columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'client'));

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
END $$;

-- 2. Add missing columns to user_settings if they don't exist
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint on user_id for user_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_settings_user_id_key' 
        AND table_name = 'user_settings'
    ) THEN
        ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Create admin signup trigger function
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    user_role TEXT;
BEGIN
    -- Get the role from user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
    
    -- Only handle admin signups
    IF user_role = 'admin' AND NEW.raw_user_meta_data->>'is_admin_signup' = 'true' THEN
        -- Create company first
        INSERT INTO public.companies (name, slug)
        VALUES (
            NEW.raw_user_meta_data->>'company_name',
            LOWER(REPLACE(NEW.raw_user_meta_data->>'company_name', ' ', '-'))
        )
        RETURNING id INTO new_company_id;
        
        -- Create profile
        INSERT INTO public.profiles (user_id, company_id, full_name, role)
        VALUES (
            NEW.id,
            new_company_id,
            NEW.raw_user_meta_data->>'full_name',
            'admin'
        );
        
        -- Create user settings
        INSERT INTO public.user_settings (user_id)
        VALUES (NEW.id);
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_admin_user();
