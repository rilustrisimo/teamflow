-- Fix multi-tenant schema for tasks and time_entries tables
-- Ensure all tables have proper company_id columns and RLS policies

-- Fix tasks table
DO $$
BEGIN
    -- Check if tasks table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tasks'
    ) THEN
        RAISE LOG 'Tasks table exists, checking columns...';
        
        -- Check if company_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'company_id'
        ) THEN
            RAISE LOG 'Company_id column exists in tasks table';
        ELSE
            RAISE LOG 'Company_id column does not exist in tasks table';
            
            -- Add company_id column if it doesn't exist
            ALTER TABLE public.tasks 
            ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
            
            RAISE LOG 'Added company_id column to tasks table';
        END IF;
    ELSE
        RAISE LOG 'Tasks table does not exist';
    END IF;
END $$;

-- Fix time_entries table
DO $$
BEGIN
    -- Check if time_entries table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'time_entries'
    ) THEN
        RAISE LOG 'Time_entries table exists, checking columns...';
        
        -- Check if company_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'company_id'
        ) THEN
            RAISE LOG 'Company_id column exists in time_entries table';
        ELSE
            RAISE LOG 'Company_id column does not exist in time_entries table';
            
            -- Add company_id column if it doesn't exist
            ALTER TABLE public.time_entries 
            ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
            
            RAISE LOG 'Added company_id column to time_entries table';
        END IF;
    ELSE
        RAISE LOG 'Time_entries table does not exist';
    END IF;
END $$;

-- Fix projects table
DO $$
BEGIN
    -- Check if projects table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) THEN
        RAISE LOG 'Projects table exists, checking columns...';
        
        -- Check if company_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'company_id'
        ) THEN
            RAISE LOG 'Company_id column exists in projects table';
        ELSE
            RAISE LOG 'Company_id column does not exist in projects table';
            
            -- Add company_id column if it doesn't exist
            ALTER TABLE public.projects 
            ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
            
            RAISE LOG 'Added company_id column to projects table';
        END IF;
    ELSE
        RAISE LOG 'Projects table does not exist';
    END IF;
END $$;

-- Add company_id columns to all tables if they don't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company_id ON public.time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);

-- Update RLS policies for tasks table
DROP POLICY IF EXISTS "Users can view tasks in their company" ON public.tasks;
CREATE POLICY "Users can view tasks in their company" ON public.tasks
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage tasks in their company" ON public.tasks;
CREATE POLICY "Users can manage tasks in their company" ON public.tasks
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Update RLS policies for time_entries table
DROP POLICY IF EXISTS "Users can view time_entries in their company" ON public.time_entries;
CREATE POLICY "Users can view time_entries in their company" ON public.time_entries
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage time_entries in their company" ON public.time_entries;
CREATE POLICY "Users can manage time_entries in their company" ON public.time_entries
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Update RLS policies for projects table
DROP POLICY IF EXISTS "Users can view projects in their company" ON public.projects;
CREATE POLICY "Users can view projects in their company" ON public.projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage projects in their company" ON public.projects;
CREATE POLICY "Users can manage projects in their company" ON public.projects
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed multi-tenant schema for tasks, time_entries, and projects tables';
END $$;
