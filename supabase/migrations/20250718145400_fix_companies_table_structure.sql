-- Check the actual structure of the companies table and fix it
-- This migration will add any missing columns to the companies table

-- Check current structure and add missing columns
DO $$
BEGIN
    -- Check if is_active column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE LOG 'Added is_active column to companies table';
    END IF;
    
    -- Check if subscription_plan column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));
        RAISE LOG 'Added subscription_plan column to companies table';
    END IF;
    
    -- Check if max_users column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'max_users'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN max_users INTEGER DEFAULT 10;
        RAISE LOG 'Added max_users column to companies table';
    END IF;
    
    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE LOG 'Added updated_at column to companies table';
    END IF;
END $$;

-- Now create the indexes safely
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON public.companies(admin_id);

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed companies table structure';
END $$;
