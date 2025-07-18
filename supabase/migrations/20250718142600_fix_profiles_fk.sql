-- Fix the profiles table foreign key constraint issue
-- The error suggests the id column has an incorrect foreign key constraint

-- 1. First, let's drop any incorrect foreign key constraints on the id column
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Find and drop any foreign key constraints on the profiles.id column
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.contype = 'f' 
            AND conrelid::regclass::text = 'profiles'
            AND a.attname = 'id'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
        RAISE LOG 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- 2. Make sure the id column is properly set up as a primary key
DO $$
BEGIN
    -- Ensure id column has the right structure
    ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
    
    -- Make sure it's a primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error setting up profiles.id: %', SQLERRM;
END $$;

-- 3. Create a simpler trigger that doesn't rely on explicit ID generation
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
            -- Create company first
            INSERT INTO public.companies (name, slug, admin_id)
            VALUES (
                company_name_val,
                LOWER(REPLACE(company_name_val, ' ', '-')),
                NEW.id
            )
            RETURNING id INTO new_company_id;
            
            RAISE LOG 'Company created with ID: %', new_company_id;
            
            -- Create profile (let the database generate the ID automatically)
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

-- Log completion in a DO block
DO $$ 
BEGIN
    RAISE LOG 'Fixed profiles table constraints and recreated admin signup trigger';
END $$;
