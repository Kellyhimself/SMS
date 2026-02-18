-- ============================================
-- SCHOOL MANAGEMENT SYSTEM - SUPABASE MIGRATION
-- Full database schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: schools (core - no dependencies)
-- ============================================
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    verification_status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    payment_settings JSONB,
    bank_api_settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: users (depends on schools)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,  -- matches auth.users.id
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'teacher',
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from schools.verified_by -> users.id
ALTER TABLE schools
    ADD CONSTRAINT schools_verified_by_fkey
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- TABLE: students (depends on schools)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    admission_number TEXT,
    class TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sync_status TEXT NOT NULL DEFAULT 'synced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: attendance
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: bank_webhook_logs
-- ============================================
CREATE TABLE IF NOT EXISTS bank_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    bank_type TEXT NOT NULL,
    webhook_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: curriculum_levels
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: subjects
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    level_id UUID REFERENCES curriculum_levels(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_core BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: exams
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'midterm',
    date DATE NOT NULL,
    score NUMERIC NOT NULL,
    total_marks NUMERIC NOT NULL,
    passing_marks NUMERIC NOT NULL,
    grade TEXT NOT NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    remarks TEXT,
    teacher_remarks TEXT,
    principal_remarks TEXT,
    sync_status TEXT DEFAULT 'synced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: fee_types
-- ============================================
CREATE TABLE IF NOT EXISTS fee_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: fees
-- ============================================
CREATE TABLE IF NOT EXISTS fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    date DATE NOT NULL,
    due_date DATE,
    fee_type TEXT,
    description TEXT,
    term TEXT,
    academic_year TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    payment_date TIMESTAMPTZ,
    payment_details JSONB,
    receipt_url TEXT,
    student_name TEXT,
    student_admission_number TEXT,
    sync_status TEXT DEFAULT 'synced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: installment_plans
-- ============================================
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL,
    installment_count INTEGER NOT NULL,
    installment_amount NUMERIC NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: payment_references
-- ============================================
CREATE TABLE IF NOT EXISTS payment_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_id UUID NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    student_name TEXT NOT NULL,
    student_admission_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_date TIMESTAMPTZ,
    bank_name TEXT,
    bank_transaction_id TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: report_cards
-- ============================================
CREATE TABLE IF NOT EXISTS report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    grade TEXT NOT NULL,
    total_marks NUMERIC NOT NULL,
    average_marks NUMERIC NOT NULL,
    class_position INTEGER,
    teacher_remarks TEXT,
    principal_remarks TEXT,
    parent_signature BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    recipient_email TEXT,
    recipient_phone TEXT,
    created_by UUID,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: parent_accounts
-- ============================================
CREATE TABLE IF NOT EXISTS parent_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: parent_student_links
-- ============================================
CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: parent_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS parent_sessions (
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: otp_codes
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- VIEW: attendance_summary
-- ============================================
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    s.class,
    a.school_id,
    COUNT(*) AS total_days,
    COUNT(*) FILTER (WHERE a.status = 'present') AS present_count,
    COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_count,
    COUNT(*) FILTER (WHERE a.status = 'late') AS late_count,
    COUNT(*) FILTER (WHERE a.status = 'excused') AS excused_count,
    ROUND(
        COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
    ) AS attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.id = a.student_id
GROUP BY s.id, s.name, s.class, a.school_id;

-- ============================================
-- VIEW: parent_dashboard
-- ============================================
CREATE OR REPLACE VIEW parent_dashboard AS
SELECT
    pa.id AS parent_id,
    pa.name AS parent_name,
    pa.phone AS parent_phone,
    pa.email AS parent_email,
    s.id AS student_id,
    s.name AS student_name,
    s.admission_number,
    s.class,
    psl.relationship,
    psl.is_primary,
    -- Attendance stats
    (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'present') AS present_days,
    (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'absent') AS absent_days,
    (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'late') AS late_days,
    (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id) AS total_attendance_days,
    ROUND(
        (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'present')::NUMERIC
        / NULLIF((SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id), 0) * 100, 2
    ) AS attendance_percentage,
    -- Fee stats
    (SELECT COUNT(*) FROM fees f WHERE f.student_id = s.id) AS total_fees,
    (SELECT COALESCE(SUM(f.amount), 0) FROM fees f WHERE f.student_id = s.id) AS total_fee_amount,
    (SELECT COALESCE(SUM(f.amount_paid), 0) FROM fees f WHERE f.student_id = s.id) AS total_paid_amount,
    (SELECT COALESCE(SUM(f.amount - COALESCE(f.amount_paid, 0)), 0) FROM fees f WHERE f.student_id = s.id AND f.status != 'paid') AS outstanding_amount
FROM parent_accounts pa
JOIN parent_student_links psl ON pa.id = psl.parent_id
JOIN students s ON psl.student_id = s.id;

-- ============================================
-- VIEW: parent_cross_school_lookup
-- ============================================
CREATE OR REPLACE VIEW parent_cross_school_lookup AS
SELECT
    pa.phone,
    ARRAY_AGG(DISTINCT pa.id::TEXT) AS parent_account_ids,
    ARRAY_AGG(DISTINCT pa.name) AS parent_names,
    ARRAY_AGG(DISTINCT pa.school_id::TEXT) AS school_ids,
    COUNT(DISTINCT pa.school_id) AS school_count
FROM parent_accounts pa
GROUP BY pa.phone;

-- ============================================
-- FUNCTION: get_or_create_parent_account
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_parent_account(
    p_phone TEXT,
    p_school_id UUID,
    p_name TEXT DEFAULT 'Parent',
    p_email TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    SELECT id INTO v_parent_id
    FROM parent_accounts
    WHERE phone = p_phone AND school_id = p_school_id
    LIMIT 1;

    IF v_parent_id IS NULL THEN
        INSERT INTO parent_accounts (phone, school_id, name, email)
        VALUES (p_phone, p_school_id, p_name, p_email)
        RETURNING id INTO v_parent_id;
    END IF;

    RETURN v_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: link_parent_to_student_cross_school
-- ============================================
CREATE OR REPLACE FUNCTION link_parent_to_student_cross_school(
    p_phone TEXT,
    p_student_id UUID,
    p_relationship TEXT DEFAULT 'parent',
    p_is_primary BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
    v_link_id UUID;
    v_school_id UUID;
BEGIN
    SELECT school_id INTO v_school_id FROM students WHERE id = p_student_id;

    v_parent_id := get_or_create_parent_account(p_phone, v_school_id);

    SELECT id INTO v_link_id
    FROM parent_student_links
    WHERE parent_id = v_parent_id AND student_id = p_student_id
    LIMIT 1;

    IF v_link_id IS NULL THEN
        INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary)
        VALUES (v_parent_id, p_student_id, p_relationship, p_is_primary)
        RETURNING id INTO v_link_id;
    END IF;

    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: sync_users_from_auth
-- ============================================
CREATE OR REPLACE FUNCTION sync_users_from_auth()
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    SELECT
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'name', au.email),
        COALESCE(au.raw_user_meta_data->>'role', 'teacher')
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-create user on auth signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON exams(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_school_id ON fees(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_accounts_phone ON parent_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_id ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference ON payment_references(reference);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;

-- Helper function: Gets current user's school_id (SECURITY DEFINER bypasses RLS)
-- This prevents infinite recursion when policies reference the users table
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policy: Users can read/write their own school's data
-- (Using service_role key bypasses RLS, so these policies
-- apply only to anon/authenticated client access)

-- Users: can view own record + same school users
CREATE POLICY "Users can view same school users" ON users
    FOR SELECT USING (id = auth.uid() OR school_id = public.get_user_school_id());

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (id = auth.uid());

-- Schools: view own school
CREATE POLICY "Users can view their school" ON schools
    FOR SELECT USING (id = public.get_user_school_id());

-- All school-scoped tables
CREATE POLICY "School scoped student access" ON students
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped attendance access" ON attendance
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped exam access" ON exams
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped fee access" ON fees
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped fee type access" ON fee_types
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped notification access" ON notifications
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "Admin audit log access" ON audit_logs
    FOR SELECT USING (true);

CREATE POLICY "School scoped webhook access" ON bank_webhook_logs
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped curriculum access" ON curriculum_levels
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped subject access" ON subjects
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "Installment plan access via fees" ON installment_plans
    FOR ALL USING (fee_id IN (SELECT id FROM fees WHERE school_id = public.get_user_school_id()));

CREATE POLICY "School scoped payment reference access" ON payment_references
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped report card access" ON report_cards
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School scoped parent access" ON parent_accounts
    FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "Parent student link access" ON parent_student_links
    FOR ALL USING (parent_id IN (SELECT id FROM parent_accounts WHERE school_id = public.get_user_school_id()));

-- Parent sessions: open for OTP auth flow
CREATE POLICY "Parent session access" ON parent_sessions
    FOR ALL USING (true);

-- OTP codes: open for auth flow
CREATE POLICY "OTP code access" ON otp_codes
    FOR ALL USING (true);

-- ============================================
-- DONE!
-- ============================================
