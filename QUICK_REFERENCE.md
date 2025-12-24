# Quick Reference Guide - Subscription System

## 🚀 Quick Start

### 1. Check Subscription Tier
```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

const { subscriptionTier, isPro, isPremium } = useRevenueCat();
// subscriptionTier: 'free', 'pro', or 'premium'
```

### 2. Protect a Premium Feature
```javascript
import { ProGate } from '../components/ProGate';

<ProGate 
  requiredTier="premium" 
  onUpgrade={() => navigation.navigate('Subscription')}
>
  <PremiumFeature />
</ProGate>
```

### 3. Check Feature Access
```javascript
import { hasFeatureAccess, FEATURES } from '../utils/featureGating';
import { useRevenueCat } from '../contexts/RevenueCatContext';

const { subscriptionTier } = useRevenueCat();
const canExport = hasFeatureAccess(
  'EXPORTABLE_PLANS', 
  subscriptionTier
);
```

### 4. Check Usage Before Action
```javascript
import { canPerformAction, USAGE_TYPES } from '../services/usageTracking';
import { useRevenueCat } from '../contexts/RevenueCatContext';

const { subscriptionTier } = useRevenueCat();
const result = await canPerformAction(
  userId,
  subscriptionTier,
  USAGE_TYPES.AI_MEAL_ANALYSIS,
  10 // Free tier limit
);

if (!result.canPerform) {
  // Show upgrade prompt
}
```

### 5. Record Usage
```javascript
import { recordUsage, USAGE_TYPES } from '../services/usageTracking';

// After performing action
await recordUsage(userId, USAGE_TYPES.AI_MEAL_ANALYSIS);
```

## 📋 Common Patterns

### Pattern 1: Check Tier Before Showing Feature
```javascript
const { subscriptionTier } = useRevenueCat();

if (subscriptionTier === 'premium') {
  return <AICoachFeature />;
}
return <UpgradePrompt />;
```

### Pattern 2: Track Usage for Free Tier
```javascript
const { subscriptionTier } = useRevenueCat();

// Check before action
if (subscriptionTier === 'free') {
  const canPerform = await canPerformAction(...);
  if (!canPerform.canPerform) {
    showUpgradePrompt();
    return;
  }
}

// Perform action
await performAction();

// Record usage
if (subscriptionTier === 'free') {
  await recordUsage(userId, USAGE_TYPES.AI_MEAL_ANALYSIS);
}
```

### Pattern 3: Show Different UI Based on Tier
```javascript
const { subscriptionTier } = useRevenueCat();

switch(subscriptionTier) {
  case 'free':
    return <FreeTierUI />;
  case 'pro':
    return <ProTierUI />;
  case 'premium':
    return <PremiumTierUI />;
}
```

### Pattern 4: Navigate to Subscription Screen
```javascript
navigation.navigate('Subscription');
```

## 🎯 Feature Keys Reference

Available feature keys in `FEATURES` object:

**Free Tier:**
- `VIEW_COMMUNITY`
- `BASIC_NUTRIENTS`
- `BASIC_CALORIES`
- `SIMPLE_3_DAY_PLANS`
- `LIMITED_AI_LOGGING`

**Pro Tier:**
- `UNLIMITED_AI_LOGGING`
- `DETAILED_NUTRIENTS`
- `QUANTITY_APPROXIMATION`
- `SUITABILITY_ANALYSIS`
- `ALLERGY_SUGGESTIONS`
- `ADVANCED_DIET_PLANS`
- `DIET_TEMPLATES`
- `FULL_COMMUNITY_ACCESS`
- `AD_FREE`
- `FASTER_AI_PROCESSING`

**Premium Tier:**
- `GROCERY_LIST_GENERATOR`
- `AUTOMATIC_DIET_GENERATION`
- `NUTRITION_INSIGHTS`
- `AI_COACH`
- `PRIORITY_AI_QUEUE`
- `EXPORTABLE_PLANS`
- `ADVANCED_HEALTH_INSIGHTS`

## 🔧 Helper Functions

### Check if Can Create Diet Plan
```javascript
import { canCreateAdvancedDietPlan } from '../utils/featureGating';

const canCreate = canCreateAdvancedDietPlan(subscriptionTier, 30);
// Returns true if user can create 30-day plan
```

### Check if Has Ad-Free
```javascript
import { hasAdFree } from '../utils/featureGating';

const adFree = hasAdFree(subscriptionTier);
// Returns true for Pro and Premium
```

### Check if Can Use AI Coach
```javascript
import { canUseAICoach } from '../utils/featureGating';

const canCoach = canUseAICoach(subscriptionTier);
// Returns true only for Premium
```

## 📊 Subscription Status Object

```javascript
const { subscriptionStatus } = useRevenueCat();

// subscriptionStatus contains:
{
  tier: 'free' | 'pro' | 'premium',
  hasActiveSubscription: boolean,
  expirationDate: string | null,
  productIdentifier: string | null,
  willRenew: boolean | null,
  purchaseDate: string | null,
}
```

## 🎨 UI Components

### Subscription Status Card
```javascript
import { SubscriptionStatus } from '../components/SubscriptionStatus';

<SubscriptionStatus 
  onPress={() => navigation.navigate('Subscription')} 
/>
```

### Customer Center Modal
```javascript
import { CustomerCenter } from '../components/CustomerCenter';

const [showCenter, setShowCenter] = useState(false);

<CustomerCenter 
  visible={showCenter}
  onClose={() => setShowCenter(false)}
/>
```

## 🗄️ Database Functions

### Get Monthly Usage
```sql
SELECT get_monthly_usage(user_id, 'ai_meal_analysis');
```

### Increment Usage
```sql
SELECT increment_usage(user_id, 'ai_meal_analysis');
```

## 🚨 Error Handling

### Purchase Errors
```javascript
const result = await purchase(package);
if (!result.success) {
  if (result.error?.cancelled) {
    // User cancelled - no action needed
  } else {
    // Show error message
    Alert.alert('Error', result.error?.message);
  }
}
```

### Usage Limit Reached
```javascript
if (!canPerform.canPerform) {
  Alert.alert(
    'Limit Reached',
    `You've used ${canPerform.usageCount}/${canPerform.limit} analyses this month.`
  );
}
```

## 📝 Constants Reference

### Subscription Tiers
```javascript
import { SUBSCRIPTION_TIERS } from '../services/revenuecat';

SUBSCRIPTION_TIERS.FREE    // 'free'
SUBSCRIPTION_TIERS.PRO     // 'pro'
SUBSCRIPTION_TIERS.PREMIUM // 'premium'
```

### Usage Types
```javascript
import { USAGE_TYPES } from '../services/usageTracking';

USAGE_TYPES.AI_MEAL_ANALYSIS // 'ai_meal_analysis'
```

## 🔗 Navigation

### Open Subscription Screen
```javascript
navigation.navigate('Subscription');
```

### Open Customer Center
```javascript
// From any screen
setShowCustomerCenter(true);
```

## 💡 Tips

1. **Always check tier before showing premium features**
2. **Track usage server-side for Free tier users**
3. **Show upgrade prompts when limits are reached**
4. **Sync subscription status on app foreground**
5. **Handle purchase cancellations gracefully**
6. **Cache subscription tier to reduce API calls**

## 📚 Full Documentation

- **Complete Guide**: `SUBSCRIPTION_SYSTEM_COMPLETE.md`
- **Database Schema**: `SUPABASE_SUBSCRIPTION_SCHEMA.sql`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
