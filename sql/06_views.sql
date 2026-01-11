-- View for user stats with aggregated data
CREATE OR REPLACE VIEW user_stats_view AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.points,
    p.streak,
    p.accuracy,
    p.study_time,
    p.mastered_topics,
    COUNT(s.id) AS problems_solved,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = p.id) AS badges_earned
FROM profiles p
LEFT JOIN solutions s ON s.user_id = p.id
GROUP BY p.id;

-- View for leaderboard with rank
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.points,
    p.streak,
    p.accuracy,
    RANK() OVER (ORDER BY p.points DESC) AS rank
FROM profiles p
ORDER BY p.points DESC;

-- View for recent solutions with topic counts
CREATE OR REPLACE VIEW solution_topics_view AS
SELECT 
    user_id,
    topic,
    COUNT(*) AS count,
    MAX(created_at) AS last_solved
FROM solutions
GROUP BY user_id, topic;
