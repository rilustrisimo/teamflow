-- Configure auth settings to disable email confirmation for invitation-based signups
-- Since users are pre-verified through the invitation system, we don't need email confirmation

-- This needs to be done through Supabase Dashboard > Authentication > Settings
-- But we can create a trigger to auto-confirm users from invitations

CREATE OR REPLACE FUNCTION public.auto_confirm_invited_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this user has a pending invitation
    IF EXISTS (
        SELECT 1 FROM public.user_invitations 
        WHERE LOWER(email) = LOWER(NEW.email) 
        AND status = 'pending'
    ) THEN
        -- Auto-confirm the email for invited users
        NEW.email_confirmed_at = NOW();
        NEW.confirmed_at = NOW();
        
        RAISE LOG 'Auto-confirmed email for invited user: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm invited users
DROP TRIGGER IF EXISTS auto_confirm_invited_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_invited_users_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_invited_users();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.auto_confirm_invited_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_invited_users() TO service_role;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Created auto-confirmation trigger for invited users';
END $$;
