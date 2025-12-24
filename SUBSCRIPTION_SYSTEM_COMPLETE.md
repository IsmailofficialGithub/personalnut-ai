# Complete Subscription System Documentation

## Overview

This document describes the complete three-tier subscription system implementation for your nutrition app:
- **Free Tier** - $0/month
- **Pro Tier** - $9.99/month
- **Premium Tier** - $19.99/month

## Architecture

### Components

1. **RevenueCat SDK** - Handles in-app purchases and subscription management
2. **Supabase** - Database for usage tracking and subscription caching
3. **React Native Context** - State management for subscription tier
4. **Feature Gating** - Utilities to check feature access
5. **Usage Tracking** - Service to track Free tier usage limits

## File Structure

```
src/
├── services/
│   ├── revenuecat.js          # RevenueCat SDK integration
│   └── usageTracking.js       # Usage tracking service
├── contexts/
│   └── RevenueCatContext.js   # Subscription state management
├── screens/
│   └── SubscriptionScreen.js  # Subscription purchase screen
├── components/
│   ├── ProGate.js             # Feature gating component
│   ├── SubscriptionStatus.js  # Subscription status display
│   └── CustomerCenter.js      # Customer center modal
└── utils/
    └── featureGating.js       # Feature access utilities
```

## Subscription Tiers & Features

### Free Tier ($0/month)

**Features:**
- Limited AI meal logging by image (10 analyses/month)
- Basic nutrient breakdown
- Basic calorie estimate
- View community posts
- Create only simple 3-day diet plans
- Limited AI recommendations
- Ads shown

**Limitations:**
- 10 AI meal analyses per month
- Basic features only
- Ad-supported

### Pro Tier ($9.99/month)

**Features:**
- Unlimited AI meal image logging
- Detailed nutrient and calorie estimation
- Quantity approximation
- Suitability analysis (diabetes, hypertension, etc.)
- Allergy-based suggestions
- Create 3-day, 7-day, and 14-day diet plans
- Weight loss, weight gain, healthy diet templates
- Full community access (post, comment, react)
- Ad-free
- Faster AI processing

**Upgrade from Free:**
- Remove usage limits
- Advanced features
- Ad-free experience
- Faster processing

### Premium Tier ($19.99/month)

**Features:**
- Everything in Pro
- Grocery list generator (per plan)
- Automatic diet generation for 3/7/14/30/45 days
- Long-term nutrition insights + progress charts
- AI personal nutrition coach (chat)
- Priority AI processing queue
- Exportable diet plans (PDF/CSV)
- Advanced symptoms & health-condition insights

**Upgrade from Pro:**
- AI coach
- Export functionality
- Longer diet plans (30/45 days)
- Priority processing
- Advanced analytics

## Database Schema

### Tables

1. **usage_tracking** - Tracks monthly usage for Free tier
2. **subscription_history** - Historical subscription changes
3. **user_subscription_cache** - Cached subscription tier

See `SUPABASE_SUBSCRIPTION_SCHEMA.sql` for complete schema.

### Usage Tracking

The `usage_tracking` table tracks Free tier usage (e.g., AI meal analyses):

```sql
-- Get current month's usage
SELECT count FROM usage_tracking
WHERE user_id = '...'
  AND usage_type = 'ai_meal_analysis'
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
```

## Implementation Guide

### 1. Setup RevenueCat Dashboard

1. Create products:
   - `pro_monthly` - $9.99/month
   - `premium_monthly` - $19.99/month

2. Create entitlements:
   - `pro` - Pro tier entitlement
   - `premium` - Premium tier entitlement

3. Create offering with both products

4. Link to App Store/Play Store products

### 2. Setup Supabase Database

Run the SQL schema file in Supabase SQL editor:

```bash
# Run SUPABASE_SUBSCRIPTION_SCHEMA.sql in Supabase SQL editor
```

### 3. Feature Gating

Use the feature gating utilities to check access:

```javascript
import { hasFeatureAccess, FEATURES } from '../utils/featureGating';
import { useRevenueCat } from '../contexts/RevenueCatContext';

function MyComponent() {
  const { subscriptionTier } = useRevenueCat();
  
  const canExport = hasFeatureAccess(
    FEATURES.EXPORTABLE_PLANS.key, 
    subscriptionTier
  );
  
  if (!canExport) {
    return <UpgradePrompt />;
  }
  
  return <ExportButton />;
}
```

### 4. Usage Tracking

Track Free tier usage:

```javascript
import { recordUsage, canPerformAction } from '../services/usageTracking';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { USAGE_TYPES } from '../services/usageTracking';

async function handleMealAnalysis() {
  const { subscriptionTier } = useRevenueCat();
  const userId = user?.id;
  
  // Check if user can perform action
  const canPerform = await canPerformAction(
    userId,
    subscriptionTier,
    USAGE_TYPES.AI_MEAL_ANALYSIS,
    10 // Free tier limit
  );
  
  if (!canPerform.canPerform) {
    Alert.alert(
      'Limit Reached',
      `You've used ${canPerform.usageCount}/10 analyses this month. Upgrade to Pro for unlimited!`
    );
    return;
  }
  
  // Perform analysis
  await performAnalysis();
  
  // Record usage (only for Free tier)
  if (subscriptionTier === SUBSCRIPTION_TIERS.FREE) {
    await recordUsage(userId, USAGE_TYPES.AI_MEAL_ANALYSIS);
  }
}
```

### 5. Protect Features with ProGate

```javascript
import { ProGate } from '../components/ProGate';
import { useNavigation } from '@react-navigation/native';

function PremiumFeatureScreen() {
  const navigation = useNavigation();
  
  return (
    <ProGate
      requiredTier="premium"
      onUpgrade={() => navigation.navigate('Subscription')}
      message="AI Nutrition Coach is available in Premium tier."
    >
      <AICoachComponent />
    </ProGate>
  );
}
```

### 6. Check Subscription Tier

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { SUBSCRIPTION_TIERS } from '../services/revenuecat';

function MyComponent() {
  const { subscriptionTier, isPro, isPremium } = useRevenueCat();
  
  if (subscriptionTier === SUBSCRIPTION_TIERS.FREE) {
    return <FreeTierUI />;
  } else if (subscriptionTier === SUBSCRIPTION_TIERS.PRO) {
    return <ProTierUI />;
  } else {
    return <PremiumTierUI />;
  }
}
```

## API Integration

### Check Subscription Status

The subscription status is automatically synced via RevenueCat context. To manually check:

```javascript
const { subscriptionStatus, subscriptionTier } = useRevenueCat();
```

### Usage Limits

Check usage before performing actions:

```javascript
const { subscriptionTier } = useRevenueCat();
const usageResult = await getMonthlyUsage(userId, USAGE_TYPES.AI_MEAL_ANALYSIS);

if (subscriptionTier === SUBSCRIPTION_TIERS.FREE && usageResult.count >= 10) {
  // Show upgrade prompt
}
```

## RevenueCat Configuration

### Product Identifiers

- Pro Monthly: `pro_monthly`
- Premium Monthly: `premium_monthly`

### Entitlement Identifiers

- Pro: `pro`
- Premium: `premium`

### API Key

Set in `src/services/revenuecat.js`:
```javascript
const REVENUECAT_API_KEY = 'your-api-key-here';
```

## Security Considerations

1. **Server-Side Validation**: Always validate subscription status server-side before granting access
2. **Usage Tracking**: Track usage server-side to prevent manipulation
3. **RLS Policies**: Use Row Level Security in Supabase to protect user data
4. **Webhook Validation**: Set up RevenueCat webhooks for server-side validation

## Testing

### Test Accounts

1. **iOS**: Use sandbox test accounts from App Store Connect
2. **Android**: Add test accounts in Google Play Console

### Test Scenarios

- [ ] Free tier user can perform 10 analyses
- [ ] Free tier user is blocked after 10 analyses
- [ ] Pro tier user has unlimited analyses
- [ ] Premium tier user has all features
- [ ] Subscription purchase works
- [ ] Restore purchases works
- [ ] Subscription cancellation works
- [ ] Feature gating works correctly
- [ ] Usage tracking resets monthly

## Pricing Justification

### Free Tier ($0)
- Acquires users and builds habit
- Limited features encourage upgrade
- Ad revenue (if applicable)

### Pro Tier ($9.99/month)
- Competitive with similar apps ($9.99-$14.99 range)
- Removes limitations
- Ad-free experience
- Advanced features

### Premium Tier ($19.99/month)
- Double Pro price for premium features
- AI coach adds significant value
- Export and analytics for serious users
- Priority processing

## Feature Gating Matrix

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| AI Meal Logging | 10/month | Unlimited | Unlimited |
| Basic Nutrients | ✅ | ✅ | ✅ |
| Detailed Nutrients | ❌ | ✅ | ✅ |
| 3-Day Plans | ✅ | ✅ | ✅ |
| 7/14-Day Plans | ❌ | ✅ | ✅ |
| 30/45-Day Plans | ❌ | ❌ | ✅ |
| Community View | ✅ | ✅ | ✅ |
| Community Post | ❌ | ✅ | ✅ |
| Grocery Lists | ❌ | ❌ | ✅ |
| AI Coach | ❌ | ❌ | ✅ |
| Export Plans | ❌ | ❌ | ✅ |
| Priority Processing | ❌ | ❌ | ✅ |
| Ad-Free | ❌ | ✅ | ✅ |

## Next Steps

1. **Configure RevenueCat Dashboard**
   - Add products and entitlements
   - Create offering

2. **Setup App Store Products**
   - Configure in App Store Connect
   - Configure in Google Play Console

3. **Run Database Schema**
   - Execute `SUPABASE_SUBSCRIPTION_SCHEMA.sql`

4. **Test Integration**
   - Test purchases with sandbox accounts
   - Verify feature gating
   - Test usage tracking

5. **Add to App**
   - Link subscription screen in navigation
   - Add subscription status to profile
   - Protect premium features

## Support

- RevenueCat Docs: https://docs.revenuecat.com/
- Supabase Docs: https://supabase.com/docs
- Implementation Questions: See code comments

---

**Status**: ✅ Complete and ready for testing!
