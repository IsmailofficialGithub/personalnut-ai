import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get RevenueCat API Key from environment variables
const REVENUECAT_API_KEY = 
  Constants.expoConfig?.extra?.REVENUECAT_API_KEY || 
  Constants.manifest?.extra?.REVENUECAT_API_KEY || 
  '';

if (!REVENUECAT_API_KEY) {
  console.error('REVENUECAT_API_KEY not found. Please check your app.config.js and .env file.');
}

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
};

// Entitlement identifiers
export const ENTITLEMENTS = {
  PRO: 'pro',
  PREMIUM: 'premium',
};

// Product identifiers
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'pro_monthly',
  PREMIUM_MONTHLY: 'premium_monthly',
};

/**
 * Initialize RevenueCat SDK
 * Call this once when your app starts
 */
export const initializeRevenueCat = async (userId) => {
  try {
    // Check if API key is available
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.trim() === '') {
      console.warn('RevenueCat API key is not configured. Subscription features will be disabled.');
      return { success: false, error: 'API key not configured' };
    }

    // Configure SDK based on platform
    try {
      if (Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } else if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } else {
        // Web or other platforms
        console.warn('RevenueCat is not supported on this platform');
        return { success: false, error: 'Platform not supported' };
      }
    } catch (configError) {
      console.error('RevenueCat configuration error:', configError);
      return { success: false, error: configError.message || 'Failed to configure RevenueCat SDK' };
    }

    // Set user ID if provided (for logged-in users)
    if (userId) {
      await Purchases.logIn(userId);
    }

    console.log('RevenueCat initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return { success: false, error };
  }
};

/**
 * Get customer info
 */
export const getCustomerInfo = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return { success: true, data: customerInfo };
  } catch (error) {
    console.error('Error getting customer info:', error);
    return { success: false, error };
  }
};

/**
 * Get user's subscription tier (FREE, PRO, or PREMIUM)
 */
export const getSubscriptionTier = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const activeEntitlements = customerInfo.entitlements.active;
    
    // Check for Premium entitlement first (highest tier)
    if (activeEntitlements[ENTITLEMENTS.PREMIUM]) {
      return { success: true, tier: SUBSCRIPTION_TIERS.PREMIUM };
    }
    
    // Check for Pro entitlement
    if (activeEntitlements[ENTITLEMENTS.PRO]) {
      return { success: true, tier: SUBSCRIPTION_TIERS.PRO };
    }
    
    // Default to Free tier
    return { success: true, tier: SUBSCRIPTION_TIERS.FREE };
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return { success: false, error, tier: SUBSCRIPTION_TIERS.FREE };
  }
};

/**
 * Check if user has active entitlement
 */
export const hasActiveEntitlement = async (entitlementId) => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isEntitled = customerInfo.entitlements.active[entitlementId] !== undefined;
    return { success: true, isEntitled };
  } catch (error) {
    console.error('Error checking entitlement:', error);
    return { success: false, error, isEntitled: false };
  }
};

/**
 * Check if user has Pro tier or higher
 */
export const hasProAccess = async () => {
  try {
    const tierResult = await getSubscriptionTier();
    if (!tierResult.success) return { success: false, hasAccess: false };
    
    const hasAccess = tierResult.tier === SUBSCRIPTION_TIERS.PRO || 
                     tierResult.tier === SUBSCRIPTION_TIERS.PREMIUM;
    return { success: true, hasAccess };
  } catch (error) {
    console.error('Error checking Pro access:', error);
    return { success: false, error, hasAccess: false };
  }
};

/**
 * Check if user has Premium tier
 */
export const hasPremiumAccess = async () => {
  try {
    const tierResult = await getSubscriptionTier();
    if (!tierResult.success) return { success: false, hasAccess: false };
    
    return { success: true, hasAccess: tierResult.tier === SUBSCRIPTION_TIERS.PREMIUM };
  } catch (error) {
    console.error('Error checking Premium access:', error);
    return { success: false, error, hasAccess: false };
  }
};

/**
 * Get available offerings (products)
 */
export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return { success: true, data: offerings };
  } catch (error) {
    console.error('Error getting offerings:', error);
    return { success: false, error };
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (pkg) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, data: customerInfo };
  } catch (error) {
    // Handle purchase errors
    if (error.userCancelled) {
      return { success: false, error: { message: 'Purchase cancelled by user', cancelled: true } };
    }
    
    // Check if already purchased
    if (error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR) {
      return { success: false, error: { message: 'Purchase is invalid', code: error.code } };
    }

    console.error('Error purchasing package:', error);
    return { success: false, error };
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, data: customerInfo };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error };
  }
};

/**
 * Log out current user
 */
export const logOut = async () => {
  try {
    const { customerInfo } = await Purchases.logOut();
    return { success: true, data: customerInfo };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error };
  }
};

/**
 * Log in user
 */
export const logIn = async (userId) => {
  try {
    const { customerInfo, created } = await Purchases.logIn(userId);
    return { success: true, data: customerInfo, created };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error };
  }
};

/**
 * Get active subscriptions
 */
export const getActiveSubscriptions = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const activeSubscriptions = [];
    
    Object.keys(customerInfo.entitlements.active).forEach((entitlementId) => {
      const entitlement = customerInfo.entitlements.active[entitlementId];
      activeSubscriptions.push({
        entitlementId,
        productIdentifier: entitlement.productIdentifier,
        expirationDate: entitlement.expirationDate,
        purchaseDate: entitlement.latestPurchaseDate,
        willRenew: entitlement.willRenew,
        periodType: entitlement.periodType,
      });
    });

    return { success: true, data: activeSubscriptions };
  } catch (error) {
    console.error('Error getting active subscriptions:', error);
    return { success: false, error };
  }
};

/**
 * Check subscription status
 */
export const getSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const tierResult = await getSubscriptionTier();
    
    if (!tierResult.success) {
      return { 
        success: false, 
        tier: SUBSCRIPTION_TIERS.FREE,
        hasActiveSubscription: false,
      };
    }

    const tier = tierResult.tier;
    
    // Get entitlement info for active subscription
    let entitlement = null;
    if (tier === SUBSCRIPTION_TIERS.PREMIUM) {
      entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
    } else if (tier === SUBSCRIPTION_TIERS.PRO) {
      entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    }

    if (!entitlement) {
      return { 
        success: true, 
        tier: SUBSCRIPTION_TIERS.FREE,
        hasActiveSubscription: false,
        expirationDate: null,
      };
    }

    return {
      success: true,
      tier,
      hasActiveSubscription: true,
      expirationDate: entitlement.expirationDate,
      productIdentifier: entitlement.productIdentifier,
      willRenew: entitlement.willRenew,
      purchaseDate: entitlement.latestPurchaseDate,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { success: false, error, tier: SUBSCRIPTION_TIERS.FREE };
  }
};
