-- Remove the problematic tasks_status_check constraint
-- The enum type itself provides the constraint, so we don't need a separate check constraint

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Check if the constraint exists and remove it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_status_check' 
            AND table_name = 'tasks' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks DROP CONSTRAINT tasks_status_check;
        RAISE LOG 'Removed tasks_status_check constraint';
    ELSE
        RAISE LOG 'tasks_status_check constraint does not exist';
    END IF;
    
    -- Also check for any other check constraints on the status column
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.tasks'::regclass 
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        RAISE LOG 'Removed constraint: %', constraint_record.conname;
    END LOOP;
    
END $$;

-- Verify the tasks table structure
DO $$
DECLARE
    status_column_info RECORD;
BEGIN
    -- Get information about the status column
    SELECT 
        data_type,
        udt_name,
        column_default,
        is_nullable
    INTO status_column_info
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
        AND column_name = 'status' 
        AND table_schema = 'public';
    
    RAISE LOG 'Status column info: type=%, udt_name=%, default=%, nullable=%', 
        status_column_info.data_type, 
        status_column_info.udt_name, 
        status_column_info.column_default,
        status_column_info.is_nullable;
END $$;

-- Log completion
SELECT 'Tasks status check constraint removal completed' as status;
