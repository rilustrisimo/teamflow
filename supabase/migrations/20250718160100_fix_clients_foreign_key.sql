-- Fix clients table foreign key constraint to reference profiles table correctly
-- Drop the existing constraint and recreate it properly

BEGIN;

-- Drop the existing constraint if it exists
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.clients 
ADD CONSTRAINT clients_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Verify the constraint was created correctly
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'clients'
    AND tc.constraint_name = 'clients_created_by_fkey';

COMMIT;
