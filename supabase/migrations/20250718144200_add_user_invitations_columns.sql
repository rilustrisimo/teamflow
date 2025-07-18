-- Add missing columns to user_invitations table

-- Add missing columns if they don't exist
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Unknown';

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'team-member' CHECK (role IN ('admin', 'manager', 'team-member', 'client'));

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Added missing columns to user_invitations table';
END $$;
