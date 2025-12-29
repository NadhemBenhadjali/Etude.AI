-- V8__Add_User_QnA_And_Summary_Stats.sql
-- Add totalQna and totalSummaries columns to client table

ALTER TABLE client ADD COLUMN total_qna INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE client ADD COLUMN total_summaries INTEGER DEFAULT 0 NOT NULL;

-- Update existing users to have 0 values
UPDATE client SET total_qna = 0 WHERE total_qna IS NULL;
UPDATE client SET total_summaries = 0 WHERE total_summaries IS NULL;

