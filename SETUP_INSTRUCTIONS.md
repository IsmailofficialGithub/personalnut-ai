# Setup Instructions for PersonalNut.AI

## Critical: Environment Variables Required

Your app **will not start** without environment variables. Follow these steps:

### Step 1: Create .env file

Create a `.env` file in the root directory (same level as `package.json`) with the following content:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

### Step 2: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon/public key** → Use as `SUPABASE_ANON_KEY`

### Step 3: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key → Use as `OPENAI_API_KEY`

### Step 4: Set Up Database

1. Open Supabase Dashboard → **SQL Editor**
2. Copy and paste the entire contents of `complete_database_schema.sql`
3. Run the SQL script
4. Create storage buckets:
   - Go to **Storage** → **Create Bucket**
   - Create `avatars` bucket (public, 5MB limit)
   - Optionally create `posts` bucket (public, 10MB limit)

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Start the App

```bash
# Clear cache and start
npx expo start --clear
```

## Common Issues

### App Won't Start / White Screen

**Problem**: Missing environment variables
**Solution**: Make sure `.env` file exists and has all three variables set

### "Supabase environment variables are not set" Error

**Problem**: Environment variables not loading
**Solution**: 
1. Make sure `.env` file is in the root directory
2. Restart Expo with: `npx expo start --clear`
3. Check that `babel.config.js` has the dotenv plugin (it should)

### Database Errors

**Problem**: Tables don't exist or RLS errors
**Solution**: Run `complete_database_schema.sql` in Supabase SQL Editor

### React Version Warning

**Problem**: React 19.1.0 might have compatibility issues
**Solution**: If you see React version warnings, you may need to downgrade to React 18.x:
```bash
npm install react@18.2.0 react-dom@18.2.0
```

## File Structure

```
personalnut-ai/
├── .env                    # ← CREATE THIS FILE (not in git)
├── .env.example            # Template (you can copy this)
├── App.js
├── package.json
├── complete_database_schema.sql  # Run this in Supabase
└── src/
```

## Next Steps After Setup

1. ✅ Create `.env` file with your credentials
2. ✅ Run database schema in Supabase
3. ✅ Create storage buckets
4. ✅ Start the app: `npx expo start --clear`
5. ✅ Test signup/login
6. ✅ Complete onboarding flow

