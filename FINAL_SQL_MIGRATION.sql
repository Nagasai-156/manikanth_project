-- FINAL MIGRATION: Add all required columns for simplified form
-- Run this in Supabase SQL Editor

-- Add new simplified columns
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS overall_experience TEXT,
ADD COLUMN IF NOT EXISTS technical_rounds TEXT,
ADD COLUMN IF NOT EXISTS hr_rounds TEXT,
ADD COLUMN IF NOT EXISTS tips_and_advice TEXT,
ADD COLUMN IF NOT EXISTS campus_type VARCHAR(50) CHECK (campus_type IN ('On-Campus', 'Off-Campus'));

-- Update existing data
UPDATE experiences 
SET 
  overall_experience = COALESCE(rounds_overview, ''),
  technical_rounds = COALESCE(technical_questions, ''),
  hr_rounds = COALESCE(hr_questions, ''),
  tips_and_advice = COALESCE(preparation_strategy || E'\n\n' || advice, preparation_strategy, advice, ''),
  campus_type = 'On-Campus'
WHERE overall_experience IS NULL;

-- Add comments
COMMENT ON COLUMN experiences.overall_experience IS 'General description of the interview process';
COMMENT ON COLUMN experiences.technical_rounds IS 'Details about technical/coding rounds';
COMMENT ON COLUMN experiences.hr_rounds IS 'Details about HR/behavioral rounds';
COMMENT ON COLUMN experiences.tips_and_advice IS 'Preparation tips and advice for future candidates';
COMMENT ON COLUMN experiences.campus_type IS 'Whether interview was on-campus or off-campus';
