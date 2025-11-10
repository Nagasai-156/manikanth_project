-- Interview Experience Platform Database Schema
-- This file contains all the SQL commands to set up the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'interview_experience_platform_super_secret_jwt_key_2024_college_project';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(100),
    college VARCHAR(500) NOT NULL,
    degree VARCHAR(200) NOT NULL,
    course VARCHAR(200) NOT NULL,
    year VARCHAR(50) NOT NULL,
    profile_picture TEXT,
    bio TEXT,
    about TEXT,
    skills TEXT[], -- Array of skills
    resume_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    category VARCHAR(100) NOT NULL, -- Product, Service, Consulting, Fintech, etc.
    tier VARCHAR(50) NOT NULL, -- FAANG, Tier 1, Tier 2, Unicorn
    headquarters VARCHAR(255),
    founded_year INTEGER,
    employee_count VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    experience_type VARCHAR(50) NOT NULL CHECK (experience_type IN ('Internship', 'Full-Time', 'Apprenticeship')),
    result VARCHAR(50) NOT NULL CHECK (result IN ('Selected', 'Not Selected', 'Pending')),
    interview_date DATE,
    salary_offered DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    location VARCHAR(255),
    
    -- Interview details
    rounds_overview TEXT NOT NULL,
    technical_questions TEXT NOT NULL,
    hr_questions TEXT,
    preparation_strategy TEXT NOT NULL,
    advice TEXT NOT NULL,
    
    -- Additional details
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    would_recommend BOOLEAN,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement metrics
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested comments
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table (for experiences and comments)
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can like either experience or comment, not both
    CHECK (
        (experience_id IS NOT NULL AND comment_id IS NULL) OR 
        (experience_id IS NULL AND comment_id IS NOT NULL)
    ),
    
    -- Ensure user can only like once per item
    UNIQUE(user_id, experience_id),
    UNIQUE(user_id, comment_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can only bookmark once per experience
    UNIQUE(user_id, experience_id)
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure participants are different and unique conversation
    CHECK (participant1_id != participant2_id),
    UNIQUE(participant1_id, participant2_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- comment, like, message, experience_approved, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID of related entity (experience, comment, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    device_info TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college);
CREATE INDEX IF NOT EXISTS idx_users_course ON users(course);
CREATE INDEX IF NOT EXISTS idx_users_year ON users(year);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
CREATE INDEX IF NOT EXISTS idx_companies_tier ON companies(tier);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_company_id ON experiences(company_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_experience_type ON experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_experiences_result ON experiences(result);
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON experiences(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_experience_id ON comments(experience_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_experience_id ON likes(experience_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_experience_id ON bookmarks(experience_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default companies
INSERT INTO companies (name, slug, category, tier, description) VALUES
('Tata Consultancy Services', 'tcs', 'Service', 'Tier 1', 'Leading IT services and consulting company'),
('Infosys', 'infosys', 'Service', 'Tier 1', 'Global leader in next-generation digital services'),
('Amazon', 'amazon', 'Product', 'FAANG', 'Multinational technology company'),
('Microsoft', 'microsoft', 'Product', 'FAANG', 'Technology corporation'),
('Google', 'google', 'Product', 'FAANG', 'Multinational technology company'),
('Wipro', 'wipro', 'Service', 'Tier 1', 'Information technology services corporation'),
('Capgemini', 'capgemini', 'Service', 'Tier 1', 'French multinational IT consulting corporation'),
('Accenture', 'accenture', 'Consulting', 'Tier 1', 'Multinational professional services company'),
('IBM', 'ibm', 'Service', 'Tier 1', 'International technology corporation'),
('Cognizant', 'cognizant', 'Service', 'Tier 1', 'American multinational IT services company'),
('HCL Technologies', 'hcl', 'Service', 'Tier 2', 'Indian multinational IT services company'),
('Tech Mahindra', 'tech-mahindra', 'Service', 'Tier 2', 'Indian multinational IT services company'),
('Flipkart', 'flipkart', 'Product', 'Unicorn', 'Indian e-commerce company'),
('Paytm', 'paytm', 'Fintech', 'Unicorn', 'Indian digital payments company'),
('Zomato', 'zomato', 'Product', 'Unicorn', 'Indian restaurant aggregator and food delivery company')
ON CONFLICT (slug) DO NOTHING;

-- Create default admin user (password: admin123)
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    college, 
    degree, 
    course, 
    year, 
    role,
    is_verified
) VALUES (
    'admin@college.edu',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/...',
    'System Administrator',
    'System',
    'Administration',
    'System Administration',
    'Admin',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own data and public profile info of others
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Experiences policies
CREATE POLICY "Anyone can view approved experiences" ON experiences FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own experiences" ON experiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create experiences" ON experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiences" ON experiences FOR UPDATE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments on approved experiences" ON comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM experiences 
        WHERE experiences.id = comments.experience_id 
        AND experiences.status = 'approved'
    )
);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Authenticated users can manage likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
    )
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);