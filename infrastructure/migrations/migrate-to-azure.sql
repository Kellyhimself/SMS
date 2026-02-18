-- ============================================
-- AZURE POSTGRESQL MIGRATION SCRIPT
-- School Management System (SMS)
-- ============================================
-- This script migrates the database schema from Supabase to Azure PostgreSQL
--
-- IMPORTANT NOTES:
-- 1. Supabase Auth features (auth.uid(), auth.users) are NOT available in Azure
-- 2. RLS policies are adapted to work without Supabase Auth
-- 3. Authentication will be handled at the application layer
-- 4. Run this script after provisioning Azure PostgreSQL Flexible Server
--
-- USAGE:
--   psql "postgresql://smsadmin:PASSWORD@HOST:5432/school_management?sslmode=require" -f migrate-to-azure.sql
--
-- ESTIMATED TIME: 2-3 minutes
-- ============================================

\echo '============================================'
\echo 'Starting Azure PostgreSQL Migration...'
\echo '============================================'

-- ============================================
-- SECTION 1: ENABLE EXTENSIONS
-- ============================================
\echo ''
\echo '--- Enabling PostgreSQL Extensions ---'

-- UUID generation (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\echo '✓ pgcrypto extension enabled (UUID generation)'

-- Additional useful extensions for production
-- Note: pg_stat_statements is already enabled via Terraform
\echo '✓ pg_stat_statements already enabled (query performance monitoring)'

-- ============================================
-- SECTION 2: CORE TABLES
-- ============================================
\echo ''
\echo '--- Creating Core Tables ---'

-- -----------------------------
-- Schools Table
-- -----------------------------
\echo 'Creating schools table...'
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(15),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);
\echo '✓ Schools table created'

-- -----------------------------
-- Students Table
-- -----------------------------
\echo 'Creating students table...'
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  admission_number VARCHAR(50) UNIQUE,
  class VARCHAR(50),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  parent_phone VARCHAR(15),
  parent_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
\echo '✓ Students table created'

-- -----------------------------
-- Users Table
-- -----------------------------
\echo 'Creating users table...'
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  -- Role types: admin, teacher, parent, accountant
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'accountant')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  -- User invitation tracking
  invited_by UUID REFERENCES users(id),
  invitation_id UUID,  -- Will reference user_invitations table
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
\echo '✓ Users table created'

-- -----------------------------
-- User Invitations Table
-- -----------------------------
\echo 'Creating user_invitations table...'
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'parent', 'accountant')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_school ON user_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);
\echo '✓ User invitations table created'

-- Add foreign key for invitation_id (had to create user_invitations first)
ALTER TABLE users ADD CONSTRAINT fk_users_invitation_id
  FOREIGN KEY (invitation_id) REFERENCES user_invitations(id);
CREATE INDEX IF NOT EXISTS idx_users_invitation_id ON users(invitation_id);

-- ============================================
-- SECTION 3: PARENT PORTAL TABLES
-- ============================================
\echo ''
\echo '--- Creating Parent Portal Tables ---'

-- -----------------------------
-- Parent Accounts Table
-- -----------------------------
\echo 'Creating parent_accounts table...'
CREATE TABLE IF NOT EXISTS parent_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_accounts_school ON parent_accounts(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_accounts_phone ON parent_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_parent_accounts_email ON parent_accounts(email);
CREATE INDEX IF NOT EXISTS idx_parent_accounts_active ON parent_accounts(is_active);
\echo '✓ Parent accounts table created'

-- -----------------------------
-- Parent-Student Links Table
-- -----------------------------
\echo 'Creating parent_student_links table...'
CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_primary ON parent_student_links(is_primary);

-- Prevent duplicate parent-student links
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique
ON parent_student_links(parent_id, student_id);
\echo '✓ Parent-student links table created'

-- -----------------------------
-- Parent Sessions Table
-- -----------------------------
\echo 'Creating parent_sessions table...'
CREATE TABLE IF NOT EXISTS parent_sessions (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
  phone VARCHAR(15) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_sessions_parent ON parent_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_phone ON parent_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_expires ON parent_sessions(expires_at);
\echo '✓ Parent sessions table created'

-- -----------------------------
-- OTP Codes Table
-- -----------------------------
\echo 'Creating otp_codes table...'
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  parent_id UUID REFERENCES parent_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_parent ON otp_codes(parent_id);
\echo '✓ OTP codes table created'

-- ============================================
-- SECTION 4: ATTENDANCE TABLES
-- ============================================
\echo ''
\echo '--- Creating Attendance Tables ---'

-- -----------------------------
-- Attendance Table
-- -----------------------------
\echo 'Creating attendance table...'
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Status types: present, absent, late, excused
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Prevent duplicate attendance records for same student on same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_student_date
ON attendance(student_id, date);
\echo '✓ Attendance table created'

-- ============================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- ============================================
\echo ''
\echo '--- Creating Functions and Triggers ---'

-- Function: Update updated_at timestamp for schools
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_schools_updated_at();
\echo '✓ Schools trigger created'

-- Function: Update updated_at timestamp for students
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();
\echo '✓ Students trigger created'

-- Function: Update updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
\echo '✓ Users trigger created'

-- Function: Update updated_at timestamp for user_invitations
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();
\echo '✓ User invitations trigger created'

-- Function: Update updated_at timestamp for parent_accounts
CREATE OR REPLACE FUNCTION update_parent_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_accounts_updated_at
  BEFORE UPDATE ON parent_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_accounts_updated_at();
\echo '✓ Parent accounts trigger created'

-- Function: Update updated_at timestamp for parent_student_links
CREATE OR REPLACE FUNCTION update_parent_student_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_student_links_updated_at
  BEFORE UPDATE ON parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_student_links_updated_at();
\echo '✓ Parent-student links trigger created'

-- Function: Update updated_at timestamp for parent_sessions
CREATE OR REPLACE FUNCTION update_parent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_sessions_updated_at
  BEFORE UPDATE ON parent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_sessions_updated_at();
\echo '✓ Parent sessions trigger created'

-- Function: Update updated_at timestamp for attendance
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();
\echo '✓ Attendance trigger created'

-- Function: Cleanup expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
\echo '✓ OTP cleanup function created'

-- ============================================
-- SECTION 6: VIEWS
-- ============================================
\echo ''
\echo '--- Creating Views ---'

-- View: Attendance Summary
\echo 'Creating attendance_summary view...'
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  s.id as student_id,
  s.name as student_name,
  s.class,
  s.school_id,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
  COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
  COUNT(a.id) as total_days,
  CASE
    WHEN COUNT(a.id) > 0 THEN
      ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / COUNT(a.id)) * 100, 2)
    ELSE 0
  END as attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.id = a.student_id
GROUP BY s.id, s.name, s.class, s.school_id;
\echo '✓ Attendance summary view created'

-- View: Parent Dashboard
-- Note: This view references fees table which may not exist yet
-- Commented out for now - uncomment after creating fees table
\echo 'Skipping parent_dashboard view (requires fees table)'
/*
CREATE OR REPLACE VIEW parent_dashboard AS
SELECT
  pa.id as parent_id,
  pa.name as parent_name,
  pa.phone as parent_phone,
  pa.email as parent_email,
  s.id as student_id,
  s.name as student_name,
  s.class,
  s.admission_number,
  psl.relationship,
  psl.is_primary,
  COUNT(a.id) as total_attendance_days,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
  COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
  CASE
    WHEN COUNT(a.id) > 0 THEN
      ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / COUNT(a.id)) * 100, 2)
    ELSE 0
  END as attendance_percentage,
  COUNT(f.id) as total_fees,
  COALESCE(SUM(f.amount), 0) as total_fee_amount,
  COALESCE(SUM(f.amount_paid), 0) as total_paid_amount,
  COALESCE(SUM(f.amount - COALESCE(f.amount_paid, 0)), 0) as outstanding_amount
FROM parent_accounts pa
JOIN parent_student_links psl ON pa.id = psl.parent_id
JOIN students s ON psl.student_id = s.id
LEFT JOIN attendance a ON s.id = a.student_id
LEFT JOIN fees f ON s.id = f.student_id
WHERE pa.is_active = true
GROUP BY pa.id, pa.name, pa.phone, pa.email, s.id, s.name, s.class, s.admission_number, psl.relationship, psl.is_primary;
*/

-- ============================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ============================================
\echo ''
\echo '--- Configuring Row Level Security ---'
\echo '⚠️  Note: RLS policies are DISABLED for Azure PostgreSQL'
\echo '    Authentication will be handled at the application layer'
\echo '    Re-enable RLS and create policies once application auth is implemented'

-- Enable RLS on all tables (but don't create policies yet)
-- This is commented out for initial deployment
-- Uncomment and add application-specific policies later

/*
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Example application-level RLS policy:
-- CREATE POLICY "Users can only see their school's data" ON students
--   FOR SELECT USING (
--     school_id IN (
--       SELECT school_id FROM users WHERE email = current_user
--     )
--   );
*/

-- ============================================
-- SECTION 8: SEED DATA (Development Only)
-- ============================================
\echo ''
\echo '--- Inserting Seed Data ---'
\echo 'Note: This is for development/testing only'

-- Insert test school
INSERT INTO schools (id, name, email, phone, address)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',  -- Fixed UUID for testing
  'Test School',
  'admin@testschool.com',
  '+254700000000',
  'Nairobi, Kenya'
) ON CONFLICT (id) DO NOTHING;
\echo '✓ Test school created'

-- Insert test students
INSERT INTO students (id, name, admission_number, class, school_id, parent_phone, parent_email)
VALUES
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'John Doe',
    '2024/001',
    'Grade 5',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '+254700123456',
    'parent1@example.com'
  ),
  (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Jane Smith',
    '2024/002',
    'Grade 6',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '+254700123456',
    'parent1@example.com'
  ),
  (
    'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Bob Johnson',
    '2024/003',
    'Grade 7',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '+254700789012',
    'parent2@example.com'
  )
ON CONFLICT (id) DO NOTHING;
\echo '✓ Test students created'

-- Insert test admin user
INSERT INTO users (id, email, name, role, school_id)
VALUES (
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@testschool.com',
  'Admin User',
  'admin',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT (email) DO NOTHING;
\echo '✓ Test admin user created'

-- ============================================
-- SECTION 9: GRANTS & PERMISSIONS
-- ============================================
\echo ''
\echo '--- Setting Up Permissions ---'

-- Grant all permissions to the current user (smsadmin)
-- In production, create separate roles with limited permissions

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smsadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smsadmin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO smsadmin;
\echo '✓ Permissions granted to smsadmin'

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
\echo ''
\echo '============================================'
\echo '✅ Azure PostgreSQL Migration Complete!'
\echo '============================================'
\echo ''
\echo 'Tables Created:'
\echo '  - schools'
\echo '  - students'
\echo '  - users'
\echo '  - user_invitations'
\echo '  - parent_accounts'
\echo '  - parent_student_links'
\echo '  - parent_sessions'
\echo '  - otp_codes'
\echo '  - attendance'
\echo ''
\echo 'Views Created:'
\echo '  - attendance_summary'
\echo ''
\echo 'Extensions Enabled:'
\echo '  - pgcrypto (UUID generation)'
\echo '  - pg_stat_statements (query monitoring)'
\echo ''
\echo 'Next Steps:'
\echo '  1. Verify connection: \dt'
\echo '  2. Check data: SELECT * FROM schools;'
\echo '  3. Update Next.js .env.local with Azure connection details'
\echo '  4. Implement application-level authentication'
\echo '  5. Create fees and exams tables if needed'
\echo '  6. Enable RLS policies once auth is implemented'
\echo ''
\echo 'For support: Check infrastructure/migrations/README.md'
\echo '============================================'
