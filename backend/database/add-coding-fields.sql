-- Add coding challenges and enhanced interview fields to experiences table

-- Coding challenge fields
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS coding_platform VARCHAR(100);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS easy_problems INTEGER DEFAULT 0;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS medium_problems INTEGER DEFAULT 0;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS hard_problems INTEGER DEFAULT 0;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS coding_duration VARCHAR(100);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS programming_languages VARCHAR(500);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS additional_topics TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS behavioral_questions TEXT;

-- Add constraints for problem counts
ALTER TABLE experiences ADD CONSTRAINT IF NOT EXISTS check_easy_problems CHECK (easy_problems >= 0 AND easy_problems <= 20);
ALTER TABLE experiences ADD CONSTRAINT IF NOT EXISTS check_medium_problems CHECK (medium_problems >= 0 AND medium_problems <= 20);
ALTER TABLE experiences ADD CONSTRAINT IF NOT EXISTS check_hard_problems CHECK (hard_problems >= 0 AND hard_problems <= 20);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_experiences_coding_platform ON experiences(coding_platform);
CREATE INDEX IF NOT EXISTS idx_experiences_difficulty_breakdown ON experiences(easy_problems, medium_problems, hard_problems);