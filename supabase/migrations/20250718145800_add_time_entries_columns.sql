-- Add missing date column to time_entries table
-- This migration ensures the time_entries table has all required columns

-- Check if date column exists and add it if missing
DO $$
BEGIN
    -- Check if date column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'time_entries' 
        AND column_name = 'date'
    ) THEN
        -- Add date column if it doesn't exist
        ALTER TABLE public.time_entries ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
        RAISE LOG 'Added date column to time_entries table';
    ELSE
        RAISE LOG 'Date column already exists in time_entries table';
    END IF;
    
    -- Check if duration column exists and add it if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'time_entries' 
        AND column_name = 'duration'
    ) THEN
        -- Add duration column if it doesn't exist
        ALTER TABLE public.time_entries ADD COLUMN duration DECIMAL(5,2) NOT NULL DEFAULT 0;
        RAISE LOG 'Added duration column to time_entries table';
    ELSE
        RAISE LOG 'Duration column already exists in time_entries table';
    END IF;
    
    -- Check if start_time column exists and add it if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'time_entries' 
        AND column_name = 'start_time'
    ) THEN
        -- Add start_time column if it doesn't exist
        ALTER TABLE public.time_entries ADD COLUMN start_time TIME NOT NULL DEFAULT '09:00:00';
        RAISE LOG 'Added start_time column to time_entries table';
    ELSE
        RAISE LOG 'Start_time column already exists in time_entries table';
    END IF;
    
    -- Check if end_time column exists and add it if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'time_entries' 
        AND column_name = 'end_time'
    ) THEN
        -- Add end_time column if it doesn't exist
        ALTER TABLE public.time_entries ADD COLUMN end_time TIME NOT NULL DEFAULT '17:00:00';
        RAISE LOG 'Added end_time column to time_entries table';
    ELSE
        RAISE LOG 'End_time column already exists in time_entries table';
    END IF;
    
    -- Check if description column exists and add it if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'time_entries' 
        AND column_name = 'description'
    ) THEN
        -- Add description column if it doesn't exist
        ALTER TABLE public.time_entries ADD COLUMN description TEXT NOT NULL DEFAULT '';
        RAISE LOG 'Added description column to time_entries table';
    ELSE
        RAISE LOG 'Description column already exists in time_entries table';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error adding columns to time_entries: %', SQLERRM;
END $$;

-- Log completion
DO $$ 
BEGIN
    RAISE LOG 'Ensured time_entries table has all required columns';
END $$;
