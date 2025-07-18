-- Fix the user_settings insertion to include company_id
-- The trigger needs to pass the company_id when creating user_settings

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
            
            -- Create user settings with company_id
            INSERT INTO public.user_settings (user_id, company_id)
            VALUES (NEW.id, new_company_id);
            
            RAISE LOG 'User settings created for user: % with company: %', NEW.id, new_company_id;
            
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

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed user_settings insertion to include company_id';
END $$;
