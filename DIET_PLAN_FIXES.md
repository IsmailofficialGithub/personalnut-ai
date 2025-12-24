# Diet Plan Fixes and Enhancements

## Issues Fixed

### ✅ 1. Database Error: "Could not find the 'goals' column"
**Problem**: The code was trying to insert a `goals` column that doesn't exist in the `diet_plans` table schema.

**Fix**: 
- Removed `goals` and `start_date` from the insert statement in `DietPlanScreen.js`
- Created SQL script `fix_diet_plans_goals_column.sql` to remove these columns if they exist
- Updated references to use `created_at` instead of `start_date`
- Updated references to use `daily_calorie_goal` instead of `daily_calorie_target` (with fallback)

**Files Modified**:
- `src/screens/DietPlanScreen.js` (lines 163-175, 289, 494, 502)

**SQL File Created**:
- `fix_diet_plans_goals_column.sql` - Run this in Supabase SQL Editor

### ✅ 2. Updated Duration Options
**Problem**: Duration options were too long (up to 90 days).

**Fix**: 
- Changed duration options to: **3 days**, **1 week (7 days)**, **14 days (max)**
- Removed custom duration option
- Added validation to ensure duration is between 3-14 days

**Files Modified**:
- `src/components/DietPlanOptionsModal.js` (lines 27-33)

### ✅ 3. Added Goals Selection
**Enhancement**: Users can now select multiple goals for their diet plan.

**New Goals Options**:
- Weight Loss
- Weight Gain
- Muscle Gain
- Healthy Eating
- Maintenance
- Athletic Performance

**Files Modified**:
- `src/components/DietPlanOptionsModal.js` (added GoalOptions array and selection UI)
- `src/screens/DietPlanScreen.js` (updated to pass goals to generateDietPlan)
- `src/services/openai.js` (updated to accept and use goals)

### ✅ 4. Added Custom Questions/Preferences
**Enhancement**: Users can now provide custom preferences and questions when generating a diet plan.

**Features**:
- Text input field for additional preferences (500 character limit)
- Examples: "I prefer quick meals", "I love spicy food", "I'm a beginner cook"
- Character counter
- Preferences are included in the AI prompt for personalized meal plans

**Files Modified**:
- `src/components/DietPlanOptionsModal.js` (added custom questions section)
- `src/services/openai.js` (updated generateDietPlan to accept and use customQuestions)
- `src/screens/DietPlanScreen.js` (updated to pass customQuestions)

## SQL Commands

### Run this in Supabase SQL Editor:

```sql
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
  END IF;
END $$;

-- Remove start_date column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diet_plans' 
    AND column_name = 'start_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.diet_plans DROP COLUMN start_date;
  END IF;
END $$;
```

Or simply run the entire `fix_diet_plans_goals_column.sql` file.

## New Features

### 1. Goals Selection
Users can now select multiple goals:
- Weight Loss
- Weight Gain  
- Muscle Gain
- Healthy Eating
- Maintenance
- Athletic Performance

### 2. Duration Options
- **3 Days** - Quick start plan
- **1 Week (7 days)** - Standard weekly plan
- **14 Days** - Maximum duration (2 weeks)

### 3. Custom Preferences
Users can add custom preferences such as:
- Meal timing preferences
- Cooking skill level
- Favorite foods
- Dietary restrictions not in profile
- Lifestyle preferences
- Any other specific requirements

## How to Use

1. **Run the SQL fix**:
   - Open Supabase Dashboard → SQL Editor
   - Run `fix_diet_plans_goals_column.sql`

2. **Test the app**:
   - Go to Diet Plan screen
   - Click "Generate Plan" or "+" button
   - Select goals (at least one required)
   - Choose duration (3, 7, or 14 days)
   - Optionally add custom preferences
   - Select budget
   - Click "Generate Plan"

## Updated UI Flow

1. **Plan Options Modal** now shows:
   - Goals selection (multi-select)
   - Duration selection (3, 7, or 14 days)
   - Budget selection
   - Custom preferences text input

2. **Diet Plan Generation**:
   - Includes selected goals in AI prompt
   - Includes custom preferences in AI prompt
   - Respects duration limit (max 14 days)
   - Creates plan without database errors

## Testing Checklist

- [ ] Run SQL fix script
- [ ] Generate a new diet plan
- [ ] Select multiple goals
- [ ] Choose different durations (3, 7, 14 days)
- [ ] Add custom preferences
- [ ] Verify plan is created successfully
- [ ] Check that plan displays correctly
- [ ] Verify no database errors in console

## Notes

- The `goals` column was removed from the database schema as goals are now passed directly to the AI and stored in the meal_plan JSON
- Duration is now limited to 14 days maximum for better plan quality
- Custom questions are optional but help create more personalized plans
- All changes are backward compatible with existing plans

