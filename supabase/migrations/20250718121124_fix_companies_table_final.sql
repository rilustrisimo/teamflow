-- Fix the companies table structure completely
-- This migration will properly add missing columns and create indexes

-- Add missing columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes only after columns exist
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON public.companies(admin_id);

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies table
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Company admins can manage their company" ON public.companies;
CREATE POLICY "Company admins can manage their company" ON public.companies
    FOR ALL USING (admin_id = auth.uid());

-- Create trigger for companies updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed companies table structure and added all necessary columns';
END $$;