-- Initial achievements data
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
('Math Whiz', 'Solve 10 math problems', 'calculate', 'Academic', 'topic_count_Math', 10),
('Lens Master', 'First 5 successful scans', 'camera_enhance', 'Special', 'total_scans', 5),
('7-Day Streak', 'Maintain a study streak for 7 days', 'local_fire_department', 'Streak', 'streak_days', 7),
('Historian', 'Solve 5 history problems', 'history_edu', 'Academic', 'topic_count_History', 5),
('Lab Pro', 'Solve 5 science problems', 'science', 'Academic', 'topic_count_Science', 5),
('Night Owl', 'Solve a problem between 10 PM and 4 AM', 'nightlight', 'Special', 'night_owl', 1),
('Critical Thinker', 'Use the AI chat for 5 different solutions', 'psychology', 'Special', 'chat_usage', 5),
('Global Linguist', 'Translate 5 pieces of text', 'language', 'Academic', 'topic_count_Translate', 5);
