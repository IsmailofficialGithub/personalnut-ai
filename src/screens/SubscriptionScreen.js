import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { PurchasesPaywall } from 'react-native-purchases-ui';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useTheme } from '../contexts/ThemeContext';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { SUBSCRIPTION_TIERS } from '../services/revenuecat';

// Tier feature definitions
const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: '$0',
    pricePeriod: '',
    features: [
      'Limited AI meal logging by image (10 analyses/month)',
      'Basic nutrient breakdown',
      'Basic calorie estimate',
      'View community posts',
      'Create only simple 3-day diet plans',
      'Limited AI recommendations',
      'Ads shown',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$9.99',
    pricePeriod: '/month',
    features: [
      'Unlimited AI meal image logging',
      'Detailed nutrient and calorie estimation',
      'Quantity approximation',
      'Suitability analysis (diabetes, hypertension, etc.)',
      'Allergy-based suggestions',
      'Create 3-day, 7-day, and 14-day diet plans',
      'Weight loss, weight gain, healthy diet templates',
      'Full community access (post, comment, react)',
      'Ad-free',
      'Faster AI processing',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$19.99',
    pricePeriod: '/month',
    features: [
      'Everything in Pro',
      'Grocery list generator (per plan)',
      'Automatic diet generation for 3/7/14/30/45 days',
      'Long-term nutrition insights + progress charts',
      'AI personal nutrition coach (chat)',
      'Priority AI processing queue',
      'Exportable diet plans (PDF/CSV)',
      'Advanced symptoms & health-condition insights',
    ],
  },
};

export const SubscriptionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    offerings,
    subscriptionTier,
    loading,
    purchase,
    restore,
    refreshOfferings,
    subscriptionStatus,
  } = useRevenueCat();

  const [showPaywall, setShowPaywall] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    refreshOfferings();
  }, []);

  const handlePurchase = async (tier) => {
    if (tier === SUBSCRIPTION_TIERS.FREE) {
      Alert.alert('Free Tier', 'You are already on the Free tier!');
      return;
    }

    try {
      setPurchasing(true);
      setSelectedTier(tier);

      // Find the package for this tier
      const currentOffering = offerings?.current;
      if (!currentOffering) {
        throw new Error('No offerings available');
      }

      let targetPackage = null;
      if (tier === SUBSCRIPTION_TIERS.PRO) {
        // Find Pro monthly package
        targetPackage = currentOffering.availablePackages.find(
          (pkg) => pkg.identifier.includes('pro') || pkg.product.identifier === 'pro_monthly'
        );
      } else if (tier === SUBSCRIPTION_TIERS.PREMIUM) {
        // Find Premium monthly package
        targetPackage = currentOffering.availablePackages.find(
          (pkg) => pkg.identifier.includes('premium') || pkg.product.identifier === 'premium_monthly'
        );
      }

      if (!targetPackage) {
        Alert.alert(
          'Package Not Found',
          `The ${tier} package is not available. Please try again later.`
        );
        return;
      }

      const result = await purchase(targetPackage);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `Your ${TIER_FEATURES[tier].name} subscription has been activated!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (result.error?.cancelled) {
        // User cancelled, no need to show error
      } else {
        Alert.alert(
          'Purchase Failed',
          result.error?.message || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
      setSelectedTier(null);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restore();
      
      if (result.success) {
        if (subscriptionTier !== SUBSCRIPTION_TIERS.FREE) {
          Alert.alert('Success', 'Your purchases have been restored!');
        } else {
          Alert.alert('No Purchases Found', 'No active purchases were found to restore.');
        }
      } else {
        Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while restoring.');
      console.error('Restore error:', error);
    }
  };

  const currentOffering = offerings?.current;

  if (showPaywall && currentOffering) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowPaywall(false)}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <PurchasesPaywall
          offering={currentOffering}
          onPurchaseCompleted={(customerInfo) => {
            setShowPaywall(false);
            Alert.alert(
              'Success!',
              'Your subscription has been activated!',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }}
          onPurchaseError={(error) => {
            if (!error.userCancelled) {
              Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase.');
            }
          }}
          onRestoreCompleted={(customerInfo) => {
            setShowPaywall(false);
            Alert.alert('Success', 'Your purchases have been restored!');
          }}
          onRestoreError={(error) => {
            Alert.alert('Restore Failed', error.message || 'Unable to restore purchases.');
          }}
        />
      </View>
    );
  }

  if (loading && !offerings) {
    return (
      <PageContainer>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading subscriptions...</Text>
        </View>
      </PageContainer>
    );
  }

  const currentTier = subscriptionTier || SUBSCRIPTION_TIERS.FREE;

  return (
    <PageContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Your Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlock powerful nutrition tools and insights
          </Text>
        </View>

        {/* Current Status */}
        {currentTier !== SUBSCRIPTION_TIERS.FREE && (
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {TIER_FEATURES[currentTier].name} Active
              </Text>
              {subscriptionStatus?.expirationDate && (
                <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                  Renews: {new Date(subscriptionStatus.expirationDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tier Cards */}
        <View style={styles.tiersContainer}>
          {/* Free Tier */}
          <View style={[styles.tierCard, { backgroundColor: colors.card }]}>
            <View style={styles.tierHeader}>
              <Text style={[styles.tierName, { color: colors.text }]}>Free</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text }]}>$0</Text>
              </View>
            </View>
            <View style={styles.featuresContainer}>
              {TIER_FEATURES.free.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={16} color={colors.textSecondary} />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
            </View>
            {currentTier === SUBSCRIPTION_TIERS.FREE && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}
          </View>

          {/* Pro Tier */}
          <View 
            style={[
              styles.tierCard, 
              styles.popularCard,
              { 
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderWidth: currentTier === SUBSCRIPTION_TIERS.PRO ? 2 : 1,
              }
            ]}
          >
            {currentTier !== SUBSCRIPTION_TIERS.PRO && (
              <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <Text style={[styles.tierName, { color: colors.text }]}>Pro</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text }]}>$9.99</Text>
                <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/month</Text>
              </View>
            </View>
            <View style={styles.featuresContainer}>
              {TIER_FEATURES.pro.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                </View>
              ))}
            </View>
            <Button
              title={currentTier === SUBSCRIPTION_TIERS.PRO ? 'Current Plan' : 'Upgrade to Pro'}
              onPress={() => handlePurchase(SUBSCRIPTION_TIERS.PRO)}
              disabled={currentTier === SUBSCRIPTION_TIERS.PRO || purchasing}
              loading={purchasing && selectedTier === SUBSCRIPTION_TIERS.PRO}
              style={styles.upgradeButton}
            />
            {currentTier === SUBSCRIPTION_TIERS.PRO && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}
          </View>

          {/* Premium Tier */}
          <View 
            style={[
              styles.tierCard,
              { 
                backgroundColor: colors.card,
                borderColor: currentTier === SUBSCRIPTION_TIERS.PREMIUM ? colors.primary : colors.border,
                borderWidth: currentTier === SUBSCRIPTION_TIERS.PREMIUM ? 2 : 1,
              }
            ]}
          >
            <View style={styles.tierHeader}>
              <Text style={[styles.tierName, { color: colors.text }]}>Premium</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text }]}>$19.99</Text>
                <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/month</Text>
              </View>
            </View>
            <View style={styles.featuresContainer}>
              {TIER_FEATURES.premium.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                </View>
              ))}
            </View>
            <Button
              title={currentTier === SUBSCRIPTION_TIERS.PREMIUM ? 'Current Plan' : 'Upgrade to Premium'}
              onPress={() => handlePurchase(SUBSCRIPTION_TIERS.PREMIUM)}
              disabled={currentTier === SUBSCRIPTION_TIERS.PREMIUM || purchasing}
              loading={purchasing && selectedTier === SUBSCRIPTION_TIERS.PREMIUM}
              style={styles.upgradeButton}
              variant={currentTier === SUBSCRIPTION_TIERS.PREMIUM ? 'outline' : 'primary'}
            />
            {currentTier === SUBSCRIPTION_TIERS.PREMIUM && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}
          </View>
        </View>

        {/* Use RevenueCat Paywall Button */}
        {currentOffering && (
          <Button
            title="View All Plans (RevenueCat Paywall)"
            onPress={() => setShowPaywall(true)}
            style={styles.paywallButton}
            variant="outline"
          />
        )}

        {/* Restore Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of
            the current period. Manage your subscriptions in your account settings.
          </Text>
        </View>
      </ScrollView>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
  },
  statusContent: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
  },
  tiersContainer: {
    marginBottom: 24,
  },
  tierCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
  },
  tierHeader: {
    marginBottom: 20,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  upgradeButton: {
    marginTop: 8,
  },
  currentBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  paywallButton: {
    marginBottom: 16,
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});