-- Fix foreign key relationships for proper table joins
-- This migration ensures all tables have proper foreign key relationships

-- First, let's ensure all tables have the proper foreign key constraints
-- Add missing foreign key constraints

-- Add foreign keys to time_entries table
DO $$
BEGIN
    -- Add foreign key for user_id in time_entries -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_entries_user_id_fkey' 
        AND table_name = 'time_entries'
    ) THEN
        ALTER TABLE public.time_entries 
        ADD CONSTRAINT time_entries_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for project_id in time_entries -> projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_entries_project_id_fkey' 
        AND table_name = 'time_entries'
    ) THEN
        ALTER TABLE public.time_entries 
        ADD CONSTRAINT time_entries_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for task_id in time_entries -> tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_entries_task_id_fkey' 
        AND table_name = 'time_entries'
    ) THEN
        ALTER TABLE public.time_entries 
        ADD CONSTRAINT time_entries_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding foreign keys to time_entries: %', SQLERRM;
END $$;

-- Add foreign keys to tasks table
DO $$
BEGIN
    -- Add foreign key for assigned_to in tasks -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_assigned_to_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key for project_id in tasks -> projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_project_id_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for created_by in tasks -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_created_by_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding foreign keys to tasks: %', SQLERRM;
END $$;

-- Add foreign keys to task_comments table
DO $$
BEGIN
    -- Add foreign key for task_id in task_comments -> tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_comments_task_id_fkey' 
        AND table_name = 'task_comments'
    ) THEN
        ALTER TABLE public.task_comments 
        ADD CONSTRAINT task_comments_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for author_id in task_comments -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_comments_author_id_fkey' 
        AND table_name = 'task_comments'
    ) THEN
        ALTER TABLE public.task_comments 
        ADD CONSTRAINT task_comments_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding foreign keys to task_comments: %', SQLERRM;
END $$;

-- Add foreign keys to task_checklist table
DO $$
BEGIN
    -- Add foreign key for task_id in task_checklist -> tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_checklist_task_id_fkey' 
        AND table_name = 'task_checklist'
    ) THEN
        ALTER TABLE public.task_checklist 
        ADD CONSTRAINT task_checklist_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding foreign keys to task_checklist: %', SQLERRM;
END $$;

-- Add foreign keys to projects table
DO $$
BEGIN
    -- Add foreign key for client_id in projects -> clients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_client_id_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for created_by in projects -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_created_by_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding foreign keys to projects: %', SQLERRM;
END $$;

-- Add foreign keys to clients table
DO $$
BEGIN
    -- Add foreign key for created_by in clients -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clients_created_by_fkey' 
        AND table_name = 'clients'
    ) THEN
        ALTER TABLE public.clients 
        ADD CONSTRAINT clients_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding foreign keys to clients: %', SQLERRM;
END $$;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed foreign key relationships for proper table joins';
END $$;
