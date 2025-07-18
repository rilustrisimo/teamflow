-- Create user_invitations table
-- This table stores invitation records for users to join companies

CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'team-member' CHECK (role IN ('admin', 'manager', 'team-member', 'client')),
    hourly_rate NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON public.user_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "user_invitations_select_company" ON public.user_invitations
    FOR SELECT USING (
        company_id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "user_invitations_insert_company" ON public.user_invitations
    FOR INSERT WITH CHECK (
        company_id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "user_invitations_update_company" ON public.user_invitations
    FOR UPDATE USING (
        company_id = public.get_user_company_id(auth.uid())
    );

CREATE POLICY "user_invitations_delete_company" ON public.user_invitations
    FOR DELETE USING (
        company_id = public.get_user_company_id(auth.uid())
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_invitations_updated_at
    BEFORE UPDATE ON public.user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_invitations_updated_at();

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Created user_invitations table with RLS policies';
END $$;
