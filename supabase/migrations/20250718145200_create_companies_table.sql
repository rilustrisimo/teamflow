-- Create companies table if it doesn't exist
-- This is the core table for multi-tenant support

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON public.companies(admin_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);

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

-- Create trigger for updated_at
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
    RAISE LOG 'Created companies table with proper structure and RLS policies';
END $$;
