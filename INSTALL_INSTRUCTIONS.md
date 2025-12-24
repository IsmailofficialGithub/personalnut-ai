# Installation Instructions - Fix App Not Opening

## Step 1: Install Dependencies

Since PowerShell execution policy is blocking npm commands, you have two options:

### Option A: Enable PowerShell Scripts (Recommended)
Run this command in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run:
```bash
npm install
```

### Option B: Use Command Prompt (CMD)
Open Command Prompt (not PowerShell) and run:
```bash
cd C:\Users\Awais\Desktop\Applications\personalnut-ai
npm install
```

### Option C: Clean Install
If you want a fresh install:
```bash
# In CMD or after enabling PowerShell scripts:
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

## Step 2: Clear Expo Cache and Restart

After installing dependencies:
```bash
npx expo start --clear
```

Or if using npm scripts:
```bash
npm run start:clear
```

## Step 3: Verify Environment Variables

Make sure your `.env` file contains:
```
SUPABASE_URL=https://qcucqyorafkvmdrezhry.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdWNxeW9yYWZrdm1kcmV6aHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDk2NDQsImV4cCI6MjA3OTI4NTY0NH0.w7XtePSvzwxB57tczrhBFlUf2MgXXQx6aKT0uoufTXo
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
REVENUECAT_API_KEY=sk_kiotmkdYmrVeTqbGEyjRYFSJogPPq
```

## Step 4: Check for Errors

When you run `expo start`, check for:
- Missing dependencies errors
- Module resolution errors
- Metro bundler errors

## Common Issues and Solutions

### Issue: "Cannot find module"
**Solution:** Delete `node_modules` and reinstall:
```bash
rm -rf node_modules
npm install
```

### Issue: Metro bundler cache problems
**Solution:** Clear cache:
```bash
npx expo start --clear
```

### Issue: Expo Go app not connecting
**Solution:** 
- Make sure phone and computer are on same WiFi
- Try tunnel mode: `npx expo start --tunnel`

### Issue: RevenueCat initialization errors
**Solution:** The app should still work - RevenueCat errors are handled gracefully. Check console for specific error messages.

## Updated Files

1. **package.json** - Added helpful scripts:
   - `start:clear` - Start with cleared cache
   - `install:clean` - Clean reinstall

2. **app.json** - Added REVENUECAT_API_KEY as fallback (though app.config.js should use .env)

3. **App.js** - Added error boundary for better error reporting

4. **RevenueCatContext** - Improved error handling

## If App Still Doesn't Open

1. Check the terminal/console for specific error messages
2. Try temporarily disabling RevenueCat in App.js to isolate the issue
3. Check if other dependencies are causing issues
4. Verify all imports are correct in your components

