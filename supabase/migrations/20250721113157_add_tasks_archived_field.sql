-- Add archived field to tasks table to support archiving functionality

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create an index for better performance when filtering archived tasks
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(archived);

-- Add a comment for documentation
COMMENT ON COLUMN public.tasks.archived IS 'Flag to indicate if a task is archived. Archived tasks are hidden from normal views but can be accessed in archive section.';
