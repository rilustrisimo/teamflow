-- Fix the tasks.created_by foreign key constraint
-- The constraint should reference auth.users(id) directly, not profiles.user_id

DO $$
BEGIN
    -- Drop the existing incorrect foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_created_by_fkey' 
            AND table_name = 'tasks'
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks DROP CONSTRAINT tasks_created_by_fkey;
        RAISE LOG 'Dropped incorrect tasks_created_by_fkey constraint';
    END IF;
    
    -- Add the correct foreign key constraint that references auth.users directly
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    
    RAISE LOG 'Added correct tasks_created_by_fkey constraint referencing auth.users(id)';
    
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error fixing tasks created_by foreign key: %', SQLERRM;
END $$;

-- Verify the constraint is correct
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    INTO constraint_info
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'tasks'
        AND kcu.column_name = 'created_by'
        AND tc.table_schema = 'public';
    
    IF constraint_info IS NOT NULL THEN
        RAISE LOG 'Foreign key verified: %.% -> %.%', 
            constraint_info.column_name,
            'tasks',
            constraint_info.foreign_table_name,
            constraint_info.foreign_column_name;
    ELSE
        RAISE LOG 'No foreign key constraint found for tasks.created_by';
    END IF;
END $$;

-- Log completion
SELECT 'Tasks created_by foreign key fix completed' as status;
