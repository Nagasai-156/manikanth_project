-- Enhanced schema to support multiple rounds and detailed interview structure

-- Create interview_rounds table to store multiple rounds per experience
CREATE TABLE IF NOT EXISTS interview_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    round_type VARCHAR(50) NOT NULL CHECK (round_type IN ('Aptitude', 'Coding', 'Technical', 'HR', 'Group Discussion', 'Presentation', 'Case Study', 'Managerial')),
    round_number INTEGER NOT NULL,
    round_name VARCHAR(255),
    description TEXT,
    duration VARCHAR(100),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    result VARCHAR(50) CHECK (result IN ('Passed', 'Failed', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coding_challenges table for detailed coding round information
CREATE TABLE IF NOT EXISTS coding_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
    platform VARCHAR(100),
    problem_title VARCHAR(255),
    problem_description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    topics TEXT[], -- Array of topics like ['Arrays', 'Dynamic Programming']
    time_limit VARCHAR(50),
    programming_languages TEXT[],
    solution_approach TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technical_questions table for technical interview questions
CREATE TABLE IF NOT EXISTS technical_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    category VARCHAR(100), -- e.g., 'System Design', 'Database', 'OOP'
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    answer_approach TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hr_questions table for HR and behavioral questions
CREATE TABLE IF NOT EXISTS hr_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(50), -- e.g., 'Behavioral', 'Situational', 'Company-specific'
    answer_tips TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_rounds_experience_id ON interview_rounds(experience_id);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_type ON interview_rounds(round_type);
CREATE INDEX IF NOT EXISTS idx_coding_challenges_round_id ON coding_challenges(round_id);
CREATE INDEX IF NOT EXISTS idx_technical_questions_round_id ON technical_questions(round_id);
CREATE INDEX IF NOT EXISTS idx_hr_questions_round_id ON hr_questions(round_id);

-- Add unique constraint to prevent duplicate round numbers per experience
CREATE UNIQUE INDEX IF NOT EXISTS idx_experience_round_number ON interview_rounds(experience_id, round_number);

-- Update experiences table to remove redundant fields (these will be in separate tables now)
-- Note: We'll keep the original fields for backward compatibility and migration
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS has_detailed_rounds BOOLEAN DEFAULT FALSE;