-- Fix the profiles table schema and trigger
-- The issue is that the id column doesn't have a proper default value

-- 1. Check and fix the profiles table structure
DO $$ 
BEGIN
    -- Make sure the id column has a default value
    ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Could not set default for profiles.id: %', SQLERRM;
END $$;

-- 2. Also check if we need to fix other profile-related queries
-- Let's see the actual structure to understand the issue
DO $$
DECLARE
    col_info RECORD;
BEGIN
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE LOG 'profiles.%: % (nullable: %, default: %)', 
            col_info.column_name, 
            col_info.data_type, 
            col_info.is_nullable,
            COALESCE(col_info.column_default, 'none');
    END LOOP;
END $$;

-- 3. Update the trigger to explicitly provide an ID if needed
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    user_role TEXT;
    company_name_val TEXT;
    user_full_name TEXT;
    new_profile_id UUID;
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
            
            -- Generate a new UUID for the profile
            new_profile_id := gen_random_uuid();
            
            -- Create profile with explicit ID
            INSERT INTO public.profiles (id, user_id, company_id, full_name, role)
            VALUES (
                new_profile_id,
                NEW.id,
                new_company_id,
                user_full_name,
                'admin'
            );
            
            RAISE LOG 'Profile created with ID: % for user: %', new_profile_id, NEW.id;
            
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

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed admin signup trigger - now explicitly generating profile IDs';
END $$;
