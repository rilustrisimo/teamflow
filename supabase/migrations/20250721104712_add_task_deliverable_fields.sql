-- Add deliverable_link and video_link fields to tasks table if they don't exist
-- This migration ensures the schema cache is refreshed with the correct columns

DO $$ 
BEGIN
  -- Add deliverable_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'deliverable_link'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN deliverable_link text;
    RAISE LOG 'Added deliverable_link column to tasks table';
  ELSE
    RAISE LOG 'deliverable_link column already exists in tasks table';
  END IF;

  -- Add video_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'video_link'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN video_link text;
    RAISE LOG 'Added video_link column to tasks table';
  ELSE
    RAISE LOG 'video_link column already exists in tasks table';
  END IF;
END $$;

-- Force schema cache refresh by updating table comment
COMMENT ON TABLE public.tasks IS 'Task management table with deliverable tracking - Updated: 2025-01-21';

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Migration completed: add_task_deliverable_fields.sql';
END $$;
