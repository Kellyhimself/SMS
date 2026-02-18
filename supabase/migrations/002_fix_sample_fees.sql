-- ============================================
-- FIX: Replace inconsistent sample fee data
-- ============================================
-- The original INSERT used independent random() calls for amount_paid and status,
-- causing mismatches (e.g., status='paid' with amount_paid=0).
-- This script replaces all fee data with consistent, verifiable records.
--
-- Expected results for 20 students @ KES 45,000 each:
--   Total Billed:   KES 900,000
--   Total Revenue:  KES 405,000  (6 fully paid + 6 partial)
--   Total Pending:  KES 495,000
--   Collection Rate: 45.0%
--   Paid:    6 students (amount_paid = 45,000)
--   Partial: 6 students (amount_paid = 10,000-35,000)
--   Unpaid:  8 students (amount_paid = 0)
-- ============================================

-- Step 1: Remove inconsistent fee data
DELETE FROM fees
WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';

-- Step 2: Re-insert with consistent, deterministic data
WITH student_list AS (
  SELECT
    id,
    name,
    admission_number,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM students
  WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53'
)
INSERT INTO fees (
  student_id,
  school_id,
  amount,
  amount_paid,
  status,
  date,
  due_date,
  fee_type,
  term,
  academic_year,
  description,
  payment_method,
  payment_date,
  student_name,
  student_admission_number,
  sync_status
)
SELECT
  id,
  'abad3fb7-7979-40f9-be45-7317afeb7e53',
  45000,                                          -- Standard tuition fee
  -- Amount paid: consistent with status
  CASE
    WHEN rn <= 6 THEN 45000                       -- Fully paid
    WHEN rn = 7 THEN 35000                        -- Partial (78%)
    WHEN rn = 8 THEN 30000                        -- Partial (67%)
    WHEN rn = 9 THEN 25000                        -- Partial (56%)
    WHEN rn = 10 THEN 20000                       -- Partial (44%)
    WHEN rn = 11 THEN 15000                       -- Partial (33%)
    WHEN rn = 12 THEN 10000                       -- Partial (22%)
    ELSE 0                                         -- Unpaid
  END,
  -- Status: matches amount_paid
  CASE
    WHEN rn <= 6 THEN 'paid'
    WHEN rn BETWEEN 7 AND 12 THEN 'pending'
    ELSE 'pending'
  END,
  '2026-01-15',                                   -- Fee creation date (start of term)
  '2026-03-31',                                   -- Due date (end of Term 1)
  'Tuition',
  'Term 1',
  '2026',
  'Term 1 2026 Tuition Fee',
  -- Payment method: only for those who paid something
  CASE
    WHEN rn <= 6 THEN 'mpesa'
    WHEN rn BETWEEN 7 AND 12 THEN 'bank'
    ELSE NULL
  END,
  -- Payment date: only for those who paid something (cast to timestamptz)
  CASE
    WHEN rn <= 12 THEN '2026-01-20T10:00:00+03:00'::timestamptz
    ELSE NULL
  END,
  name,
  admission_number,
  'synced'
FROM student_list;

-- Verify the results
SELECT
  COUNT(*) as total_students,
  SUM(amount) as total_billed,
  SUM(amount_paid) as total_revenue,
  SUM(amount - amount_paid) as total_pending,
  ROUND((SUM(amount_paid)::numeric / SUM(amount)::numeric) * 100, 1) as collection_rate,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND amount_paid > 0) as partial_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND amount_paid = 0) as unpaid_count
FROM fees
WHERE school_id = 'abad3fb7-7979-40f9-be45-7317afeb7e53';
