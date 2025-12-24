-- ============================================
-- Add Meal Image Support
-- ============================================
-- Run this in your Supabase SQL Editor to add image_url column to food_entries table
-- ============================================

-- Add image_url column to food_entries table
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_food_entries_image_url ON public.food_entries(image_url) WHERE image_url IS NOT NULL;

-- ============================================
-- Storage Bucket Setup
-- ============================================
-- You need to create a 'meals' storage bucket in Supabase Dashboard:
-- 1. Go to Storage > Create Bucket
-- 2. Name: 'meals'
-- 3. Public: Yes
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- ============================================

-- Storage policies for meals bucket
DROP POLICY IF EXISTS "Meal images are publicly accessible" ON storage.objects;
CREATE POLICY "Meal images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'meals');

DROP POLICY IF EXISTS "Users can upload their own meal images" ON storage.objects;
CREATE POLICY "Users can upload their own meal images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meals' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own meal images" ON storage.objects;
CREATE POLICY "Users can update their own meal images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'meals' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own meal images" ON storage.objects;
CREATE POLICY "Users can delete their own meal images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'meals' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

