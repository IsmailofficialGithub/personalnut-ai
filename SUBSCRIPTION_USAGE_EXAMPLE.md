# Subscription Usage Examples

This document provides practical examples of how to integrate RevenueCat subscription features into your app screens.

## Example 1: Adding Subscription Status to Profile Screen

Here's how to add subscription management to your ProfileScreen:

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { CustomerCenter } from '../components/CustomerCenter';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen = ({ navigation }) => {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  
  return (
    <ScrollView>
      {/* Other profile content */}
      
      {/* Subscription Status Card */}
      <SubscriptionStatus 
        onPress={() => navigation.navigate('Subscription')} 
      />
      
      {/* Customer Center Button */}
      <TouchableOpacity 
        onPress={() => setShowCustomerCenter(true)}
        style={styles.customerCenterButton}
      >
        <Text>Manage Subscription</Text>
      </TouchableOpacity>
      
      {/* Customer Center Modal */}
      <CustomerCenter 
        visible={showCustomerCenter}
        onClose={() => setShowCustomerCenter(false)}
      />
    </ScrollView>
  );
};
```

## Example 2: Protecting Premium Features

Use ProGate to wrap premium features:

```javascript
import { ProGate } from '../components/ProGate';
import { useNavigation } from '@react-navigation/native';

function PremiumFeatureScreen() {
  const navigation = useNavigation();
  
  return (
    <ProGate
      onUpgrade={() => navigation.navigate('Subscription')}
      message="Unlock this premium feature with Software Developer Pro!"
    >
      <View>
        <Text>This is a premium-only feature</Text>
        {/* Your premium content */}
      </View>
    </ProGate>
  );
}
```

## Example 3: Conditional Rendering Based on Subscription

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

function MyScreen() {
  const { isPro, loading, subscriptionStatus } = useRevenueCat();
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  return (
    <View>
      {isPro ? (
        <PremiumContent />
      ) : (
        <UpgradePrompt 
          onUpgrade={() => navigation.navigate('Subscription')}
        />
      )}
      
      {subscriptionStatus?.isLifetime && (
        <Text>You have lifetime access!</Text>
      )}
    </View>
  );
}
```

## Example 4: Checking Subscription Before API Calls

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

async function handlePremiumAction() {
  const { isPro } = useRevenueCat();
  
  if (!isPro) {
    Alert.alert(
      'Upgrade Required',
      'This feature requires Software Developer Pro.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade', 
          onPress: () => navigation.navigate('Subscription') 
        },
      ]
    );
    return;
  }
  
  // Proceed with premium action
  await performPremiumAction();
}
```

## Example 5: Custom Purchase Flow

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

function CustomPurchaseScreen() {
  const { offerings, purchase, loading } = useRevenueCat();
  const [purchasing, setPurchasing] = useState(false);
  
  const handlePurchase = async (pkg) => {
    setPurchasing(true);
    try {
      const result = await purchase(pkg);
      if (result.success) {
        Alert.alert('Success', 'Purchase completed!');
      }
    } catch (error) {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };
  
  const monthlyPackage = offerings?.current?.availablePackages.find(
    pkg => pkg.identifier.includes('monthly')
  );
  
  return (
    <Button
      title="Purchase Monthly"
      onPress={() => handlePurchase(monthlyPackage)}
      loading={purchasing}
      disabled={!monthlyPackage || purchasing}
    />
  );
}
```

## Example 6: Restore Purchases Button

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

function SettingsScreen() {
  const { restore, loading } = useRevenueCat();
  const [restoring, setRestoring] = useState(false);
  
  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restore();
      if (result.success) {
        Alert.alert('Success', 'Purchases restored successfully!');
      } else {
        Alert.alert('Error', 'No purchases found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };
  
  return (
    <Button
      title="Restore Purchases"
      onPress={handleRestore}
      loading={restoring}
      disabled={loading || restoring}
    />
  );
}
```

## Example 7: Subscription Expiration Handling

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useEffect } from 'react';

function SubscriptionMonitor() {
  const { subscriptionStatus, refreshCustomerInfo } = useRevenueCat();
  
  useEffect(() => {
    if (subscriptionStatus?.expirationDate) {
      const expirationDate = new Date(subscriptionStatus.expirationDate);
      const now = new Date();
      const daysUntilExpiration = Math.ceil(
        (expirationDate - now) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
        Alert.alert(
          'Subscription Expiring Soon',
          `Your subscription expires in ${daysUntilExpiration} days.`,
          [
            { text: 'Renew Now', onPress: () => navigation.navigate('Subscription') },
            { text: 'Later', style: 'cancel' },
          ]
        );
      }
    }
  }, [subscriptionStatus]);
  
  return null; // This is a background component
}
```

## Example 8: Feature Flag Based on Subscription

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';

function usePremiumFeature(featureName) {
  const { isPro } = useRevenueCat();
  
  // You can extend this to check specific entitlements or features
  return {
    isEnabled: isPro,
    requiresUpgrade: !isPro,
  };
}

function MyScreen() {
  const advancedFeature = usePremiumFeature('advanced');
  
  return (
    <View>
      {advancedFeature.isEnabled ? (
        <AdvancedFeatureComponent />
      ) : (
        <UpgradePrompt feature="Advanced Features" />
      )}
    </View>
  );
}
```

## Example 9: Navigation Guard

Protect navigation to premium screens:

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useEffect } from 'react';

function PremiumScreen({ navigation }) {
  const { isPro, loading } = useRevenueCat();
  
  useEffect(() => {
    if (!loading && !isPro) {
      Alert.alert(
        'Upgrade Required',
        'This screen requires Software Developer Pro.',
        [
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('Subscription') 
          },
          { 
            text: 'Go Back', 
            onPress: () => navigation.goBack(),
            style: 'cancel'
          },
        ]
      );
    }
  }, [isPro, loading, navigation]);
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  if (!isPro) {
    return null; // Will show alert and navigate back
  }
  
  return (
    <View>
      {/* Premium content */}
    </View>
  );
}
```

## Example 10: Subscription Status Badge

Create a subscription status badge component:

```javascript
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { View, Text } from 'react-native';

function SubscriptionBadge() {
  const { isPro, subscriptionStatus } = useRevenueCat();
  
  if (!isPro) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {subscriptionStatus?.isLifetime 
          ? 'PRO - Lifetime' 
          : 'PRO'}
      </Text>
    </View>
  );
}
```

These examples demonstrate various ways to integrate RevenueCat subscription features into your app. Choose the patterns that best fit your app's architecture and user experience.
