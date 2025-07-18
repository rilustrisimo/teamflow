-- Make created_by column nullable in clients table
-- This allows clients to be created without a specific user reference

BEGIN;

-- Make created_by column nullable
ALTER TABLE public.clients 
ALTER COLUMN created_by DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'created_by';

COMMIT;
