-- ============================================
-- SAMPLE DATA for Kenyatta University
-- School ID: abad3fb7-7979-40f9-be45-7317afeb7e53
-- ============================================

-- Verify school and update status
UPDATE schools SET verification_status = 'verified', verified_at = NOW()
WHERE id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- STUDENTS (20 students across 4 classes)
-- ============================================
INSERT INTO students (name, admission_number, class, parent_phone, parent_email, school_id) VALUES
('Alice Mwangi', 'KU-2026-001', 'Form 1A', '0712345001', 'alice.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Brian Ochieng', 'KU-2026-002', 'Form 1A', '0712345002', 'brian.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Catherine Wanjiku', 'KU-2026-003', 'Form 1A', '0712345003', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('David Kipchoge', 'KU-2026-004', 'Form 1A', '0712345004', 'david.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Emily Akinyi', 'KU-2026-005', 'Form 1A', '0712345005', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Faith Njeri', 'KU-2026-006', 'Form 1B', '0712345006', 'faith.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('George Mutua', 'KU-2026-007', 'Form 1B', '0712345007', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Hannah Chebet', 'KU-2026-008', 'Form 1B', '0712345008', 'hannah.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Isaac Otieno', 'KU-2026-009', 'Form 1B', '0712345009', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Jane Wambui', 'KU-2026-010', 'Form 1B', '0712345010', 'jane.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Kevin Kamau', 'KU-2026-011', 'Form 2A', '0712345011', 'kevin.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Lucy Adhiambo', 'KU-2026-012', 'Form 2A', '0712345012', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Michael Wanyama', 'KU-2026-013', 'Form 2A', '0712345013', 'michael.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Nancy Moraa', 'KU-2026-014', 'Form 2A', '0712345014', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Oscar Odhiambo', 'KU-2026-015', 'Form 2A', '0712345015', 'oscar.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Patricia Nyokabi', 'KU-2026-016', 'Form 2B', '0712345016', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Quentin Maina', 'KU-2026-017', 'Form 2B', '0712345017', 'quentin.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Rose Wairimu', 'KU-2026-018', 'Form 2B', '0712345018', NULL, 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Samuel Kipruto', 'KU-2026-019', 'Form 2B', '0712345019', 'samuel.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Teresa Wangari', 'KU-2026-020', 'Form 2B', '0712345020', 'teresa.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53');

-- ============================================
-- PARENT ACCOUNTS (10 parents)
-- ============================================
INSERT INTO parent_accounts (name, phone, email, school_id) VALUES
('Mr. James Mwangi', '0712345001', 'alice.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mrs. Sarah Ochieng', '0712345002', 'brian.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mr. Peter Kipchoge', '0712345004', 'david.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mrs. Grace Njeri', '0712345006', 'faith.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mr. John Chebet', '0712345008', 'hannah.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mrs. Mary Wambui', '0712345010', 'jane.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mr. Joseph Kamau', '0712345011', 'kevin.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mrs. Ruth Wanyama', '0712345013', 'michael.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mr. Daniel Maina', '0712345017', 'quentin.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Mrs. Esther Wangari', '0712345020', 'teresa.parent@email.com', 'abad3fb7-7979-40f9-be45-7317afeb7e53');

-- ============================================
-- PARENT-STUDENT LINKS
-- ============================================
INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary)
SELECT pa.id, s.id, 'parent', true
FROM parent_accounts pa
JOIN students s ON s.parent_phone = pa.phone
WHERE pa.school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- FEE TYPES
-- ============================================
INSERT INTO fee_types (name, description, school_id) VALUES
('Tuition', 'Term tuition fees', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Boarding', 'Boarding and accommodation', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Activity', 'Extra-curricular activities', 'abad3fb7-7979-40f9-be45-7317afeb7e53'),
('Exam', 'Examination fees', 'abad3fb7-7979-40f9-be45-7317afeb7e53');

-- ============================================
-- FEES (Term 1, 2026 for all students)
-- ============================================
INSERT INTO fees (student_id, school_id, amount, amount_paid, status, date, due_date, fee_type, term, academic_year, student_name, student_admission_number)
SELECT
    s.id, s.school_id,
    45000, -- amount
    CASE
        WHEN random() < 0.3 THEN 45000      -- 30% fully paid
        WHEN random() < 0.6 THEN 25000      -- 30% partial
        ELSE 0                                -- 40% unpaid
    END,
    CASE
        WHEN random() < 0.3 THEN 'paid'
        WHEN random() < 0.6 THEN 'partial'
        ELSE 'pending'
    END,
    '2026-01-15',
    '2026-02-28',
    'Tuition',
    'Term 1',
    '2026',
    s.name,
    s.admission_number
FROM students s
WHERE s.school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- ATTENDANCE (Last 5 school days)
-- ============================================
INSERT INTO attendance (student_id, school_id, date, status, recorded_by)
SELECT
    s.id,
    s.school_id,
    d.date,
    CASE
        WHEN random() < 0.85 THEN 'present'
        WHEN random() < 0.93 THEN 'absent'
        WHEN random() < 0.97 THEN 'late'
        ELSE 'excused'
    END,
    '97add012-6312-4f25-9807-5c2b13b24e04'  -- Kelly (admin)
FROM students s
CROSS JOIN (
    SELECT '2026-02-10'::date AS date UNION ALL
    SELECT '2026-02-11' UNION ALL
    SELECT '2026-02-12' UNION ALL
    SELECT '2026-02-13' UNION ALL
    SELECT '2026-02-14'
) d
WHERE s.school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- EXAMS (Midterm results)
-- ============================================
INSERT INTO exams (student_id, school_id, subject, exam_type, date, score, total_marks, passing_marks, grade, term, academic_year)
SELECT
    s.id, s.school_id,
    sub.subject,
    'midterm',
    '2026-02-07',
    floor(random() * 60 + 40)::int,  -- score 40-100
    100,
    40,
    CASE
        WHEN floor(random() * 60 + 40) >= 80 THEN 'A'
        WHEN floor(random() * 60 + 40) >= 60 THEN 'B'
        WHEN floor(random() * 60 + 40) >= 50 THEN 'C'
        WHEN floor(random() * 60 + 40) >= 40 THEN 'D'
        ELSE 'E'
    END,
    'Term 1',
    '2026'
FROM students s
CROSS JOIN (
    SELECT 'Mathematics' AS subject UNION ALL
    SELECT 'English' UNION ALL
    SELECT 'Kiswahili' UNION ALL
    SELECT 'Science' UNION ALL
    SELECT 'Social Studies'
) sub
WHERE s.school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- NOTIFICATIONS (sample)
-- ============================================
INSERT INTO notifications (school_id, type, message, status, created_by) VALUES
('abad3fb7-7979-40f9-be45-7317afeb7e53', 'fee_reminder', 'Term 1 fees deadline is Feb 28, 2026. Please clear outstanding balances.', 'sent', '97add012-6312-4f25-9807-5c2b13b24e04'),
('abad3fb7-7979-40f9-be45-7317afeb7e53', 'general', 'Welcome to Kenyatta University School Management System!', 'sent', '97add012-6312-4f25-9807-5c2b13b24e04'),
('abad3fb7-7979-40f9-be45-7317afeb7e53', 'exam_results', 'Midterm exam results for Term 1 2026 are now available.', 'pending', '97add012-6312-4f25-9807-5c2b13b24e04');
