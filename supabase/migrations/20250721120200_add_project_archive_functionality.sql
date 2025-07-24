-- Add archived functionality to projects table
-- When a project is archived, all its tasks should also be archived automatically

-- Add archived column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for archived projects for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_archived ON public.projects(archived) WHERE archived = TRUE;

-- Create a trigger function that archives all tasks when a project is archived
CREATE OR REPLACE FUNCTION archive_project_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- If the project is being archived (changed from false/null to true)
    IF NEW.archived = TRUE AND (OLD.archived = FALSE OR OLD.archived IS NULL) THEN
        -- Archive all tasks associated with this project
        UPDATE public.tasks 
        SET archived = TRUE, updated_at = NOW()
        WHERE project_id = NEW.id AND archived = FALSE;
        
        RAISE LOG 'Archived % tasks for project %', 
            (SELECT COUNT(*) FROM public.tasks WHERE project_id = NEW.id AND archived = TRUE), 
            NEW.id;
    END IF;
    
    -- If the project is being unarchived (changed from true to false)
    IF NEW.archived = FALSE AND OLD.archived = TRUE THEN
        -- Unarchive all tasks associated with this project
        UPDATE public.tasks 
        SET archived = FALSE, updated_at = NOW()
        WHERE project_id = NEW.id AND archived = TRUE;
        
        RAISE LOG 'Unarchived % tasks for project %', 
            (SELECT COUNT(*) FROM public.tasks WHERE project_id = NEW.id AND archived = FALSE), 
            NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_archive_project_tasks ON public.projects;
CREATE TRIGGER trigger_archive_project_tasks
    AFTER UPDATE OF archived ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION archive_project_tasks();

-- Add RLS policy for archived projects (users can only see projects from their company)
-- This policy should already exist, but let's make sure it handles archived field
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Add comment for documentation
COMMENT ON COLUMN public.projects.archived IS 'When TRUE, the project and all its tasks are archived';
COMMENT ON FUNCTION archive_project_tasks() IS 'Automatically archives/unarchives all tasks when a project is archived/unarchived';
COMMENT ON TRIGGER trigger_archive_project_tasks ON public.projects IS 'Triggers archiving of tasks when project archived status changes';
