-- V7__update_achievement_icons_to_asset_paths.sql
-- Set achievement.icon to Angular asset paths (works for existing emojis and new installs)

-- Study sessions
UPDATE achievement
SET icon = '/assets/images/achievements/first-step.png'
WHERE criteria_type = 'SESSION_COUNT' AND criteria_value = 1;

UPDATE achievement
SET icon = '/assets/images/achievements/strong-start.png'
WHERE criteria_type = 'SESSION_COUNT' AND criteria_value = 3;

UPDATE achievement
SET icon = '/assets/images/achievements/dedicated-scholar.png'
WHERE criteria_type = 'SESSION_COUNT' AND criteria_value = 10;

UPDATE achievement
SET icon = '/assets/images/achievements/study-race.png'
WHERE criteria_type = 'SESSION_COUNT' AND criteria_value = 25;

UPDATE achievement
SET icon = '/assets/images/achievements/study-legend.png'
WHERE criteria_type = 'SESSION_COUNT' AND criteria_value = 50;

-- Quizzes
UPDATE achievement
SET icon = '/assets/images/achievements/first-quiz.png'
WHERE criteria_type = 'QUIZ_COUNT' AND criteria_value = 1;

UPDATE achievement
SET icon = '/assets/images/achievements/quiz-master.png'
WHERE criteria_type = 'QUIZ_COUNT' AND criteria_value = 5;

UPDATE achievement
SET icon = '/assets/images/achievements/quiz-expert.png'
WHERE criteria_type = 'QUIZ_COUNT' AND criteria_value = 10;

UPDATE achievement
SET icon = '/assets/images/achievements/quiz-legend.png'
WHERE criteria_type = 'QUIZ_COUNT' AND criteria_value = 25;

-- Elo milestones
UPDATE achievement
SET icon = '/assets/images/achievements/elo-100.png'
WHERE criteria_type = 'SCORE_REACHED' AND criteria_value = 100;

UPDATE achievement
SET icon = '/assets/images/achievements/elo-200.png'
WHERE criteria_type = 'SCORE_REACHED' AND criteria_value = 200;

UPDATE achievement
SET icon = '/assets/images/achievements/elo-300.png'
WHERE criteria_type = 'SCORE_REACHED' AND criteria_value = 300;

UPDATE achievement
SET icon = '/assets/images/achievements/elo-500.png'
WHERE criteria_type = 'SCORE_REACHED' AND criteria_value = 500;
