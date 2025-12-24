# Meal Photo Implementation - Complete Guide

## ✅ Implementation Complete

Meal photos are now saved and displayed throughout the app when meals are logged.

---

## 📋 What Was Implemented

### 1. **Database Schema Update**
- Added `image_url` column to `food_entries` table
- Created index for better query performance
- SQL migration file created: `add_meal_image_support.sql`

### 2. **Storage Bucket Setup**
- Created storage policies for `meals` bucket
- Users can upload their own meal images
- Images are publicly accessible for display

### 3. **Image Upload (FoodAnalysisScreen)**
- Automatically uploads meal photo when saving food entry
- Uses base64 data from camera/photo picker
- Falls back gracefully if upload fails (saves entry without image)
- Stores image URL in database

### 4. **Image Display**
- **DiaryScreen**: Shows meal image at the top of each entry card
- **MealDetailModal**: Already supports image display (shows full-size image)
- Images are displayed in a styled box with proper sizing

---

## 🚀 Setup Instructions

### Step 1: Run SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add image_url column to food_entries table
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_food_entries_image_url ON public.food_entries(image_url) WHERE image_url IS NOT NULL;
```

Or run the complete file: `add_meal_image_support.sql`

### Step 2: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create Bucket**
3. Configure:
   - **Name**: `meals`
   - **Public**: ✅ Yes
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

### Step 3: Apply Storage Policies

Run this SQL in Supabase SQL Editor (or use `add_meal_image_support.sql`):

```sql
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
```

---

## 📱 How It Works

### **When a Meal is Logged:**

1. User takes/selects photo in CameraScreen
2. Photo is analyzed in FoodAnalysisScreen
3. When user clicks "Save Entry":
   - Image is uploaded to Supabase storage (`meals` bucket)
   - Image URL is saved in `food_entries.image_url`
   - Food entry is saved with all nutrition data
4. Image URL is stored in database

### **When Meals are Displayed:**

1. **DiaryScreen**: 
   - Shows meal image at top of each entry card
   - Image is 200px height, full width
   - Rounded corners, cover resize mode

2. **MealDetailModal**:
   - Shows full-size meal image (250px height)
   - Displays at top of modal
   - Already had support for `image_url` field

---

## 🎨 Visual Design

### **DiaryScreen Entry Card:**
```
┌─────────────────────────┐
│   [Meal Image]          │ ← 200px height, rounded
│                         │
├─────────────────────────┤
│ Meal Name               │
│ Timestamp               │
│ [Delete] [>]            │
├─────────────────────────┤
│ 🔥 Calories  📊 Protein  │
│ 🍔 Carbs     💧 Fat      │
│ Health Score: 85/100    │
└─────────────────────────┘
```

### **MealDetailModal:**
```
┌─────────────────────────┐
│   [Full Meal Image]     │ ← 250px height
│                         │
├─────────────────────────┤
│ Meal Details            │
│ Nutritional Info         │
│ Analysis & Recommendations│
└─────────────────────────┘
```

---

## 🔧 Technical Details

### **Image Upload Process:**

1. **Base64 Conversion**: 
   - Uses base64 from camera/photo picker
   - Converts to Uint8Array
   - Creates Blob for upload

2. **Storage Upload**:
   - File path: `{user_id}/{timestamp}.jpg`
   - Content type: `image/jpeg`
   - Uploads to `meals` bucket

3. **URL Generation**:
   - Gets public URL from Supabase storage
   - Stores URL in `food_entries.image_url`

### **Error Handling:**

- If image upload fails, entry is still saved (without image)
- Errors are logged to console
- User experience is not interrupted

---

## 📝 Files Modified

1. **`add_meal_image_support.sql`** (New)
   - SQL migration for image_url column
   - Storage policies for meals bucket

2. **`complete_database_schema.sql`**
   - Updated to include `image_url` column
   - Added meals bucket storage policies

3. **`src/screens/FoodAnalysisScreen.js`**
   - Added image upload functionality
   - Saves image URL to database

4. **`src/screens/DiaryScreen.js`**
   - Added Image component import
   - Displays meal image in entry cards
   - Added meal image styling

5. **`src/components/MealDetailModal.js`**
   - Already had image support (no changes needed)

---

## ✅ Testing Checklist

- [ ] Run SQL migration to add `image_url` column
- [ ] Create `meals` storage bucket in Supabase
- [ ] Apply storage policies
- [ ] Take a photo and log a meal
- [ ] Verify image appears in DiaryScreen
- [ ] Verify image appears in MealDetailModal
- [ ] Check image URL is saved in database
- [ ] Verify image is accessible via public URL

---

## 🐛 Troubleshooting

### **Image Not Uploading**

1. **Check Storage Bucket**:
   - Verify `meals` bucket exists
   - Check it's set to public
   - Verify file size limit (10MB)

2. **Check Storage Policies**:
   - Run the storage policy SQL
   - Verify policies are applied

3. **Check Console Logs**:
   - Look for upload errors
   - Check network requests

### **Image Not Displaying**

1. **Check Database**:
   - Verify `image_url` column exists
   - Check if URL is saved in database
   - Verify URL format is correct

2. **Check Image URL**:
   - URL should be: `https://[project].supabase.co/storage/v1/object/public/meals/[path]`
   - Verify image is accessible in browser

3. **Check React Native Image**:
   - Verify Image component is imported
   - Check image source format: `{ uri: item.image_url }`

---

## 🎯 Future Enhancements

Potential improvements:
- Image compression before upload
- Multiple images per meal
- Image editing/cropping
- Image gallery view
- Share meal images
- Image caching for offline viewing

---

## 📊 Database Schema

```sql
food_entries (
  ...
  image_url TEXT,  -- ← New column
  ...
)
```

---

## 🎉 Ready to Use!

The meal photo feature is fully implemented. After running the SQL migration and creating the storage bucket, meal photos will be automatically saved and displayed when users log meals.

