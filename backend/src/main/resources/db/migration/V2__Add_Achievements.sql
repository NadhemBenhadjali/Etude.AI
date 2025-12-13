-- Table: achievement
CREATE TABLE IF NOT EXISTS achievement (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    icon VARCHAR(255) NOT NULL,
    criteria_type VARCHAR(255) NOT NULL,
    criteria_value INTEGER NOT NULL
);

-- Table: user_achievement
CREATE TABLE IF NOT EXISTS user_achievement (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES client(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievement(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_achievement UNIQUE (user_id, achievement_id)
);

-- Initial Achievements
INSERT INTO achievement (id, name, description, icon, criteria_type, criteria_value) VALUES
(gen_random_uuid(), 'First Step', 'Complete your first study session', 'school', 'SESSION_COUNT', 1),
(gen_random_uuid(), 'Quiz Master', 'Complete 5 quizzes', 'quiz', 'QUIZ_COUNT', 5),
(gen_random_uuid(), 'Dedicated Scholar', 'Complete 10 study sessions', 'auto_stories', 'SESSION_COUNT', 10),
(gen_random_uuid(), 'Elo Climber', 'Reach 100 Elo points', 'trending_up', 'SCORE_REACHED', 100)
ON CONFLICT (name) DO NOTHING;
