-- ============================================
-- Fix: Add image_url column to food_entries
-- ============================================
-- Run this in Supabase SQL Editor to add the missing column
-- ============================================

-- Add image_url column if it doesn't exist
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_food_entries_image_url ON public.food_entries(image_url) WHERE image_url IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'food_entries'
  AND column_name = 'image_url';

