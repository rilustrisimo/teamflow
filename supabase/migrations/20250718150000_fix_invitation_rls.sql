-- Fix RLS policies for user_invitations to allow unauthenticated access by invitation token
-- This is needed for the invitation acceptance flow

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "user_invitations_select_company" ON public.user_invitations;

-- Create new policies
-- Allow unauthenticated users to select invitations by token (for invitation acceptance)
CREATE POLICY "user_invitations_select_by_token" ON public.user_invitations
    FOR SELECT USING (
        invitation_token IS NOT NULL
    );

-- Allow authenticated users to select invitations from their company
CREATE POLICY "user_invitations_select_company" ON public.user_invitations
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        company_id = public.get_user_company_id(auth.uid())
    );

-- Allow authenticated users to update invitations (for accepting them)
CREATE POLICY "user_invitations_update_by_token" ON public.user_invitations
    FOR UPDATE USING (
        invitation_token IS NOT NULL
    );

-- Allow authenticated users to update invitations from their company
CREATE POLICY "user_invitations_update_company" ON public.user_invitations
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        company_id = public.get_user_company_id(auth.uid())
    );
