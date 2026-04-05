-- Migration: Create core tables for Wrong Question Notebook
-- Created: 2026-04-05

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE problem_type AS ENUM ('mcq', 'short', 'extended');
CREATE TYPE problem_status AS ENUM ('wrong', 'needs_review', 'mastered');
CREATE TYPE sharing_level AS ENUM ('private', 'limited', 'public');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- =====================================================
-- SUBJECTS TABLE (Notebooks)
-- =====================================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT 'blue',
  icon VARCHAR(50) DEFAULT 'BookOpen',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TAGS TABLE
-- =====================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, name)
);

-- =====================================================
-- PROBLEMS TABLE
-- =====================================================

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  problem_type problem_type NOT NULL DEFAULT 'mcq',
  correct_answer TEXT,
  answer_config JSONB,
  auto_mark BOOLEAN DEFAULT FALSE,
  status problem_status DEFAULT 'needs_review',
  assets JSONB DEFAULT '[]',
  solution_text TEXT,
  solution_assets JSONB DEFAULT '[]',
  last_reviewed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROBLEM TAGS (Many-to-Many)
-- =====================================================

CREATE TABLE problem_tags (
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, tag_id)
);

-- =====================================================
-- PROBLEM SETS TABLE
-- =====================================================

CREATE TABLE problem_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sharing_level sharing_level DEFAULT 'private',
  shared_with_emails TEXT[],
  problem_ids UUID[] DEFAULT '{}',
  is_smart BOOLEAN DEFAULT FALSE,
  filter_config JSONB,
  session_config JSONB,
  allow_copying BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATTEMPTS TABLE
-- =====================================================

CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  cause VARCHAR(200),
  is_self_assessed BOOLEAN DEFAULT FALSE,
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
  reflection_notes TEXT,
  selected_status problem_status,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender gender,
  region VARCHAR(100),
  timezone VARCHAR(100) DEFAULT 'UTC',
  avatar_url TEXT,
  bio TEXT,
  user_role user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER ACTIVITY LOG TABLE
-- =====================================================

CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMIN SETTINGS TABLE
-- =====================================================

CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QR UPLOAD SESSIONS TABLE
-- =====================================================

CREATE TABLE qr_upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  token VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- CONTENT LIMIT OVERRIDES TABLE (for admin user limits)
-- =====================================================

CREATE TABLE content_limit_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  limit_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type)
);

-- =====================================================
-- REVIEW SESSIONS TABLE
-- =====================================================

CREATE TABLE review_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_set_id UUID REFERENCES problem_sets(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_problems INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress'
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_tags_subject_id ON tags(subject_id);
CREATE INDEX idx_problems_subject_id ON problems(subject_id);
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problem_tags_tag_id ON problem_tags(tag_id);
CREATE INDEX idx_attempts_problem_id ON attempts(problem_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_user_profiles_user_role ON user_profiles(user_role);
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_qr_upload_sessions_user_id ON qr_upload_sessions(user_id);
CREATE INDEX idx_content_limit_overrides_user_id ON content_limit_overrides(user_id);
CREATE INDEX idx_review_sessions_user_id ON review_sessions(user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get subjects with metadata
CREATE OR REPLACE FUNCTION get_subjects_with_metadata()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR(100),
  color VARCHAR(20),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  problem_count BIGINT,
  mastered_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.name,
    s.color,
    s.icon,
    s.created_at,
    s.updated_at,
    COUNT(p.id)::BIGINT as problem_count,
    COUNT(CASE WHEN p.status = 'mastered' THEN 1 END)::BIGINT as mastered_count
  FROM subjects s
  LEFT JOIN problems p ON p.subject_id = s.id
  WHERE s.user_id = auth.uid()
  GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_sets_updated_at
  BEFORE UPDATE ON problem_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_limit_overrides ENABLE ROW LEVEL SECURITY;

-- Subjects policies
CREATE POLICY "Users can view own subjects" ON subjects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects" ON subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects" ON subjects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects" ON subjects
  FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view tags in own subjects" ON tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = tags.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert tags in own subjects" ON tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = tags.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can update tags in own subjects" ON tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = tags.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete tags from own subjects" ON tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = tags.subject_id AND subjects.user_id = auth.uid())
  );

-- Problems policies
CREATE POLICY "Users can view problems in own subjects" ON problems
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problems.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert problems in own subjects" ON problems
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problems.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can update problems in own subjects" ON problems
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problems.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete problems from own subjects" ON problems
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problems.subject_id AND subjects.user_id = auth.uid())
  );

-- Problem tags policies
CREATE POLICY "Users can view problem tags" ON problem_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM problems p JOIN subjects s ON s.id = p.subject_id WHERE p.id = problem_tags.problem_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users can manage problem tags" ON problem_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM problems p JOIN subjects s ON s.id = p.subject_id WHERE p.id = problem_tags.problem_id AND s.user_id = auth.uid())
  );

-- Problem sets policies
CREATE POLICY "Users can view own problem sets" ON problem_sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problem_sets.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert problem sets in own subjects" ON problem_sets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problem_sets.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own problem sets" ON problem_sets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problem_sets.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own problem sets" ON problem_sets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = problem_sets.subject_id AND subjects.user_id = auth.uid())
  );

-- Attempts policies
CREATE POLICY "Users can view own attempts" ON attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- QR upload sessions policies
CREATE POLICY "Users can view own QR sessions" ON qr_upload_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own QR sessions" ON qr_upload_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content limit overrides policies
CREATE POLICY "Users can view own content limits" ON content_limit_overrides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all content limits" ON content_limit_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.user_role IN ('admin', 'super_admin'))
  );

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
