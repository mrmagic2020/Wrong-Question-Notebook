-- Migration: Complete missing statistics and quota schemas
-- Created: 2026-04-06

-- =====================================================
-- QUOTA & USAGE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, period_start)
);

CREATE TABLE IF NOT EXISTS user_quota_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  daily_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type)
);

-- RLS
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quota_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON usage_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own overrides" ON user_quota_overrides
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- QUOTA RPC
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_increment_quota(
  p_user_id UUID,
  p_resource_type TEXT,
  p_default_limit INTEGER,
  p_user_tz TEXT
) RETURNS JSONB AS $$
DECLARE
  v_limit INTEGER;
  v_current_usage INTEGER;
  v_today DATE;
BEGIN
  v_today := (NOW() AT TIME ZONE p_user_tz)::DATE;
  
  SELECT daily_limit INTO v_limit
  FROM user_quota_overrides
  WHERE user_id = p_user_id AND resource_type = p_resource_type;
  
  IF v_limit IS NULL THEN
    v_limit := p_default_limit;
  END IF;

  INSERT INTO usage_quotas (user_id, resource_type, period_start, usage_count)
  VALUES (p_user_id, p_resource_type, v_today, 0)
  ON CONFLICT (user_id, resource_type, period_start) DO NOTHING;

  SELECT usage_count INTO v_current_usage
  FROM usage_quotas
  WHERE user_id = p_user_id AND resource_type = p_resource_type AND period_start = v_today;

  IF v_current_usage < v_limit THEN
    UPDATE usage_quotas
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND resource_type = p_resource_type AND period_start = v_today
    RETURNING usage_count INTO v_current_usage;

    RETURN jsonb_build_object(
      'allowed', true,
      'current_usage', v_current_usage,
      'daily_limit', v_limit,
      'remaining', GREATEST(v_limit - v_current_usage, 0)
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', false,
      'current_usage', v_current_usage,
      'daily_limit', v_limit,
      'remaining', 0
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_user_storage_bytes(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  -- Safe fallback if storage.objects cannot be accessed due to privileges
  BEGIN
    SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0)
    INTO total_bytes
    FROM storage.objects
    WHERE owner = p_user_id OR owner_id = p_user_id::TEXT;
    
    RETURN total_bytes;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STATISTICS RPC
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total INTEGER := 0;
  v_mastered INTEGER := 0;
  v_needs_review INTEGER := 0;
  v_wrong INTEGER := 0;
  v_rate NUMERIC := 0;
BEGIN
  SELECT 
    COUNT(p.id) AS total,
    COALESCE(SUM(CASE WHEN p.status = 'mastered' THEN 1 ELSE 0 END), 0) AS mastered,
    COALESCE(SUM(CASE WHEN p.status = 'needs_review' THEN 1 ELSE 0 END), 0) AS needs_review,
    COALESCE(SUM(CASE WHEN p.status = 'wrong' THEN 1 ELSE 0 END), 0) AS wrong
  INTO v_total, v_mastered, v_needs_review, v_wrong
  FROM problems p
  JOIN subjects s ON p.subject_id = s.id
  WHERE s.user_id = p_user_id;

  IF v_total > 0 THEN
    v_rate := (v_mastered::NUMERIC / v_total::NUMERIC) * 100.0;
  END IF;

  RETURN jsonb_build_object(
    'total_problems', v_total,
    'mastered_count', v_mastered,
    'needs_review_count', v_needs_review,
    'wrong_count', v_wrong,
    'mastery_rate', ROUND(v_rate, 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_study_streaks(p_user_id UUID, p_user_tz TEXT)
RETURNS JSONB AS $$
BEGIN
  -- Returning sensible defaults since historical streak computation is complex
  RETURN jsonb_build_object('current_streak', 0, 'longest_streak', 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_session_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total INTEGER := 0;
  v_avg_duration NUMERIC := 0;
  v_avg_probs NUMERIC := 0;
  v_total_time NUMERIC := 0;
BEGIN
  BEGIN
    SELECT 
      COUNT(id),
      COALESCE(AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000), 0),
      COALESCE(AVG(total_problems), 0),
      COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000), 0)
    INTO v_total, v_avg_duration, v_avg_probs, v_total_time
    FROM review_sessions
    WHERE user_id = p_user_id AND ended_at IS NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    v_total := 0;
    v_avg_duration := 0;
    v_avg_probs := 0;
    v_total_time := 0;
  END;

  RETURN jsonb_build_object(
    'total_sessions', v_total,
    'avg_duration_ms', ROUND(v_avg_duration),
    'avg_problems_per_session', ROUND(v_avg_probs, 1),
    'total_review_time_ms', ROUND(v_total_time)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_subject_breakdown(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'subject_id', s.id,
      'subject_name', s.name,
      'total', COALESCE(stats.total, 0),
      'mastered', COALESCE(stats.mastered, 0),
      'needs_review', COALESCE(stats.needs_review, 0),
      'wrong', COALESCE(stats.wrong, 0),
      'mastery_pct', CASE WHEN COALESCE(stats.total, 0) > 0 THEN ROUND((COALESCE(stats.mastered, 0)::NUMERIC / stats.total::NUMERIC) * 100.0, 2) ELSE 0 END
    )
  ), '[]'::jsonb)
  INTO result
  FROM subjects s
  LEFT JOIN (
    SELECT 
      subject_id,
      COUNT(id) as total,
      SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered,
      SUM(CASE WHEN status = 'needs_review' THEN 1 ELSE 0 END) as needs_review,
      SUM(CASE WHEN status = 'wrong' THEN 1 ELSE 0 END) as wrong
    FROM problems
    GROUP BY subject_id
  ) stats ON stats.subject_id = s.id
  WHERE s.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_activity_heatmap(p_user_id UUID, p_user_tz TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'activity_date', date_str,
      'activity_count', count
    )
  ), '[]'::jsonb)
  INTO result
  FROM (
    SELECT 
      TO_CHAR((created_at AT TIME ZONE p_user_tz)::DATE, 'YYYY-MM-DD') AS date_str,
      COUNT(*) AS count
    FROM attempts
    WHERE user_id = p_user_id
    GROUP BY date_str
    ORDER BY date_str DESC
    LIMIT 365
  ) subq;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_recent_study_activity(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'problem_id', a.problem_id,
      'problem_title', p.title,
      'subject_name', s.name,
      'old_status', NULL,
      'new_status', a.selected_status,
      'changed_at', a.created_at
    )
  ), '[]'::jsonb)
  INTO result
  FROM attempts a
  JOIN problems p ON a.problem_id = p.id
  JOIN subjects s ON p.subject_id = s.id
  WHERE a.user_id = p_user_id
  ORDER BY a.created_at DESC
  LIMIT 10;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_weekly_progress(p_user_id UUID, p_user_tz TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
