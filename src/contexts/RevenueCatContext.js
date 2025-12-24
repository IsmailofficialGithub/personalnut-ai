import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  initializeRevenueCat,
  getCustomerInfo,
  hasActiveEntitlement,
  getOfferings,
  purchasePackage,
  restorePurchases,
  logOut as rcLogOut,
  logIn as rcLogIn,
  getSubscriptionStatus,
  getSubscriptionTier,
  hasProAccess,
  hasPremiumAccess,
  SUBSCRIPTION_TIERS,
} from '../services/revenuecat';
import { useAuth } from './AuthContext';

const RevenueCatContext = createContext({});

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

export const RevenueCatProvider = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState(SUBSCRIPTION_TIERS.FREE);
  const [isPro, setIsPro] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);

  // Initialize RevenueCat
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize with user ID if logged in
      const userId = user?.id || null;
      const result = await initializeRevenueCat(userId);

      if (!result.success) {
        // Don't throw - just log and continue without RevenueCat
        console.warn('RevenueCat initialization failed:', result.error);
        setError(result.error);
        setIsInitialized(false);
        setLoading(false);
        return;
      }

      setIsInitialized(true);

      // Load initial data only if initialization was successful
      // Call refresh functions directly without the isInitialized check since we just initialized
      try {
        // Directly fetch data without checking isInitialized (we just set it)
        const [customerResult, offeringsResult] = await Promise.all([
          getCustomerInfo(),
          getOfferings(),
        ]);

        if (customerResult.success) {
          setCustomerInfo(customerResult.data);
          
          // Get subscription tier
          const tierResult = await getSubscriptionTier();
          if (tierResult.success) {
            setSubscriptionTier(tierResult.tier);
            setIsPro(tierResult.tier === SUBSCRIPTION_TIERS.PRO || tierResult.tier === SUBSCRIPTION_TIERS.PREMIUM);
            setIsPremium(tierResult.tier === SUBSCRIPTION_TIERS.PREMIUM);
          }

          // Get subscription status
          const statusResult = await getSubscriptionStatus();
          if (statusResult.success) {
            setSubscriptionStatus(statusResult);
          }
        }

        if (offeringsResult.success) {
          setOfferings(offeringsResult.data);
        }
      } catch (refreshError) {
        console.warn('Error loading initial RevenueCat data:', refreshError);
        // Don't fail initialization if refresh fails
      }
    } catch (err) {
      console.error('Error initializing RevenueCat:', err);
      setError(err);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    if (!isInitialized) {
      return; // Don't try to refresh if not initialized
    }
    try {
      const result = await getCustomerInfo();
      if (result.success) {
        setCustomerInfo(result.data);
        
        // Get subscription tier
        const tierResult = await getSubscriptionTier();
        if (tierResult.success) {
          setSubscriptionTier(tierResult.tier);
          setIsPro(tierResult.tier === SUBSCRIPTION_TIERS.PRO || tierResult.tier === SUBSCRIPTION_TIERS.PREMIUM);
          setIsPremium(tierResult.tier === SUBSCRIPTION_TIERS.PREMIUM);
        }

        // Get subscription status
        const statusResult = await getSubscriptionStatus();
        if (statusResult.success) {
          setSubscriptionStatus(statusResult);
        }
      } else {
        throw result.error;
      }
    } catch (err) {
      console.error('Error refreshing customer info:', err);
      setError(err);
    }
  }, [isInitialized]);

  // Refresh offerings
  const refreshOfferings = useCallback(async () => {
    if (!isInitialized) {
      return; // Don't try to refresh if not initialized
    }
    try {
      const result = await getOfferings();
      if (result.success) {
        setOfferings(result.data);
      } else {
        throw result.error;
      }
    } catch (err) {
      console.error('Error refreshing offerings:', err);
      setError(err);
    }
  }, [isInitialized]);

  // Purchase a package
  const purchase = useCallback(async (pkg) => {
    try {
      setLoading(true);
      setError(null);

      const result = await purchasePackage(pkg);
      
      if (result.success) {
        // Refresh customer info after purchase
        await refreshCustomerInfo();
        return { success: true, customerInfo: result.data };
      } else {
        throw result.error;
      }
    } catch (err) {
      console.error('Error purchasing package:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [refreshCustomerInfo]);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await restorePurchases();
      
      if (result.success) {
        await refreshCustomerInfo();
        return { success: true, customerInfo: result.data };
      } else {
        throw result.error;
      }
    } catch (err) {
      console.error('Error restoring purchases:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [refreshCustomerInfo]);

  // Log in user to RevenueCat
  const logIn = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await rcLogIn(userId);
      
      if (result.success) {
        await refreshCustomerInfo();
        return { success: true, customerInfo: result.data };
      } else {
        throw result.error;
      }
    } catch (err) {
      console.error('Error logging in to RevenueCat:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [refreshCustomerInfo]);

  // Log out user from RevenueCat
  const logOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await rcLogOut();
      
      if (result.success) {
        setCustomerInfo(null);
        setSubscriptionTier(SUBSCRIPTION_TIERS.FREE);
        setIsPro(false);
        setIsPremium(false);
        setSubscriptionStatus(null);
        return { success: true, customerInfo: result.data };
      } else {
        throw result.error;
      }
    } catch (err) {
      console.error('Error logging out from RevenueCat:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize when user changes
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    } else if (user && customerInfo?.originalAppUserId !== user.id) {
      // User changed, log in to RevenueCat
      logIn(user.id);
    } else if (!user && customerInfo) {
      // User logged out, log out from RevenueCat
      logOut();
    }
  }, [user, isInitialized, initialize, logIn, logOut, customerInfo]);

  // Set up customer info listener
  useEffect(() => {
    if (!isInitialized) return;

    // Refresh customer info periodically (every 5 minutes)
    const interval = setInterval(() => {
      refreshCustomerInfo();
    }, 5 * 60 * 1000);

    // Refresh when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshCustomerInfo();
      }
    });

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [isInitialized, refreshCustomerInfo]);

  const value = {
    // State
    isInitialized,
    loading,
    customerInfo,
    offerings,
    subscriptionTier,
    isPro,
    isPremium,
    subscriptionStatus,
    error,

    // Methods
    refreshCustomerInfo,
    refreshOfferings,
    purchase,
    restore,
    logIn,
    logOut,
    initialize,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};
