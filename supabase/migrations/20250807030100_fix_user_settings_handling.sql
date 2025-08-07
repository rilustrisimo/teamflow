-- Additional fix for user_settings insertion
-- Sometimes the user_settings table might not exist or have issues
-- This migration adds a safer user_settings creation in the trigger

CREATE OR REPLACE FUNCTION public.handle_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    user_role TEXT;
    company_name_val TEXT;
    user_full_name TEXT;
    hourly_rate_val NUMERIC;
    is_admin_signup BOOLEAN;
    admin_company_id UUID;
    metadata_company_id UUID;
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
    admin_company_id := (NEW.raw_user_meta_data->>'admin_company_id')::UUID;
    metadata_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
    
    -- Log the attempt for debugging
    RAISE LOG 'User onboarding trigger called for user: %, email: %, role: %, company: %, is_admin: %, metadata_company_id: %', 
              NEW.id, NEW.email, user_role, company_name_val, is_admin_signup, metadata_company_id;
    
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
            
            -- Create user settings with company_id (with error handling)
            BEGIN
                INSERT INTO public.user_settings (user_id, company_id)
                VALUES (NEW.id, new_company_id);
                RAISE LOG 'User settings created for user: % with company: %', NEW.id, new_company_id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE LOG 'Warning: Could not create user settings for user %: %', NEW.id, SQLERRM;
                    -- Don't fail the entire signup process if user_settings fails
            END;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Error in admin signup: %', SQLERRM;
                RAISE EXCEPTION 'Admin signup failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        END;
        
    ELSE
        -- This is either a regular user creation or an invited user
        
        -- First, check if we have company_id in metadata (from invitation acceptance)
        IF metadata_company_id IS NOT NULL THEN
            -- This is likely from an invitation acceptance
            RAISE LOG 'Using company_id from metadata: % for user: %', metadata_company_id, NEW.email;
            current_user_company_id := metadata_company_id;
            
            -- Try to find and update the invitation record
            SELECT * INTO invitation_record 
            FROM public.user_invitations 
            WHERE LOWER(email) = LOWER(NEW.email) 
            AND company_id = metadata_company_id
            AND status = 'pending' 
            ORDER BY created_at DESC
            LIMIT 1;
            
            IF invitation_record.id IS NOT NULL THEN
                -- Update invitation status
                UPDATE public.user_invitations 
                SET status = 'accepted', 
                    accepted_at = NOW(),
                    updated_at = NOW()
                WHERE id = invitation_record.id;
                
                RAISE LOG 'Updated invitation record: % for user: %', invitation_record.id, NEW.email;
                
                -- Use invitation data if metadata is incomplete
                user_full_name := COALESCE(user_full_name, invitation_record.full_name);
                user_role := COALESCE(user_role, invitation_record.role);
                hourly_rate_val := COALESCE(hourly_rate_val, invitation_record.hourly_rate);
            END IF;
            
        ELSE
            -- Check for invitation by email (fallback method)
            SELECT * INTO invitation_record 
            FROM public.user_invitations 
            WHERE LOWER(email) = LOWER(NEW.email) 
            AND status = 'pending' 
            ORDER BY created_at DESC
            LIMIT 1;
            
            IF invitation_record.id IS NOT NULL THEN
                -- This is an invited user
                RAISE LOG 'Processing invited user: % for company: %', NEW.email, invitation_record.company_id;
                current_user_company_id := invitation_record.company_id;
                
                -- Use invitation data
                user_full_name := COALESCE(user_full_name, invitation_record.full_name);
                user_role := COALESCE(user_role, invitation_record.role);
                hourly_rate_val := COALESCE(hourly_rate_val, invitation_record.hourly_rate);
                
                -- Update invitation status
                UPDATE public.user_invitations 
                SET status = 'accepted', 
                    accepted_at = NOW(),
                    updated_at = NOW()
                WHERE id = invitation_record.id;
                
            ELSE
                -- This is a regular user creation (created by admin)
                -- First try to use the admin_company_id from metadata
                IF admin_company_id IS NOT NULL THEN
                    current_user_company_id := admin_company_id;
                    RAISE LOG 'Using admin_company_id from metadata: %', admin_company_id;
                ELSE
                    -- Fallback: Get the current user's company_id (the admin who created this user)
                    SELECT company_id INTO current_user_company_id
                    FROM public.profiles 
                    WHERE user_id = auth.uid()
                    LIMIT 1;
                    
                    -- If no company found, try to use the company from metadata
                    IF current_user_company_id IS NULL AND company_name_val IS NOT NULL THEN
                        SELECT id INTO existing_company_id
                        FROM public.companies
                        WHERE LOWER(name) = LOWER(company_name_val)
                        LIMIT 1;
                        
                        current_user_company_id := existing_company_id;
                    END IF;
                END IF;
            END IF;
        END IF;
        
        -- Validate that we have a company_id
        IF current_user_company_id IS NULL THEN
            RAISE LOG 'Cannot determine company for user creation. metadata_company_id: %, admin_company_id: %, invitation found: %, auth.uid: %', 
                      metadata_company_id, admin_company_id, (invitation_record.id IS NOT NULL), auth.uid();
            RAISE EXCEPTION 'Cannot determine company for user creation. Please check invitation or admin setup.';
        END IF;
        
        -- Create profile for user
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
        
        -- Create user settings with better error handling
        BEGIN
            INSERT INTO public.user_settings (user_id, company_id)
            VALUES (NEW.id, current_user_company_id);
            RAISE LOG 'User settings created for: % with company: %', NEW.id, current_user_company_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Warning: Could not create user settings for user %: %', NEW.id, SQLERRM;
                -- Try without company_id if the column doesn't exist
                BEGIN
                    INSERT INTO public.user_settings (user_id)
                    VALUES (NEW.id);
                    RAISE LOG 'User settings created without company_id for: %', NEW.id;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE LOG 'Warning: Could not create user settings at all for user %: %', NEW.id, SQLERRM;
                        -- Don't fail the entire process if user_settings creation fails
                END;
        END;
        
        RAISE LOG 'User profile created for: % with company: %, role: %', NEW.id, current_user_company_id, user_role;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_user_onboarding for user %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'User onboarding failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_onboarding();

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Updated invitation trigger with better error handling for user_settings';
END $$;
