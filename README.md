# PersonalNut.AI 🥗

A comprehensive AI-powered nutrition tracking and meal planning mobile application built with React Native and Expo.

## 📱 Features

### Core Features
- **AI Food Analysis**: Take photos of your meals and get instant nutritional analysis using OpenAI's GPT-4 Vision
- **Personalized Diet Plans**: Generate custom meal plans based on your profile, goals, and dietary preferences
- **Food Diary**: Track your daily meals and nutritional intake
- **Community Feed**: Share your progress, diet plans, and meals with the community
- **Profile Management**: Upload profile pictures, track health stats, and manage your nutrition goals
- **Real-time Updates**: Live updates for community posts and interactions

### Key Functionality
- 📸 **Camera Integration**: Capture food photos for AI analysis
- 🎯 **Goal Tracking**: Monitor calories, macros, and progress toward your goals
- 👥 **Social Features**: Like, comment, and share posts in the community
- 📊 **Health Dashboard**: View daily stats, BMI, and nutritional breakdowns
- 🌙 **Dark Mode**: Full dark mode support with theme switching
- 🔐 **Authentication**: Secure sign up and login with Supabase Auth

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd personalnut-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Configure Supabase**
   
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database migration SQL (see Database Setup below)
   - Create a storage bucket named `avatars` for profile pictures

5. **Start the development server**
   ```bash
   npx expo start
   ```

   Then press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 🗄️ Database Setup

### Step 1: Complete Database Schema

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Run the complete schema SQL below. This will create all tables, triggers, and functions needed for the application.

> **Note**: This schema assumes you're starting fresh. If you have existing tables, the SQL uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE IF NOT EXISTS` to avoid conflicts.

```sql
-- ============================================
-- PersonalNut.AI - Complete Database Schema
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  weight_goal DECIMAL(5,2),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_preferences TEXT[] DEFAULT '{}',
  daily_calorie_goal INTEGER DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- 2. FOOD_ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  meal_type TEXT DEFAULT 'meal',
  eaten_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0,
  carbs DECIMAL(8,2) DEFAULT 0,
  fat DECIMAL(8,2) DEFAULT 0,
  fiber DECIMAL(8,2) DEFAULT 0,
  sugar DECIMAL(8,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  vitamins JSONB,
  minerals JSONB,
  analysis TEXT,
  recommendations TEXT,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_entries
DROP POLICY IF EXISTS "Users can view own food entries" ON public.food_entries;
CREATE POLICY "Users can view own food entries" ON public.food_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own food entries" ON public.food_entries;
CREATE POLICY "Users can insert own food entries" ON public.food_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own food entries" ON public.food_entries;
CREATE POLICY "Users can update own food entries" ON public.food_entries
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own food entries" ON public.food_entries;
CREATE POLICY "Users can delete own food entries" ON public.food_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for food_entries
CREATE INDEX IF NOT EXISTS idx_food_entries_user_id ON public.food_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_eaten_at ON public.food_entries(eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries(user_id, eaten_at);

-- 3. DIET_PLANS TABLE
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  meal_plan JSONB NOT NULL,
  daily_calorie_target INTEGER,
  daily_calorie_goal INTEGER,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diet_plans
DROP POLICY IF EXISTS "Users can view own diet plans" ON public.diet_plans;
CREATE POLICY "Users can view own diet plans" ON public.diet_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own diet plans" ON public.diet_plans;
CREATE POLICY "Users can insert own diet plans" ON public.diet_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own diet plans" ON public.diet_plans;
CREATE POLICY "Users can update own diet plans" ON public.diet_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own diet plans" ON public.diet_plans;
CREATE POLICY "Users can delete own diet plans" ON public.diet_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for diet_plans
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON public.diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_is_active ON public.diet_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_diet_plans_created_at ON public.diet_plans(created_at DESC);

-- 4. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  post_type TEXT DEFAULT 'story' CHECK (post_type IN ('question', 'success_story', 'motivation', 'story', 'meal', 'other')),
  image_url TEXT,
  shared_diet_plan_id UUID REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  shared_food_entry_id UUID REFERENCES public.food_entries(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
DROP POLICY IF EXISTS "Users can view public posts and own posts" ON public.posts;
CREATE POLICY "Users can view public posts and own posts" ON public.posts
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON public.posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_posts_shared_diet_plan ON public.posts(shared_diet_plan_id) WHERE shared_diet_plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_shared_food_entry ON public.posts(shared_food_entry_id) WHERE shared_food_entry_id IS NOT NULL;

-- 5. POST_LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;
CREATE POLICY "Users can view all likes" ON public.post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON public.post_likes;
CREATE POLICY "Users can insert own likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.post_likes;
CREATE POLICY "Users can delete own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON public.post_likes(created_at DESC);

-- 6. POST_COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_comments
DROP POLICY IF EXISTS "Users can view all comments" ON public.post_comments;
CREATE POLICY "Users can view all comments" ON public.post_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON public.post_comments;
CREATE POLICY "Users can insert own comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
CREATE POLICY "Users can update own comments" ON public.post_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- 7. DAILY_STATS TABLE
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein DECIMAL(10,2) DEFAULT 0,
  total_carbs DECIMAL(10,2) DEFAULT 0,
  total_fat DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_stats
DROP POLICY IF EXISTS "Users can view own daily stats" ON public.daily_stats;
CREATE POLICY "Users can view own daily stats" ON public.daily_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily stats" ON public.daily_stats;
CREATE POLICY "Users can insert own daily stats" ON public.daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily stats" ON public.daily_stats;
CREATE POLICY "Users can update own daily stats" ON public.daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for daily_stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_entries_updated_at ON public.food_entries;
CREATE TRIGGER update_food_entries_updated_at
  BEFORE UPDATE ON public.food_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_diet_plans_updated_at ON public.diet_plans;
CREATE TRIGGER update_diet_plans_updated_at
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON public.daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update post likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic likes_count update
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Function to automatically update post comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic comments_count update
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON public.post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: Create Storage Buckets

Create storage buckets for profile pictures and post images:

1. Go to **Storage** in Supabase Dashboard
2. Create the `avatars` bucket:
   - **Name**: `avatars`
   - **Public**: ✅ Yes
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
3. (Optional) Create the `posts` bucket:
   - **Name**: `posts`
   - **Public**: ✅ Yes
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

### Step 3: Storage Policies

After creating the buckets, run this SQL in the SQL Editor:

```sql
-- Storage policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for posts bucket (if created)
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
CREATE POLICY "Post images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
CREATE POLICY "Users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 🏗️ Project Structure

```
personalnut-ai/
├── App.js                 # Main app component
├── app.config.js          # Expo configuration
├── babel.config.js        # Babel configuration
├── .env                   # Environment variables (not in git)
├── src/
│   ├── components/         # Reusable components
│   │   ├── Avatar.js      # Profile avatar component
│   │   ├── Button.js      # Custom button component
│   │   ├── Card.js        # Card container component
│   │   └── Input.js       # Form input component
│   ├── constants/         # Constants and themes
│   │   ├── Colors.js      # Color schemes
│   │   └── Theme.js       # Theme constants
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.js # Authentication context
│   │   └── ThemeContext.js # Theme context
│   ├── navigation/        # Navigation setup
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── TabNavigator.js
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.js
│   │   ├── CommunityScreen.js
│   │   ├── DiaryScreen.js
│   │   ├── DietPlanScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── CameraScreen.js
│   │   ├── FoodAnalysisScreen.js
│   │   ├── LoginScreen.js
│   │   ├── SignupScreen.js
│   │   └── OnboardingScreen.js
│   └── services/          # API services
│       ├── openai.js     # OpenAI API integration
│       └── supabase.js   # Supabase client
└── assets/               # Images and assets
```

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4 Vision API
- **Styling**: StyleSheet with Theme system
- **Icons**: Expo Vector Icons (Ionicons)
- **Date Handling**: date-fns

## 📦 Key Dependencies

```json
{
  "@expo/vector-icons": "^15.0.3",
  "@react-navigation/native": "^6.1.18",
  "@supabase/supabase-js": "^2.45.4",
  "expo": "~54.0.25",
  "expo-camera": "~17.0.9",
  "expo-image-picker": "~17.0.8",
  "react-native": "0.81.5",
  "react-native-dotenv": "^3.4.11"
}
```

## 🔧 Configuration

### Babel Configuration

The project uses `react-native-dotenv` to load environment variables. Make sure your `babel.config.js` includes:

```javascript
plugins: [
  [
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
    },
  ],
]
```

### App Configuration

The `app.config.js` loads environment variables using `dotenv` and makes them available via `expo-constants`.

## 🎨 Features Overview

### Home Screen
- Daily calorie and macro tracking
- Quick action buttons
- Recent meals display
- Profile icon in header

### Community Screen
- **Feed Tab**: View all public posts
- **My Posts Tab**: View your own posts
- Real-time updates
- Like and comment functionality
- Share diet plans and meals

### Diet Plan Screen
- Generate personalized meal plans
- View daily meal breakdowns
- Share plans to community
- Tips and shopping lists

### Profile Screen
- Upload profile picture
- Edit personal information
- View health stats (BMI, weight, etc.)
- Dark mode toggle
- Sign out

### Camera & Food Analysis
- Capture food photos
- AI-powered nutritional analysis
- Save meals to diary
- Health score and recommendations

## 🚨 Troubleshooting

### Environment Variables Not Loading
1. Make sure `.env` file exists in root directory
2. Restart Expo server with `--clear` flag: `npx expo start --clear`
3. Check `babel.config.js` has the dotenv plugin configured

### Database Errors

#### Profile Not Found (PGRST116)
If you see "Error fetching profile: PGRST116", this means a profile doesn't exist for the user. The database trigger should automatically create profiles, but if it doesn't work:

1. **Check if the trigger exists:**
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **Manually create profiles for existing users:**
   ```sql
   INSERT INTO public.profiles (id, full_name)
   SELECT 
     id, 
     COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.profiles)
   ON CONFLICT (id) DO NOTHING;
   ```

#### Rate Limiting (429 Errors)
If you see `429 Too Many Requests` during signup:
- Wait 5-10 minutes before trying again
- Supabase has rate limits to prevent abuse
- This is a temporary restriction that will reset

#### Other Database Issues
- Ensure all SQL migrations have been run in order
- Check that foreign key constraints are properly set up
- Verify RLS policies are enabled on all tables
- Check Supabase Dashboard → Database → Tables to verify all tables exist

### Storage Upload Errors
- Verify the `avatars` bucket exists and is public
- Check storage policies are applied
- Ensure file size is under 5MB

### API Key Issues
- Verify OpenAI API key is correct in `.env`
- Check that the key has access to GPT-4 Vision
- Ensure the key is not expired

## 📝 Environment Variables

Create a `.env` file with:

```env
OPENAI_API_KEY=sk-proj-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## 🚀 Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For issues or questions, please contact the development team.

## 🙏 Acknowledgments

- OpenAI for GPT-4 Vision API
- Supabase for backend infrastructure
- Expo team for the amazing framework
- React Native community

---

**Made with ❤️ for better nutrition tracking**
