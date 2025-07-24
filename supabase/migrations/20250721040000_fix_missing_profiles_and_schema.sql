-- Fix missing profiles and schema cache issues
-- Migration to resolve project creation foreign key constraints

-- First, refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Create missing profiles for admin users who don't have them
-- This fixes the foreign key constraint violation for projects.created_by
INSERT INTO public.profiles (id, full_name, company_id, role, created_at, updated_at)
SELECT 
    c.admin_id,
    'Admin User', -- Default name, can be updated later
    c.id,
    'admin',
    NOW(),
    NOW()
FROM public.companies c
WHERE c.admin_id IS NOT NULL
    AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = c.admin_id);

-- Ensure all required columns exist in projects table
-- Add due_date if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'due_date'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN due_date DATE;
    END IF;
END $$;

-- Add company_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'company_id'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure proper foreign key constraint for created_by
DO $$
BEGIN
    -- Drop existing constraint if it exists and recreate it properly
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_created_by_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects DROP CONSTRAINT projects_created_by_fkey;
    END IF;
    
    -- Add the correct foreign key constraint
    ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Final schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Log the fix
DO $$
DECLARE
    profile_count INTEGER;
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    
    RAISE NOTICE 'Migration completed successfully';
    RAISE NOTICE 'Total profiles: %', profile_count;
    RAISE NOTICE 'Admin profiles: %', admin_count;
END $$;
