-- Create RLS policies for task_checklist and task_comments tables
-- to ensure proper multi-tenant filtering

-- Enable RLS on task_checklist and task_comments if not already enabled
ALTER TABLE public.task_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "task_checklist_company_access" ON public.task_checklist;
DROP POLICY IF EXISTS "task_comments_company_access" ON public.task_comments;

-- Create policies for task_checklist
CREATE POLICY "task_checklist_company_access" ON public.task_checklist
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        company_id = public.get_user_company_id(auth.uid())
    );

-- Create policies for task_comments
CREATE POLICY "task_comments_company_access" ON public.task_comments
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        company_id = public.get_user_company_id(auth.uid())
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('task_checklist', 'task_comments');
