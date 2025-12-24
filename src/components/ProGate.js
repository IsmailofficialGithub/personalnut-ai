import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { SUBSCRIPTION_TIERS } from '../services/revenuecat';
import { hasFeatureAccess, FEATURES } from '../utils/featureGating';

/**
 * ProGate Component
 * 
 * Shows a message and upgrade button when user doesn't have required tier access.
 * Use this to wrap premium features or as a fallback when user doesn't have access.
 * 
 * @param {Function} onUpgrade - Callback when user taps upgrade button
 * @param {ReactNode} children - Content to show if user has access
 * @param {string} message - Custom message to display
 * @param {boolean} showButton - Whether to show upgrade button (default: true)
 * @param {string} requiredTier - Required tier: 'pro' or 'premium' (default: 'pro')
 * @param {string} featureKey - Feature key from FEATURES object (alternative to requiredTier)
 */
export const ProGate = ({ 
  children, 
  onUpgrade, 
  message,
  showButton = true,
  requiredTier = SUBSCRIPTION_TIERS.PRO,
  featureKey,
}) => {
  const { colors } = useTheme();
  const { subscriptionTier, loading } = useRevenueCat();

  // Determine required tier
  let actualRequiredTier = requiredTier;
  if (featureKey && FEATURES[featureKey]) {
    actualRequiredTier = FEATURES[featureKey].tier;
    if (!message) {
      message = `${FEATURES[featureKey].name} is available in ${FEATURES[featureKey].tier === SUBSCRIPTION_TIERS.PREMIUM ? 'Premium' : 'Pro'} tier.`;
    }
  }

  // Default message
  if (!message) {
    if (actualRequiredTier === SUBSCRIPTION_TIERS.PREMIUM) {
      message = 'This feature is available in Premium tier.';
    } else {
      message = 'This feature is available in Pro tier.';
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  // Check access
  const hasAccess = hasFeatureAccess(featureKey, subscriptionTier) || 
                   (actualRequiredTier === SUBSCRIPTION_TIERS.PRO && 
                    (subscriptionTier === SUBSCRIPTION_TIERS.PRO || subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM)) ||
                   (actualRequiredTier === SUBSCRIPTION_TIERS.PREMIUM && 
                    subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM);

  if (hasAccess) {
    return children;
  }

  const tierName = actualRequiredTier === SUBSCRIPTION_TIERS.PREMIUM ? 'Premium' : 'Pro';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <Ionicons 
          name={actualRequiredTier === SUBSCRIPTION_TIERS.PREMIUM ? "star" : "lock-closed"} 
          size={48} 
          color={colors.primary} 
          style={styles.icon}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {tierName} Feature
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
        {showButton && onUpgrade && (
          <Button
            title={`Upgrade to ${tierName}`}
            onPress={onUpgrade}
            style={styles.button}
          />
        )}
        {subscriptionTier === SUBSCRIPTION_TIERS.FREE && actualRequiredTier === SUBSCRIPTION_TIERS.PREMIUM && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => onUpgrade && onUpgrade(SUBSCRIPTION_TIERS.PRO)}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Or upgrade to Pro first
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  },
  linkButton: {
    marginTop: 12,
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
  },
});

/**
 * Hook to check feature access
 * Use this in your components to conditionally render premium features
 */
export const useFeatureAccess = (featureKey) => {
  const { subscriptionTier, loading } = useRevenueCat();
  
  if (!featureKey) {
    return { hasAccess: false, loading };
  }

  const hasAccess = hasFeatureAccess(featureKey, subscriptionTier);
  
  return { 
    hasAccess, 
    loading,
    feature: FEATURES[featureKey],
    subscriptionTier,
  };
};

/**
 * Hook to check tier access
 */
export const useTierAccess = (requiredTier = SUBSCRIPTION_TIERS.PRO) => {
  const { subscriptionTier, loading, isPro, isPremium } = useRevenueCat();
  
  const tierLevels = {
    [SUBSCRIPTION_TIERS.FREE]: 0,
    [SUBSCRIPTION_TIERS.PRO]: 1,
    [SUBSCRIPTION_TIERS.PREMIUM]: 2,
  };

  const userLevel = tierLevels[subscriptionTier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;
  
  return {
    hasAccess: userLevel >= requiredLevel,
    loading,
    subscriptionTier,
    isPro,
    isPremium,
  };
};