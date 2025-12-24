-- ============================================
-- Fix diet_plans table - Remove goals column
-- ============================================
-- This SQL removes the 'goals' column from diet_plans table if it exists
-- The goals column was removed from the schema but may still exist in some databases

-- Remove goals column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' 
    AND column_name = 'goals'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.diet_plans DROP COLUMN goals;
    RAISE NOTICE 'Removed goals column from diet_plans table';
  ELSE
    RAISE NOTICE 'goals column does not exist in diet_plans table';
  END IF;
END $$;

-- Remove start_date column if it exists (it's not in the current schema)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' 
    AND column_name = 'start_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.diet_plans DROP COLUMN start_date;
    RAISE NOTICE 'Removed start_date column from diet_plans table';
  ELSE
    RAISE NOTICE 'start_date column does not exist in diet_plans table';
  END IF;
END $$;

-- Verify the current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'diet_plans'
  AND table_schema = 'public'
ORDER BY ordinal_position;

