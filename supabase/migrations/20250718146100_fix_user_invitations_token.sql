-- Fix user_invitations table token column issue
-- This migration addresses the NOT NULL constraint on token column

-- First, check if there's a token column and make it nullable or add a default
DO $$
BEGIN
    -- Check if token column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_invitations' 
        AND column_name = 'token'
    ) THEN
        -- Make token column nullable
        ALTER TABLE public.user_invitations ALTER COLUMN token DROP NOT NULL;
        RAISE LOG 'Made token column nullable in user_invitations table';
    END IF;
    
    -- Check if invitation_token column exists and add it if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_invitations' 
        AND column_name = 'invitation_token'
    ) THEN
        -- Add invitation_token column with default value
        ALTER TABLE public.user_invitations ADD COLUMN invitation_token TEXT DEFAULT gen_random_uuid()::text;
        RAISE LOG 'Added invitation_token column to user_invitations table';
    END IF;
END $$;
