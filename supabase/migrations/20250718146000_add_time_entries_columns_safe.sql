-- Add missing columns to time_entries table only
-- This migration focuses only on adding the missing columns

-- Add missing columns to time_entries if they don't exist
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS date date,
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS description text;

-- Add missing company_id column if needed
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- Add index for company_id if column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'time_entries' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_time_entries_company_id ON public.time_entries(company_id);
    END IF;
END $$;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Added missing columns to time_entries table';
END $$;
