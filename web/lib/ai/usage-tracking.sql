-- SQL script to create the ai_extraction_usage table for tracking daily limits
-- Run this in your Supabase SQL editor

-- Create the usage tracking table
CREATE TABLE IF NOT EXISTS ai_extraction_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Optional: store metadata about the extraction
  problem_type TEXT CHECK (problem_type IN ('mcq', 'short', 'extended')),
  extraction_success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Index for efficient daily count queries
CREATE INDEX IF NOT EXISTS idx_ai_extraction_usage_user_date
  ON ai_extraction_usage(user_id, created_at DESC);

-- Index for cleanup/analytics
CREATE INDEX IF NOT EXISTS idx_ai_extraction_usage_created_at
  ON ai_extraction_usage(created_at DESC);

-- Row-level security policies
ALTER TABLE ai_extraction_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage records
CREATE POLICY "Users can view own extraction history"
  ON ai_extraction_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own usage records (done by API)
CREATE POLICY "Users can insert own extraction records"
  ON ai_extraction_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Optional: Auto-cleanup old records (keep last 30 days only)
-- This keeps the table small and respects user privacy
-- Run this as a scheduled job or manually as needed:
/*
DELETE FROM ai_extraction_usage
WHERE created_at < now() - interval '30 days';
*/

-- Helper function to get today's usage count for a user
CREATE OR REPLACE FUNCTION get_today_extraction_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM ai_extraction_usage
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;
$$;

-- Helper function to check if user has remaining uses today
CREATE OR REPLACE FUNCTION can_extract_today(p_user_id UUID, p_daily_limit INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT get_today_extraction_count(p_user_id) < p_daily_limit;
$$;

-- Example usage:
-- SELECT get_today_extraction_count(auth.uid());
-- SELECT can_extract_today(auth.uid(), 5);
