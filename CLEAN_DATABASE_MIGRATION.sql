-- CLEAN DATABASE MIGRATION
-- This adds required columns and removes unnecessary ones
-- Run this in Supabase SQL Editor

-- Add new columns if they don't exist
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS overall_experience TEXT,
ADD COLUMN IF NOT EXISTS technical_rounds TEXT,
ADD COLUMN IF NOT EXISTS hr_rounds TEXT,
ADD COLUMN IF NOT EXISTS tips_and_advice TEXT,
ADD COLUMN IF NOT EXISTS campus_type VARCHAR(50) CHECK (campus_type IN ('On-Campus', 'Off-Campus'));

-- Update existing data to populate new columns
UPDATE experiences 
SET 
  overall_experience = COALESCE(rounds_overview, ''),
  technical_rounds = COALESCE(technical_questions, ''),
  hr_rounds = COALESCE(hr_questions, ''),
  tips_and_advice = COALESCE(preparation_strategy, ''),
  campus_type = 'On-Campus'
WHERE overall_experience IS NULL;

-- Make title NOT NULL with default value for existing rows
UPDATE experiences SET title = role || ' Interview Experience' WHERE title IS NULL OR title = '';
ALTER TABLE experiences ALTER COLUMN title SET NOT NULL;

-- Drop unnecessary columns (optional - uncomment if you want to clean up)
-- ALTER TABLE experiences DROP COLUMN IF EXISTS salary_offered;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS currency;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS difficulty_level;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS overall_rating;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS would_recommend;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS rejection_reason;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS approved_by;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS approved_at;
-- ALTER TABLE experiences DROP COLUMN IF EXISTS bookmarks_count;

-- Add helpful comments
COMMENT ON COLUMN experiences.title IS 'Title of the interview experience';
COMMENT ON COLUMN experiences.role IS 'Job role/position';
COMMENT ON COLUMN experiences.experience_type IS 'Type: Internship, Full-Time, or Apprenticeship';
COMMENT ON COLUMN experiences.campus_type IS 'On-Campus or Off-Campus';
COMMENT ON COLUMN experiences.result IS 'Interview result: Selected, Not Selected, or Pending';
COMMENT ON COLUMN experiences.overall_experience IS 'General description of the interview process';
COMMENT ON COLUMN experiences.technical_rounds IS 'Details about technical/coding rounds';
COMMENT ON COLUMN experiences.hr_rounds IS 'Details about HR/behavioral rounds';
COMMENT ON COLUMN experiences.tips_and_advice IS 'Preparation tips and advice';
