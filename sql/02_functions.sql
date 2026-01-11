-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    username TEXT,
    avatar_url TEXT,
    points INTEGER,
    streak INTEGER,
    accuracy NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.username, 
        p.avatar_url, 
        p.points, 
        p.streak, 
        p.accuracy
    FROM profiles p
    ORDER BY p.points DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats after a solution
CREATE OR REPLACE FUNCTION handle_solution_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update points and problem count
    UPDATE profiles
    SET 
        points = points + 10,
        mastered_topics = (SELECT count(DISTINCT topic) FROM solutions WHERE user_id = NEW.user_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for solution stats
CREATE TRIGGER on_solution_created
AFTER INSERT ON solutions
FOR EACH ROW
EXECUTE FUNCTION handle_solution_stats();

-- Function to update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    last_activity DATE;
    current_streak INTEGER;
BEGIN
    SELECT DATE(updated_at), streak INTO last_activity, current_streak
    FROM profiles WHERE id = user_uuid;
    
    IF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        UPDATE profiles SET streak = current_streak + 1, updated_at = CURRENT_TIMESTAMP WHERE id = user_uuid;
    ELSIF last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Missed a day, reset streak
        UPDATE profiles SET streak = 1, updated_at = CURRENT_TIMESTAMP WHERE id = user_uuid;
    END IF;
    -- If same day, do nothing
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset inactive streaks (run daily via cron)
CREATE OR REPLACE FUNCTION reset_inactive_streaks()
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET streak = 0, updated_at = CURRENT_TIMESTAMP
    WHERE DATE(updated_at) < CURRENT_DATE - INTERVAL '1 day'
    AND streak > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
