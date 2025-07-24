-- Final fix for task status constraint issue
-- This migration ensures the task_status enum has the correct values
-- and the UI can work properly with them

DO $$
BEGIN
    -- The original enum was created with 'inprogress' (no underscore)
    -- Let's check what values actually exist and add any missing ones
    
    -- Ensure all required enum values exist
    BEGIN
        -- Add 'todo' if it doesn't exist (should already exist)
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'todo';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        -- Add 'inprogress' if it doesn't exist (should already exist)
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'inprogress';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        -- Add 'review' if it doesn't exist (should already exist)
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'review';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        -- Add 'done' if it doesn't exist (should already exist)
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'done';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    RAISE LOG 'Ensured all task_status enum values exist: todo, inprogress, review, done';
    
    -- Verify the tasks table can use these values properly
    -- Update any invalid status values to 'todo'
    UPDATE public.tasks 
    SET status = 'todo'::task_status 
    WHERE status::text NOT IN ('todo', 'inprogress', 'review', 'done');
    
    RAISE LOG 'Updated any invalid task status values to todo';
    
END $$;

-- Add a comment to track this fix
COMMENT ON TYPE task_status IS 'Task status enum - values: todo, inprogress, review, done (updated 2025-07-21)';

-- Log successful completion
SELECT 'Task status enum fix completed successfully' as status;
