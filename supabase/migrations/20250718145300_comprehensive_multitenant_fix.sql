-- Comprehensive fix for multi-tenant database schema
-- This migration addresses all the issues with missing company_id columns and RLS policies

-- Create companies table if it doesn't exist
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

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id columns to all tables if they don't exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.task_checklist 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.task_comments 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.file_attachments 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON public.companies(admin_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);

CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company_id ON public.time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_company_id ON public.task_checklist(company_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_company_id ON public.task_comments(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_company_id ON public.invoice_items(company_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_company_id ON public.file_attachments(company_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_company_id ON public.user_settings(company_id);

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Company admins can manage their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view clients in their company" ON public.clients;
DROP POLICY IF EXISTS "Users can manage clients in their company" ON public.clients;
DROP POLICY IF EXISTS "Users can view projects in their company" ON public.projects;
DROP POLICY IF EXISTS "Users can manage projects in their company" ON public.projects;
DROP POLICY IF EXISTS "Users can view tasks in their company" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage tasks in their company" ON public.tasks;
DROP POLICY IF EXISTS "Users can view time_entries in their company" ON public.time_entries;
DROP POLICY IF EXISTS "Users can manage time_entries in their company" ON public.time_entries;

-- Create comprehensive RLS policies
-- Companies policies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company admins can manage their company" ON public.companies
    FOR ALL USING (admin_id = auth.uid());

-- Clients policies
CREATE POLICY "Users can view clients in their company" ON public.clients
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage clients in their company" ON public.clients
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Projects policies
CREATE POLICY "Users can view projects in their company" ON public.projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage projects in their company" ON public.projects
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Tasks policies
CREATE POLICY "Users can view tasks in their company" ON public.tasks
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tasks in their company" ON public.tasks
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Time entries policies
CREATE POLICY "Users can view time_entries in their company" ON public.time_entries
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage time_entries in their company" ON public.time_entries
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

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
    RAISE LOG 'Comprehensive multi-tenant schema fixes applied successfully';
END $$;
