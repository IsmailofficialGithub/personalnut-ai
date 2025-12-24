# RevenueCat Integration Guide

This document provides a comprehensive guide to using RevenueCat SDK in the Software Developer app.

## Overview

RevenueCat has been fully integrated into the app with the following features:
- ✅ Subscription management
- ✅ Entitlement checking for "Software Developer Pro"
- ✅ RevenueCat Paywall UI
- ✅ Customer Center
- ✅ Product configuration (Monthly, Yearly, Lifetime)
- ✅ Automatic customer info sync
- ✅ Purchase restoration

## Installation

1. **Install the required packages:**
   ```bash
   npm install
   ```
   
   The following packages are already added to `package.json`:
   - `react-native-purchases` (already installed)
   - `react-native-purchases-ui` (added)

2. **Configure RevenueCat Dashboard:**
   - Go to https://app.revenuecat.com
   - Create/configure your products:
     - Monthly subscription: `monthly`
     - Yearly subscription: `yearly`
     - Lifetime purchase: `lifetime`
   - Create an entitlement: `Software Developer Pro`
   - Create an offering that includes all three products
   - Make sure to configure products in both App Store Connect (iOS) and Google Play Console (Android)

## Configuration

### API Key
The API key is configured in `src/services/revenuecat.js`:
```javascript
const REVENUECAT_API_KEY = 'test_tUeeGEYHHcDpRIWYeqOdTvXRyMm';
```

**⚠️ Important:** Replace the test API key with your production key before releasing to production.

### Product Identifiers
Product identifiers are defined in `src/services/revenuecat.js`:
- `monthly` - Monthly subscription
- `yearly` - Yearly subscription
- `lifetime` - Lifetime purchase

### Entitlement Identifier
The entitlement identifier is `Software Developer Pro` and is used throughout the app to check for premium access.

## Usage

### 1. Basic Setup

The RevenueCat provider is already integrated into `App.js`. The SDK will automatically:
- Initialize when the app starts
- Link purchases to the logged-in user
- Sync customer info when the app comes to foreground
- Refresh subscription status every 5 minutes

### 2. Check if User Has Pro Access

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

function MyComponent() {
  const { isPro, loading } = useRevenueCat();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isPro) {
    return <PremiumFeature />;
  } else {
    return <UpgradePrompt />;
  }
}
```

### 3. Navigate to Subscription Screen

```javascript
import { useNavigation } from '@react-navigation/native';

function MyScreen() {
  const navigation = useNavigation();
  
  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };
  
  return (
    <Button title="Upgrade to Pro" onPress={handleUpgrade} />
  );
}
```

### 4. Use ProGate Component

The `ProGate` component automatically shows an upgrade prompt for non-Pro users:

```javascript
import { ProGate } from '../components/ProGate';
import { useNavigation } from '@react-navigation/native';

function PremiumFeatureScreen() {
  const navigation = useNavigation();
  
  return (
    <ProGate
      onUpgrade={() => navigation.navigate('Subscription')}
      message="This feature requires Software Developer Pro."
    >
      {/* Your premium content here */}
      <View>
        <Text>This is a premium feature!</Text>
      </View>
    </ProGate>
  );
}
```

### 5. Show Subscription Status

Use the `SubscriptionStatus` component to display current subscription status:

```javascript
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { useNavigation } from '@react-navigation/native';

function ProfileScreen() {
  const navigation = useNavigation();
  
  return (
    <View>
      <SubscriptionStatus 
        onPress={() => navigation.navigate('Subscription')} 
      />
    </View>
  );
}
```

### 6. Open Customer Center

The Customer Center allows users to view their subscription details and manage purchases:

```javascript
import { useState } from 'react';
import { CustomerCenter } from '../components/CustomerCenter';

function SettingsScreen() {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  
  return (
    <>
      <Button 
        title="Manage Subscription" 
        onPress={() => setShowCustomerCenter(true)} 
      />
      
      <CustomerCenter 
        visible={showCustomerCenter}
        onClose={() => setShowCustomerCenter(false)}
      />
    </>
  );
}
```

### 7. Use RevenueCat Paywall

The subscription screen includes both custom UI and RevenueCat's built-in paywall. The paywall can be shown by tapping the "View All Plans" button.

The paywall is also available programmatically:

```javascript
import { PurchasesPaywall } from 'react-native-purchases-ui';
import { useRevenueCat } from '../contexts/RevenueCatContext';

function PaywallScreen() {
  const { offerings } = useRevenueCat();
  const currentOffering = offerings?.current;
  
  if (!currentOffering) return null;
  
  return (
    <PurchasesPaywall
      offering={currentOffering}
      onPurchaseCompleted={(customerInfo) => {
        // Handle successful purchase
        console.log('Purchase successful!', customerInfo);
      }}
      onPurchaseError={(error) => {
        // Handle purchase error (user cancelled is handled automatically)
        console.error('Purchase error:', error);
      }}
    />
  );
}
```

## API Reference

### RevenueCat Context Hook

```javascript
const {
  // State
  isInitialized,      // boolean - SDK initialization status
  loading,            // boolean - Loading state
  customerInfo,       // CustomerInfo object
  offerings,          // Offerings object
  isPro,              // boolean - Has active entitlement
  subscriptionStatus, // Subscription status object
  error,              // Error object
  
  // Methods
  refreshCustomerInfo, // () => Promise<void>
  refreshOfferings,    // () => Promise<void>
  purchase,            // (package) => Promise<{success, customerInfo}>
  restore,             // () => Promise<{success, customerInfo}>
  logIn,               // (userId) => Promise<{success, customerInfo}>
  logOut,              // () => Promise<{success, customerInfo}>
  initialize,          // () => Promise<void>
} = useRevenueCat();
```

### Subscription Status Object

```javascript
{
  success: boolean,
  hasActiveSubscription: boolean,
  isLifetime: boolean,
  expirationDate: string | null,
  productIdentifier: string | null,
  willRenew: boolean | null,
}
```

## Error Handling

All purchase operations include proper error handling:

- **User Cancelled**: No error is shown (user intentionally cancelled)
- **Purchase Failed**: Shows user-friendly error message
- **Network Errors**: Automatically retried where appropriate
- **Invalid Receipt**: Shows error with instructions

## Best Practices

1. **Always check `isPro` before showing premium features**
   ```javascript
   const { isPro } = useRevenueCat();
   if (!isPro) {
     // Show upgrade prompt
   }
   ```

2. **Use ProGate for feature gates**
   - Automatically handles loading states
   - Consistent upgrade prompt UI
   - Easy to implement

3. **Refresh customer info after purchase**
   - Happens automatically via context
   - Can be manually triggered with `refreshCustomerInfo()`

4. **Handle loading states**
   ```javascript
   const { loading, isPro } = useRevenueCat();
   if (loading) return <LoadingSpinner />;
   ```

5. **Provide restore purchases option**
   - Always available in Customer Center
   - Also available in Subscription screen

6. **Link purchases to user ID**
   - Automatically handled when user logs in
   - Purchases are restored when user logs in with same account

## Testing

### Sandbox Testing

1. **iOS:**
   - Use sandbox test accounts in App Store Connect
   - Test purchases won't be charged
   - Products must be configured in App Store Connect

2. **Android:**
   - Use test accounts in Google Play Console
   - Add test accounts to license testing
   - Products must be configured in Google Play Console

### Testing Checklist

- [ ] Initialize SDK on app start
- [ ] Check entitlement status
- [ ] Purchase monthly subscription
- [ ] Purchase yearly subscription
- [ ] Purchase lifetime
- [ ] Restore purchases
- [ ] Check expiration dates
- [ ] Handle expired subscriptions
- [ ] Test on both iOS and Android
- [ ] Test with logged-out users
- [ ] Test user login/logout flow

## Troubleshooting

### SDK Not Initializing
- Check API key is correct
- Verify network connection
- Check console logs for errors

### Purchases Not Working
- Verify products are configured in RevenueCat dashboard
- Check product identifiers match exactly
- Ensure products are approved in App Store/Play Store
- Verify test accounts are set up correctly

### Entitlement Not Active
- Check entitlement identifier matches exactly: `Software Developer Pro`
- Verify products are linked to entitlement in RevenueCat dashboard
- Check customer info for entitlement status

### Customer Info Not Updating
- App automatically refreshes when coming to foreground
- Can manually refresh with `refreshCustomerInfo()`
- Check for network errors

## Production Checklist

Before releasing to production:

- [ ] Replace test API key with production key
- [ ] Configure all products in App Store Connect
- [ ] Configure all products in Google Play Console
- [ ] Test all purchase flows in production environment
- [ ] Set up webhooks for server-side validation (optional)
- [ ] Configure customer support integration
- [ ] Test restore purchases flow
- [ ] Verify entitlement checking works correctly
- [ ] Test subscription cancellation flow
- [ ] Set up analytics tracking (optional)

## Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat React Native SDK](https://docs.revenuecat.com/docs/getting-started/installation/reactnative)
- [RevenueCat Paywalls](https://docs.revenuecat.com/docs/tools/paywalls)
- [RevenueCat Customer Center](https://docs.revenuecat.com/docs/tools/customer-center)
- [RevenueCat Support](https://www.revenuecat.com/support)

## Support

For issues or questions:
1. Check RevenueCat dashboard for transaction logs
2. Review console logs for errors
3. Consult RevenueCat documentation
4. Contact RevenueCat support if needed
