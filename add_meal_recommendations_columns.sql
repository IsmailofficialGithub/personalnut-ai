-- ============================================
-- Add Meal Recommendations Columns to food_entries
-- ============================================
-- Run this in Supabase SQL Editor to add columns for
-- targeted recommendations (best_for, not_recommended_for, health_benefits)
-- ============================================

-- Add best_for column (JSONB to store structured recommendations)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS best_for JSONB;

-- Add not_recommended_for column (JSONB to store contraindications)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS not_recommended_for JSONB;

-- Add health_benefits column (JSONB array to store health benefits)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS health_benefits JSONB;

-- Add estimated_quantity column (if not already exists)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS estimated_quantity TEXT;

-- Add serving_size column (if not already exists)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS serving_size TEXT;

-- Add additional nutritional columns (if not already exists)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS saturated_fat DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS trans_fat DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS monounsaturated_fat DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS polyunsaturated_fat DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS cholesterol DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS added_sugar DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS potassium DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS calcium DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS iron DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS magnesium DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS phosphorus DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS zinc DECIMAL(8,2) DEFAULT 0;

-- Add vitamin columns (stored as TEXT to handle different units like mcg, IU, mg)
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_a TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_c DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_d TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_e TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_k TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS thiamin DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS riboflavin DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS niacin DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_b6 DECIMAL(8,2) DEFAULT 0;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS folate TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS vitamin_b12 TEXT;

-- Add meal detail columns
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS cuisine_type TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS cooking_method TEXT;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS main_ingredients JSONB;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS allergens JSONB;

ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS dietary_tags JSONB;

-- Create indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_food_entries_best_for ON public.food_entries USING GIN (best_for) WHERE best_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_food_entries_health_benefits ON public.food_entries USING GIN (health_benefits) WHERE health_benefits IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_food_entries_main_ingredients ON public.food_entries USING GIN (main_ingredients) WHERE main_ingredients IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_food_entries_allergens ON public.food_entries USING GIN (allergens) WHERE allergens IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_food_entries_dietary_tags ON public.food_entries USING GIN (dietary_tags) WHERE dietary_tags IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'food_entries'
  AND column_name IN (
    'best_for', 
    'not_recommended_for', 
    'health_benefits',
    'estimated_quantity',
    'serving_size',
    'cuisine_type',
    'cooking_method',
    'main_ingredients',
    'allergens',
    'dietary_tags'
  )
ORDER BY column_name;

-- ============================================
-- Example JSON structure for best_for:
-- ============================================
-- {
--   "person_types": ["athletes", "weight loss", "muscle gain"],
--   "health_conditions": ["diabetes", "hypertension"],
--   "patient_types": ["post-surgery recovery", "chronic disease management"],
--   "lifestyle": ["active lifestyle", "busy professionals"]
-- }
--
-- Example JSON structure for not_recommended_for:
-- {
--   "person_types": ["specific person types if any"],
--   "health_conditions": ["specific conditions if any"],
--   "patient_types": ["specific patient types if any"]
-- }
--
-- Example JSON structure for health_benefits:
-- ["Supports heart health", "Boosts immune system", "Aids digestion"]
-- ============================================

