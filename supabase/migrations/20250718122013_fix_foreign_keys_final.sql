-- Fix foreign key relationships for proper table joins
-- This migration ensures foreign keys reference the correct columns

-- Drop existing foreign keys first
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Add correct foreign key constraints
-- time_entries.user_id should reference profiles.id
ALTER TABLE public.time_entries 
ADD CONSTRAINT time_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- tasks.assigned_to should reference profiles.id
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Fixed critical foreign key relationships for time_entries and tasks';
END $$;