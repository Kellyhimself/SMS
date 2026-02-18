-- ============================================
-- FIX: Align students and exams with UI dropdown values
-- ============================================
-- The sample data used class names, exam types, and terms
-- that don't match the app's predefined dropdown constants.
--
-- Valid Classes (from src/lib/constants/classes.ts):
--   Baby Class, Pre-Primary 1 (PP1), Pre-Primary 2 (PP2),
--   Grade 1-6, Grade 7-9, Form 1-4
--
-- Valid Exam Types: Regular, Midterm, Final
-- Valid Terms: Term 1, Term 2, Term 3
-- ============================================

-- ============================================
-- STEP 1: Fix student class names
-- ============================================
-- Map any non-standard class names to the correct values
-- First, let's see what we have and fix them

-- Common mismatches: 'Class 1' -> 'Grade 1', 'PP1' -> 'Pre-Primary 1 (PP1)', etc.
UPDATE students SET class = 'Baby Class'            WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Baby', 'Nursery', 'baby class', 'baby_class');
UPDATE students SET class = 'Pre-Primary 1 (PP1)'   WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('PP1', 'pp1', 'Pre-Primary 1', 'Pre Primary 1', 'KG1');
UPDATE students SET class = 'Pre-Primary 2 (PP2)'   WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('PP2', 'pp2', 'Pre-Primary 2', 'Pre Primary 2', 'KG2');
UPDATE students SET class = 'Grade 1'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 1', 'class 1', 'Std 1', 'Standard 1', 'grade 1', '1');
UPDATE students SET class = 'Grade 2'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 2', 'class 2', 'Std 2', 'Standard 2', 'grade 2', '2');
UPDATE students SET class = 'Grade 3'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 3', 'class 3', 'Std 3', 'Standard 3', 'grade 3', '3');
UPDATE students SET class = 'Grade 4'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 4', 'class 4', 'Std 4', 'Standard 4', 'grade 4', '4');
UPDATE students SET class = 'Grade 5'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 5', 'class 5', 'Std 5', 'Standard 5', 'grade 5', '5');
UPDATE students SET class = 'Grade 6'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 6', 'class 6', 'Std 6', 'Standard 6', 'grade 6', '6');
UPDATE students SET class = 'Grade 7'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 7', 'class 7', 'Std 7', 'Standard 7', 'grade 7', 'JSS 1', '7');
UPDATE students SET class = 'Grade 8'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 8', 'class 8', 'Std 8', 'Standard 8', 'grade 8', 'JSS 2', '8');
UPDATE students SET class = 'Grade 9'               WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Class 9', 'class 9', 'JSS 3', 'grade 9', '9');
UPDATE students SET class = 'Form 1'                WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Form1', 'form 1', 'F1', 'SSS 1');
UPDATE students SET class = 'Form 2'                WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Form2', 'form 2', 'F2', 'SSS 2');
UPDATE students SET class = 'Form 3'                WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Form3', 'form 3', 'F3', 'SSS 3');
UPDATE students SET class = 'Form 4'                WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53' AND class IN ('Form4', 'form 4', 'F4', 'SSS 4');

-- Catch-all: if any students still have non-standard class names,
-- distribute them across Grade 1-6 using a CTE (window functions not allowed in UPDATE)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM students
  WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53'
    AND class NOT IN (
      'Baby Class', 'Pre-Primary 1 (PP1)', 'Pre-Primary 2 (PP2)',
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9',
      'Form 1', 'Form 2', 'Form 3', 'Form 4'
    )
)
UPDATE students
SET class = 'Grade ' || ((ranked.rn % 6) + 1)::text
FROM ranked
WHERE students.id = ranked.id;

-- ============================================
-- STEP 2: Delete old exam data and re-insert
-- ============================================
DELETE FROM exams
WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- STEP 3: Insert consistent exam data
-- ============================================
-- Create Term 1 2026 Midterm exams for all students
-- Each student gets exams in 3 subjects for their class level
-- Subjects vary by class level (CBC curriculum)

WITH student_data AS (
  SELECT
    id AS student_id,
    name,
    class,
    school_id,
    ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM students
  WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53'
),
-- Define subjects per class level
subjects AS (
  SELECT unnest(ARRAY['Mathematics', 'English', 'Kiswahili']) AS subject_name, 'primary' AS level
  UNION ALL
  SELECT unnest(ARRAY['Mathematics', 'English', 'Science']) AS subject_name, 'junior' AS level
  UNION ALL
  SELECT unnest(ARRAY['Mathematics', 'English', 'Biology']) AS subject_name, 'senior' AS level
),
-- Map students to their level
student_with_level AS (
  SELECT
    s.*,
    CASE
      WHEN s.class IN ('Baby Class', 'Pre-Primary 1 (PP1)', 'Pre-Primary 2 (PP2)',
                        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6')
        THEN 'primary'
      WHEN s.class IN ('Grade 7', 'Grade 8', 'Grade 9')
        THEN 'junior'
      ELSE 'senior'
    END AS level
  FROM student_data s
)
INSERT INTO exams (
  student_id,
  school_id,
  subject,
  exam_type,
  grade,
  term,
  academic_year,
  date,
  total_marks,
  passing_marks,
  score,
  remarks,
  sync_status
)
SELECT
  sw.student_id,
  sw.school_id,
  sub.subject_name,
  'Midterm',                                      -- Matches dropdown: 'Regular', 'Midterm', 'Final'
  sw.class,                                       -- Matches student's class (from ALL_CLASS_OPTIONS)
  'Term 1',                                       -- Matches dropdown: 'Term 1', 'Term 2', 'Term 3'
  '2026',
  '2026-02-15',
  100,                                            -- Total marks
  40,                                             -- Passing marks
  -- Deterministic scores based on student number and subject
  CASE sub.subject_name
    WHEN 'Mathematics' THEN LEAST(95, 35 + (sw.rn * 3))
    WHEN 'English'     THEN LEAST(92, 40 + (sw.rn * 2))
    WHEN 'Kiswahili'   THEN LEAST(90, 38 + (sw.rn * 3))
    WHEN 'Science'     THEN LEAST(88, 42 + (sw.rn * 2))
    WHEN 'Biology'     THEN LEAST(91, 36 + (sw.rn * 3))
    ELSE 50
  END,
  -- Remarks based on score
  CASE
    WHEN LEAST(95, 35 + (sw.rn * 3)) >= 80 THEN 'Excellent performance'
    WHEN LEAST(95, 35 + (sw.rn * 3)) >= 60 THEN 'Good performance'
    WHEN LEAST(95, 35 + (sw.rn * 3)) >= 40 THEN 'Average performance'
    ELSE 'Needs improvement'
  END,
  'synced'
FROM student_with_level sw
CROSS JOIN subjects sub
WHERE sw.level = sub.level;

-- ============================================
-- STEP 4: Also update fees with correct student classes
-- ============================================
-- Ensure fee records have matching student_name values
UPDATE fees f
SET student_name = s.name,
    student_admission_number = s.admission_number
FROM students s
WHERE f.student_id = s.id
  AND f.school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check student class distribution
SELECT class, COUNT(*) as student_count
FROM students
WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53'
GROUP BY class
ORDER BY class;
