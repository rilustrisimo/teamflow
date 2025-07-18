-- Create comprehensive user onboarding trigger
-- This handles both admin signups and invited users

CREATE OR REPLACE FUNCTION public.handle_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    user_role TEXT;
    company_name_val TEXT;
    user_full_name TEXT;
    hourly_rate_val NUMERIC;
    is_admin_signup BOOLEAN;
    existing_company_id UUID;
    current_user_company_id UUID;
    invitation_record RECORD;
BEGIN
    -- Get values from user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'team-member');
    company_name_val := NEW.raw_user_meta_data->>'company_name';
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    hourly_rate_val := (NEW.raw_user_meta_data->>'hourly_rate')::NUMERIC;
    is_admin_signup := (NEW.raw_user_meta_data->>'is_admin_signup')::BOOLEAN;
    
    -- Log the attempt for debugging
    RAISE LOG 'User onboarding trigger called for user: %, role: %, company: %, is_admin: %', 
              NEW.email, user_role, company_name_val, is_admin_signup;
    
    -- Check if this is an admin signup
    IF user_role = 'admin' AND is_admin_signup = true THEN
        
        -- Validate required data for admin signup
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
            
            -- Create profile
            INSERT INTO public.profiles (user_id, company_id, full_name, role, hourly_rate)
            VALUES (
                NEW.id,
                new_company_id,
                user_full_name,
                'admin',
                hourly_rate_val
            );
            
            RAISE LOG 'Admin profile created for user: %', NEW.id;
            
            -- Create user settings with company_id
            INSERT INTO public.user_settings (user_id, company_id)
            VALUES (NEW.id, new_company_id);
            
            RAISE LOG 'User settings created for user: % with company: %', NEW.id, new_company_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Error in admin signup: %', SQLERRM;
                RAISE EXCEPTION 'Admin signup failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        END;
        
    ELSE
        -- This is either a regular user creation or an invited user
        -- Check if there's an invitation for this email
        SELECT * INTO invitation_record 
        FROM public.user_invitations 
        WHERE email = NEW.email 
        AND status = 'pending' 
        LIMIT 1;
        
        IF invitation_record.id IS NOT NULL THEN
            -- This is an invited user
            RAISE LOG 'Processing invited user: % for company: %', NEW.email, invitation_record.company_id;
            
            -- Use invitation data to create profile
            INSERT INTO public.profiles (
                user_id, 
                company_id, 
                full_name, 
                role, 
                hourly_rate
            )
            VALUES (
                NEW.id,
                invitation_record.company_id,
                COALESCE(user_full_name, invitation_record.full_name),
                COALESCE(user_role, invitation_record.role),
                COALESCE(hourly_rate_val, invitation_record.hourly_rate)
            );
            
            -- Create user settings
            INSERT INTO public.user_settings (user_id, company_id)
            VALUES (NEW.id, invitation_record.company_id);
            
            -- Update invitation status
            UPDATE public.user_invitations 
            SET status = 'accepted', 
                accepted_at = NOW(),
                updated_at = NOW()
            WHERE id = invitation_record.id;
            
            RAISE LOG 'Invited user profile created for: %', NEW.id;
            
        ELSE
            -- This is a regular user creation (created by admin)
            -- Get the current user's company_id (the admin who created this user)
            SELECT company_id INTO current_user_company_id
            FROM public.profiles 
            WHERE user_id = auth.uid()
            LIMIT 1;
            
            -- If no company found, try to use the company from metadata
            IF current_user_company_id IS NULL AND company_name_val IS NOT NULL THEN
                SELECT id INTO existing_company_id
                FROM public.companies
                WHERE name = company_name_val
                LIMIT 1;
                
                current_user_company_id := existing_company_id;
            END IF;
            
            -- Create profile for regular user
            INSERT INTO public.profiles (
                user_id, 
                company_id, 
                full_name, 
                role, 
                hourly_rate
            )
            VALUES (
                NEW.id,
                current_user_company_id,
                user_full_name,
                user_role,
                hourly_rate_val
            );
            
            -- Create user settings
            INSERT INTO public.user_settings (user_id, company_id)
            VALUES (NEW.id, current_user_company_id);
            
            RAISE LOG 'Regular user profile created for: %', NEW.id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_onboarding();

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Created comprehensive user onboarding trigger';
END $$;
