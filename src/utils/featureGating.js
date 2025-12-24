import { SUBSCRIPTION_TIERS } from '../services/revenuecat';

/**
 * Feature Gating Utilities
 * 
 * This module provides utilities to check if a user has access to specific features
 * based on their subscription tier.
 */

// Feature definitions with required tier
export const FEATURES = {
  // Free tier features
  VIEW_COMMUNITY: { tier: SUBSCRIPTION_TIERS.FREE, name: 'View Community Posts' },
  BASIC_NUTRIENTS: { tier: SUBSCRIPTION_TIERS.FREE, name: 'Basic Nutrients' },
  BASIC_CALORIES: { tier: SUBSCRIPTION_TIERS.FREE, name: 'Basic Calories' },
  SIMPLE_3_DAY_PLANS: { tier: SUBSCRIPTION_TIERS.FREE, name: 'Simple 3-Day Diet Plans' },
  LIMITED_AI_LOGGING: { tier: SUBSCRIPTION_TIERS.FREE, name: 'Limited AI Meal Logging' },
  
  // Pro tier features (requires Pro or Premium)
  UNLIMITED_AI_LOGGING: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Unlimited AI Meal Logging' },
  DETAILED_NUTRIENTS: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Detailed Nutrients' },
  QUANTITY_APPROXIMATION: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Quantity Approximation' },
  SUITABILITY_ANALYSIS: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Suitability Analysis' },
  ALLERGY_SUGGESTIONS: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Allergy Suggestions' },
  ADVANCED_DIET_PLANS: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Advanced Diet Plans (7/14 day)' },
  DIET_TEMPLATES: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Diet Templates' },
  FULL_COMMUNITY_ACCESS: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Full Community Access' },
  AD_FREE: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Ad-Free Experience' },
  FASTER_AI_PROCESSING: { tier: SUBSCRIPTION_TIERS.PRO, name: 'Faster AI Processing' },
  
  // Premium tier features (requires Premium)
  GROCERY_LIST_GENERATOR: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'Grocery List Generator' },
  AUTOMATIC_DIET_GENERATION: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'Automatic Diet Generation (30/45 days)' },
  NUTRITION_INSIGHTS: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'Nutrition Insights & Progress Charts' },
  AI_COACH: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'AI Personal Nutrition Coach' },
  PRIORITY_AI_QUEUE: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'Priority AI Queue' },
  EXPORTABLE_PLANS: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'Exportable Diet Plans (PDF/CSV)' },
  ADVANCED_HEALTH_INSIGHTS: { tier: SUBSCRIPTION_TIERS.PREMIUM, name: 'Advanced Health Condition Insights' },
};

/**
 * Check if a user has access to a specific feature
 * @param {string} featureKey - Key from FEATURES object
 * @param {string} userTier - User's subscription tier (FREE, PRO, PREMIUM)
 * @returns {boolean} - True if user has access
 */
export const hasFeatureAccess = (featureKey, userTier) => {
  const feature = FEATURES[featureKey];
  if (!feature) {
    console.warn(`Feature ${featureKey} not found`);
    return false;
  }

  const tierLevels = {
    [SUBSCRIPTION_TIERS.FREE]: 0,
    [SUBSCRIPTION_TIERS.PRO]: 1,
    [SUBSCRIPTION_TIERS.PREMIUM]: 2,
  };

  const userLevel = tierLevels[userTier] || 0;
  const requiredLevel = tierLevels[feature.tier] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Get all features available to a user based on their tier
 * @param {string} userTier - User's subscription tier
 * @returns {Array} - Array of feature keys the user has access to
 */
export const getAvailableFeatures = (userTier) => {
  return Object.keys(FEATURES).filter((key) => 
    hasFeatureAccess(key, userTier)
  );
};

/**
 * Get features that require an upgrade
 * @param {string} userTier - User's current subscription tier
 * @param {string} targetTier - Target tier to show features for
 * @returns {Array} - Array of feature objects requiring upgrade
 */
export const getUpgradeFeatures = (userTier, targetTier = SUBSCRIPTION_TIERS.PREMIUM) => {
  return Object.entries(FEATURES)
    .filter(([key, feature]) => {
      const tierLevels = {
        [SUBSCRIPTION_TIERS.FREE]: 0,
        [SUBSCRIPTION_TIERS.PRO]: 1,
        [SUBSCRIPTION_TIERS.PREMIUM]: 2,
      };
      const userLevel = tierLevels[userTier] || 0;
      const requiredLevel = tierLevels[feature.tier] || 0;
      const targetLevel = tierLevels[targetTier] || 0;
      
      return requiredLevel > userLevel && requiredLevel <= targetLevel;
    })
    .map(([key, feature]) => ({ key, ...feature }));
};

/**
 * Feature-specific checks
 */

// Check if user can perform AI meal analysis
export const canPerformAIAnalysis = (userTier, monthlyUsage = 0) => {
  if (userTier === SUBSCRIPTION_TIERS.FREE) {
    return monthlyUsage < 10; // Free tier: 10 analyses/month
  }
  // Pro and Premium have unlimited
  return true;
};

// Check if user can create advanced diet plans
export const canCreateAdvancedDietPlan = (userTier, planDays) => {
  if (planDays <= 3) {
    return true; // Everyone can create 3-day plans
  }
  if (planDays <= 14) {
    return userTier === SUBSCRIPTION_TIERS.PRO || userTier === SUBSCRIPTION_TIERS.PREMIUM;
  }
  // 30 and 45 day plans require Premium
  return userTier === SUBSCRIPTION_TIERS.PREMIUM;
};

// Check if user can export diet plans
export const canExportDietPlan = (userTier) => {
  return userTier === SUBSCRIPTION_TIERS.PREMIUM;
};

// Check if user has ad-free experience
export const hasAdFree = (userTier) => {
  return userTier === SUBSCRIPTION_TIERS.PRO || userTier === SUBSCRIPTION_TIERS.PREMIUM;
};

// Check if user can use AI coach
export const canUseAICoach = (userTier) => {
  return userTier === SUBSCRIPTION_TIERS.PREMIUM;
};

// Check if user has priority AI processing
export const hasPriorityProcessing = (userTier) => {
  return userTier === SUBSCRIPTION_TIERS.PREMIUM;
};
