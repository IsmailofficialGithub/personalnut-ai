-- Supabase Schema for Subscription System
-- Run this SQL in your Supabase SQL editor to set up the subscription tables

-- ============================================
-- USAGE TRACKING TABLE
-- ============================================
-- Tracks monthly usage for Free tier users (e.g., AI meal analyses)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user per usage type per month
  CONSTRAINT unique_user_usage_month UNIQUE (user_id, usage_type, DATE_TRUNC('month', created_at))
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_type ON usage_tracking(user_id, usage_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on usage_tracking
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUBSCRIPTION HISTORY TABLE (Optional)
-- ============================================
-- Track subscription changes for analytics
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  revenuecat_user_id TEXT,
  product_identifier TEXT,
  purchase_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT idx_subscription_history_user_id ON subscription_history(user_id),
  CONSTRAINT idx_subscription_history_tier ON subscription_history(subscription_tier)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- ============================================
-- USER SUBSCRIPTION CACHE TABLE (Optional)
-- ============================================
-- Cache subscription tier to avoid hitting RevenueCat API on every request
CREATE TABLE IF NOT EXISTS user_subscription_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  revenuecat_user_id TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for last_synced_at to find stale cache entries
CREATE INDEX IF NOT EXISTS idx_user_subscription_cache_last_synced ON user_subscription_cache(last_synced_at);

-- Trigger to update updated_at on user_subscription_cache
DROP TRIGGER IF EXISTS update_user_subscription_cache_updated_at ON user_subscription_cache;
CREATE TRIGGER update_user_subscription_cache_updated_at
  BEFORE UPDATE ON user_subscription_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscription_cache ENABLE ROW LEVEL SECURITY;

-- Usage Tracking Policies
-- Users can read and write their own usage tracking
CREATE POLICY "Users can view own usage tracking"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage tracking"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage tracking"
  ON usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscription History Policies
-- Users can read their own subscription history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to insert subscription history (for webhooks)
CREATE POLICY "Service role can manage subscription history"
  ON subscription_history FOR ALL
  USING (auth.role() = 'service_role');

-- User Subscription Cache Policies
-- Users can read their own subscription cache
CREATE POLICY "Users can view own subscription cache"
  ON user_subscription_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to manage subscription cache (for webhooks)
CREATE POLICY "Service role can manage subscription cache"
  ON user_subscription_cache FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current month's usage count
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID, p_usage_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND usage_type = p_usage_type
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_usage_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_month_start TIMESTAMPTZ := DATE_TRUNC('month', NOW());
BEGIN
  INSERT INTO usage_tracking (user_id, usage_type, count, created_at)
  VALUES (p_user_id, p_usage_type, 1, v_month_start)
  ON CONFLICT (user_id, usage_type, DATE_TRUNC('month', created_at))
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = NOW()
  RETURNING count INTO v_count;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (for testing/admin purposes)
CREATE OR REPLACE FUNCTION reset_monthly_usage(p_user_id UUID, p_usage_type TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM usage_tracking
  WHERE user_id = p_user_id
    AND usage_type = p_usage_type
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS FOR ANALYTICS (Optional)
-- ============================================

-- View for current month's usage summary
CREATE OR REPLACE VIEW monthly_usage_summary AS
SELECT 
  user_id,
  usage_type,
  SUM(count) as total_count,
  DATE_TRUNC('month', created_at) as month
FROM usage_tracking
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
GROUP BY user_id, usage_type, DATE_TRUNC('month', created_at);

-- View for subscription tier distribution
CREATE OR REPLACE VIEW subscription_tier_distribution AS
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_subscription_cache) as percentage
FROM user_subscription_cache
GROUP BY subscription_tier;

-- ============================================
-- GRANTS
-- ============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON usage_tracking TO authenticated;
GRANT SELECT ON subscription_history TO authenticated;
GRANT SELECT ON user_subscription_cache TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE usage_tracking IS 'Tracks monthly usage for Free tier users (e.g., AI meal analyses)';
COMMENT ON TABLE subscription_history IS 'Historical record of subscription changes';
COMMENT ON TABLE user_subscription_cache IS 'Cached subscription tier to reduce API calls to RevenueCat';
COMMENT ON COLUMN usage_tracking.usage_type IS 'Type of usage: ai_meal_analysis, etc.';
COMMENT ON COLUMN subscription_history.subscription_tier IS 'free, pro, or premium';
COMMENT ON COLUMN user_subscription_cache.subscription_tier IS 'free, pro, or premium';
