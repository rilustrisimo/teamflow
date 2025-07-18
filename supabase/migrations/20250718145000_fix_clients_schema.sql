-- Fix clients table schema to match the multi-tenant structure
-- The clients table should have company_id for multi-tenancy, not company column

-- First, let's check if the clients table exists and what columns it has
DO $$
BEGIN
    -- Check if clients table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'clients'
    ) THEN
        RAISE LOG 'Clients table exists, checking columns...';
        
        -- Check if company column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'company'
        ) THEN
            RAISE LOG 'Company column exists in clients table';
        ELSE
            RAISE LOG 'Company column does not exist in clients table';
        END IF;
        
        -- Check if company_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'company_id'
        ) THEN
            RAISE LOG 'Company_id column exists in clients table';
        ELSE
            RAISE LOG 'Company_id column does not exist in clients table';
            
            -- Add company_id column if it doesn't exist
            ALTER TABLE public.clients 
            ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
            
            RAISE LOG 'Added company_id column to clients table';
        END IF;
    ELSE
        RAISE LOG 'Clients table does not exist';
    END IF;
END $$;

-- Ensure the clients table has the correct structure
-- Add company_id column if it doesn't exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create a unique index on company_id and email for better performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Update RLS policies for clients table to use company_id
DROP POLICY IF EXISTS "Users can view clients in their company" ON public.clients;
CREATE POLICY "Users can view clients in their company" ON public.clients
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage clients in their company" ON public.clients;
CREATE POLICY "Users can manage clients in their company" ON public.clients
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed clients table schema for multi-tenant support';
END $$;
