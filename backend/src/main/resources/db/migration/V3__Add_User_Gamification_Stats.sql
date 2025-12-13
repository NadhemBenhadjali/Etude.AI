-- Add gamification stats to client table
ALTER TABLE client
ADD COLUMN total_quizzes INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN highest_score INTEGER DEFAULT 0 NOT NULL;
