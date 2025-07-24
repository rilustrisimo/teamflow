-- Fix duration column to support precise decimal values
-- Change from DECIMAL(5,2) to DECIMAL(10,6) to support larger durations with more precision

ALTER TABLE public.time_entries 
ALTER COLUMN duration TYPE DECIMAL(10,6);

-- Add comment to document the change
COMMENT ON COLUMN public.time_entries.duration IS 'Duration in minutes with up to 6 decimal places for precise time tracking';
