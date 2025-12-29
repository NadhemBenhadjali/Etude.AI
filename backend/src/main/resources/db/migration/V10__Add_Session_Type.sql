-- V10__Add_Session_Type.sql
-- Add session_type column to session table to differentiate between QUIZ, QNA, and SUMMARY sessions

ALTER TABLE session ADD COLUMN session_type VARCHAR(50);

-- Set default type based on existing data (sessions with quiz elements = QUIZ, etc.)
-- For now, set all to QUIZ as default, you can update based on your actual data
UPDATE session SET session_type = 'QUIZ' WHERE session_type IS NULL;

-- Make the column non-nullable after setting values
ALTER TABLE session ALTER COLUMN session_type SET NOT NULL;

