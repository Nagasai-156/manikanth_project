-- SIMPLIFIED EXPERIENCES TABLE SCHEMA
-- Drop existing table and recreate with simpler structure

DROP TABLE IF EXISTS experiences CASCADE;

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic Info (Required)
  role VARCHAR(255) NOT NULL,
  experience_type VARCHAR(50) NOT NULL CHECK (experience_type IN ('Internship', 'Full-Time', 'Apprenticeship')),
  result VARCHAR(50) NOT NULL CHECK (result IN ('Selected', 'Not Selected', 'Pending')),
  
  -- Optional Details
  interview_date DATE,
  location VARCHAR(255),
  
  -- Experience Content (All Optional)
  overall_experience TEXT,
  technical_rounds TEXT,
  hr_rounds TEXT,
  tips_and_advice TEXT,
  
  -- Metadata
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_experiences_company_id ON experiences(company_id);
CREATE INDEX idx_experiences_status ON experiences(status);
CREATE INDEX idx_experiences_experience_type ON experiences(experience_type);
CREATE INDEX idx_experiences_result ON experiences(result);
CREATE INDEX idx_experiences_created_at ON experiences(created_at DESC);

-- Enable Row Level Security
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view approved experiences
CREATE POLICY "Anyone can view approved experiences"
  ON experiences FOR SELECT
  USING (status = 'approved');

-- Users can view their own experiences
CREATE POLICY "Users can view own experiences"
  ON experiences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own experiences
CREATE POLICY "Users can insert own experiences"
  ON experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own experiences
CREATE POLICY "Users can update own experiences"
  ON experiences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own experiences
CREATE POLICY "Users can delete own experiences"
  ON experiences FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_experiences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS experiences_updated_at ON experiences;
CREATE TRIGGER experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_experiences_updated_at();

-- Comments
COMMENT ON TABLE experiences IS 'Simplified interview experiences shared by students';
COMMENT ON COLUMN experiences.overall_experience IS 'General description of the interview process';
COMMENT ON COLUMN experiences.technical_rounds IS 'Details about technical/coding rounds';
COMMENT ON COLUMN experiences.hr_rounds IS 'Details about HR/behavioral rounds';
COMMENT ON COLUMN experiences.tips_and_advice IS 'Preparation tips and advice for future candidates';
