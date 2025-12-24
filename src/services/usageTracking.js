import { supabase } from './supabase';
import { SUBSCRIPTION_TIERS } from './revenuecat';

/**
 * Usage Tracking Service
 * 
 * Tracks monthly usage for Free tier users (e.g., AI meal analyses)
 */

const USAGE_TYPES = {
  AI_MEAL_ANALYSIS: 'ai_meal_analysis',
};

/**
 * Get current month's usage count for a user
 * @param {string} userId - User ID
 * @param {string} usageType - Type of usage to track
 * @returns {Promise<{success: boolean, count: number, error?: any}>}
 */
export const getMonthlyUsage = async (userId, usageType = USAGE_TYPES.AI_MEAL_ANALYSIS) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('count')
      .eq('user_id', userId)
      .eq('usage_type', usageType)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    const count = data?.count || 0;
    return { success: true, count };
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    return { success: false, count: 0, error };
  }
};

/**
 * Record a usage event
 * @param {string} userId - User ID
 * @param {string} usageType - Type of usage
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const recordUsage = async (userId, usageType = USAGE_TYPES.AI_MEAL_ANALYSIS) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check if record exists for this month
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('id, count')
      .eq('user_id', userId)
      .eq('usage_type', usageType)
      .gte('created_at', startOfMonth.toISOString())
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('usage_tracking')
        .update({ 
          count: existing.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          usage_type: usageType,
          count: 1,
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording usage:', error);
    return { success: false, error };
  }
};

/**
 * Check if user can perform an action based on their tier and usage
 * @param {string} userId - User ID
 * @param {string} subscriptionTier - User's subscription tier
 * @param {string} usageType - Type of usage
 * @param {number} freeTierLimit - Limit for free tier
 * @returns {Promise<{success: boolean, canPerform: boolean, usageCount?: number, limit?: number, error?: any}>}
 */
export const canPerformAction = async (
  userId,
  subscriptionTier,
  usageType = USAGE_TYPES.AI_MEAL_ANALYSIS,
  freeTierLimit = 10
) => {
  try {
    // Pro and Premium users have unlimited usage
    if (subscriptionTier === SUBSCRIPTION_TIERS.PRO || subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM) {
      return { success: true, canPerform: true };
    }

    // Free tier users have limits
    const usageResult = await getMonthlyUsage(userId, usageType);
    if (!usageResult.success) {
      return { success: false, canPerform: false, error: usageResult.error };
    }

    const canPerform = usageResult.count < freeTierLimit;
    return {
      success: true,
      canPerform,
      usageCount: usageResult.count,
      limit: freeTierLimit,
    };
  } catch (error) {
    console.error('Error checking if user can perform action:', error);
    return { success: false, canPerform: false, error };
  }
};

/**
 * Get usage statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: any}>}
 */
export const getUsageStats = async (userId) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    const stats = {};
    data.forEach((record) => {
      stats[record.usage_type] = record.count;
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return { success: false, error };
  }
};

export { USAGE_TYPES };
