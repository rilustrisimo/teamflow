-- Fix expires_at column constraint in user_invitations table
-- This migration addresses the NOT NULL constraint issue

DO $$
BEGIN
    -- Check if expires_at column exists and update its default
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_invitations' 
        AND column_name = 'expires_at'
    ) THEN
        -- Add default value for expires_at column
        ALTER TABLE public.user_invitations 
        ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');
        
        -- Update any existing NULL values
        UPDATE public.user_invitations 
        SET expires_at = (NOW() + INTERVAL '7 days') 
        WHERE expires_at IS NULL;
        
        RAISE LOG 'Updated expires_at column in user_invitations table';
    END IF;
END $$;
