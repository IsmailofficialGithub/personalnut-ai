-- ============================================
-- Enable Real-time for Notification Tables
-- ============================================
-- Run this in your Supabase SQL Editor to enable real-time
-- subscriptions for posts and food_entries tables
-- ============================================

-- Enable real-time for posts table
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
  END;
END $$;

-- Enable real-time for food_entries table
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE food_entries;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
  END;
END $$;

-- Verify real-time is enabled (optional check)
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' 
-- AND tablename IN ('posts', 'food_entries', 'post_comments', 'post_likes')
-- ORDER BY tablename;

