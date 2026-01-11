-- AI usage logging + quotas + roles + student links

-- 1) Extend profiles with difficulty level (student preference)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT NOT NULL DEFAULT 'standard';

-- 2) AI usage events (cost monitoring)
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('solve', 'chat')),
  model TEXT,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6),
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_usage_events_user_time_idx
  ON ai_usage_events (user_id, created_at DESC);

-- 3) Quotas (daily token limit; can be expanded later)
CREATE TABLE IF NOT EXISTS ai_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_token_limit INTEGER NOT NULL DEFAULT 50000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Track usage per day (materialized via view; compute from events)
CREATE OR REPLACE VIEW ai_daily_usage_view AS
SELECT
  user_id,
  DATE(created_at) AS day,
  SUM(total_tokens)::INTEGER AS tokens_used
FROM ai_usage_events
GROUP BY user_id, DATE(created_at);

-- Current quota status for today
CREATE OR REPLACE VIEW ai_quota_status_view AS
SELECT
  q.user_id,
  q.daily_token_limit,
  COALESCE(u.tokens_used, 0)::INTEGER AS tokens_used_today,
  GREATEST(q.daily_token_limit - COALESCE(u.tokens_used, 0), 0)::INTEGER AS tokens_remaining_today
FROM ai_quotas q
LEFT JOIN ai_daily_usage_view u
  ON u.user_id = q.user_id AND u.day = CURRENT_DATE;

-- Atomic-ish quota consumption helper.
-- We "consume" by checking current usage and returning allowance; Edge Functions still log events separately.
CREATE OR REPLACE FUNCTION consume_ai_quota(user_uuid UUID, tokens_to_consume INTEGER)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_tokens INTEGER,
  retry_after_seconds INTEGER
) AS $$
DECLARE
  limit_tokens INTEGER;
  used_tokens INTEGER;
BEGIN
  SELECT q.daily_token_limit INTO limit_tokens
  FROM ai_quotas q
  WHERE q.user_id = user_uuid;

  IF limit_tokens IS NULL THEN
    -- default quota if row not present
    limit_tokens := 50000;
    INSERT INTO ai_quotas (user_id, daily_token_limit)
    VALUES (user_uuid, limit_tokens)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  SELECT COALESCE(tokens_used, 0) INTO used_tokens
  FROM ai_daily_usage_view
  WHERE user_id = user_uuid AND day = CURRENT_DATE;

  IF used_tokens + tokens_to_consume > limit_tokens THEN
    allowed := false;
    remaining_tokens := GREATEST(limit_tokens - used_tokens, 0);
    retry_after_seconds := EXTRACT(EPOCH FROM (date_trunc('day', now()) + INTERVAL '1 day' - now()))::INTEGER;
    RETURN NEXT;
    RETURN;
  END IF;

  allowed := true;
  remaining_tokens := GREATEST(limit_tokens - (used_tokens + tokens_to_consume), 0);
  retry_after_seconds := NULL;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Roles + student linking
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role)
);

-- Who can view a student's data (parent/teacher relationship)
CREATE TABLE IF NOT EXISTS student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('parent', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, guardian_id, relationship)
);

-- 5) RLS
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI usage" ON ai_usage_events;
CREATE POLICY "Users can view their own AI usage"
  ON ai_usage_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own AI quotas" ON ai_quotas;
CREATE POLICY "Users can view their own AI quotas"
  ON ai_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- ai_quota_status_view selects from ai_quotas + ai_usage_events (both already restricted by RLS)

DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Guardians and students can view links" ON student_links;
CREATE POLICY "Guardians and students can view links"
  ON student_links FOR SELECT
  USING (auth.uid() = guardian_id OR auth.uid() = student_id);

-- Helpers: dashboard views
CREATE OR REPLACE VIEW guardian_students_view AS
SELECT
  sl.guardian_id,
  sl.relationship,
  p.id AS student_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.points,
  p.streak,
  p.accuracy,
  p.mastered_topics,
  p.updated_at
FROM student_links sl
JOIN profiles p ON p.id = sl.student_id;
