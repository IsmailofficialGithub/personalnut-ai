# RevenueCat Setup Steps - Quick Reference

## ✅ What's Already Done

1. ✅ RevenueCat SDK installed (`react-native-purchases`)
2. ✅ RevenueCat UI package added to `package.json`
3. ✅ RevenueCat service created with API key configuration
4. ✅ RevenueCat context provider created
5. ✅ Subscription screen with paywall created
6. ✅ Customer Center component created
7. ✅ ProGate component for feature gating created
8. ✅ Subscription status component created
9. ✅ Integration into App.js and navigation complete
10. ✅ Documentation created

## 📋 What You Need to Do

### Step 1: Install Dependencies

Run this command to install the RevenueCat UI package:

```bash
npm install
```

### Step 2: Configure RevenueCat Dashboard

1. Go to https://app.revenuecat.com
2. Log in or create an account
3. Create a new project or select your existing project

### Step 3: Add Products

In RevenueCat dashboard, add these products:

**Product Identifiers:**
- `monthly` - Monthly subscription
- `yearly` - Yearly subscription  
- `lifetime` - Lifetime purchase

**For each product:**
1. Go to Products → Add Product
2. Enter the product identifier (e.g., `monthly`)
3. Configure pricing and details
4. Link to App Store/Play Store product

### Step 4: Create Entitlement

1. Go to Entitlements → Add Entitlement
2. Name: `Software Developer Pro`
3. Identifier: `Software Developer Pro`
4. Link all three products to this entitlement

### Step 5: Create Offering

1. Go to Offerings → Add Offering
2. Name: `default` (or your preferred name)
3. Set as current offering
4. Add all three packages (monthly, yearly, lifetime)

### Step 6: Configure App Store Connect (iOS)

1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create subscriptions for:
   - Monthly subscription (product ID: `monthly`)
   - Yearly subscription (product ID: `yearly`)
   - Non-consumable for lifetime (product ID: `lifetime`)
3. Submit for review
4. Link products in RevenueCat dashboard

### Step 7: Configure Google Play Console (Android)

1. Go to Google Play Console → Your App → Monetize → Products → Subscriptions
2. Create subscriptions for:
   - Monthly subscription (product ID: `monthly`)
   - Yearly subscription (product ID: `yearly`)
   - One-time product for lifetime (product ID: `lifetime`)
3. Activate products
4. Link products in RevenueCat dashboard

### Step 8: Update API Key (Production)

**⚠️ Important:** Before going to production:

1. In RevenueCat dashboard, go to Project Settings → API Keys
2. Copy your production API key
3. Update `src/services/revenuecat.js`:

```javascript
const REVENUECAT_API_KEY = 'your-production-api-key-here';
```

The current test key is: `test_tUeeGEYHHcDpRIWYeqOdTvXRyMm`

### Step 9: Test the Integration

1. Run the app: `npm start`
2. Navigate to Subscription screen
3. Test purchase flows with sandbox accounts
4. Verify entitlement checking works
5. Test restore purchases

### Step 10: Add Subscription Link to Your App

Example: Add to ProfileScreen or SettingsScreen:

```javascript
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { useNavigation } from '@react-navigation/native';

// In your component:
const navigation = useNavigation();

<SubscriptionStatus 
  onPress={() => navigation.navigate('Subscription')} 
/>
```

## 🧪 Testing Checklist

- [ ] SDK initializes on app start
- [ ] Subscription screen displays correctly
- [ ] Products are visible and purchasable
- [ ] Monthly subscription purchase works
- [ ] Yearly subscription purchase works
- [ ] Lifetime purchase works
- [ ] Entitlement check works (isPro returns true after purchase)
- [ ] Restore purchases works
- [ ] Customer Center displays correctly
- [ ] RevenueCat Paywall displays correctly
- [ ] Subscription status updates correctly
- [ ] App state changes refresh subscription status

## 🚨 Common Issues

### Products Not Showing

**Issue:** Products don't appear in the subscription screen

**Solutions:**
- Verify products are configured in RevenueCat dashboard
- Check product identifiers match exactly (case-sensitive)
- Ensure products are linked to the current offering
- Verify products are approved in App Store/Play Store
- Check API key is correct

### Purchases Not Working

**Issue:** Can't complete purchases

**Solutions:**
- Verify you're using sandbox test accounts
- Check products are approved and active in stores
- Ensure RevenueCat dashboard is properly configured
- Check network connectivity
- Verify store account has valid payment method (sandbox)

### Entitlement Not Active

**Issue:** Purchase completed but isPro is still false

**Solutions:**
- Verify entitlement identifier matches exactly: `Software Developer Pro`
- Check products are linked to entitlement in dashboard
- Refresh customer info: `refreshCustomerInfo()`
- Check RevenueCat dashboard transaction logs

## 📱 Platform-Specific Notes

### iOS

- Use sandbox test accounts from App Store Connect
- Test purchases don't charge real money
- Products must be in "Ready to Submit" or "Approved" status
- Need valid Apple Developer account

### Android

- Add test accounts in Google Play Console → License Testing
- Products must be active in Play Console
- Test purchases don't charge real money
- Need valid Google Play Developer account

## 🎯 Next Steps

1. Complete the setup steps above
2. Test all purchase flows thoroughly
3. Add subscription UI to your app screens
4. Protect premium features with ProGate or entitlement checks
5. Set up analytics tracking (optional)
6. Configure webhooks for server-side validation (optional)

## 📚 Documentation

- Full integration guide: `REVENUECAT_INTEGRATION.md`
- Usage examples: `SUBSCRIPTION_USAGE_EXAMPLE.md`
- RevenueCat docs: https://docs.revenuecat.com/

## 🆘 Support

- RevenueCat Dashboard: https://app.revenuecat.com
- RevenueCat Docs: https://docs.revenuecat.com/
- RevenueCat Support: https://www.revenuecat.com/support

---

**Current Status:** ✅ Integration complete, ready for testing!
