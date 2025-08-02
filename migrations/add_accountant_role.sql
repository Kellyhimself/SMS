-- Add accountant role support to existing RLS policies
-- This migration updates existing policies to include 'accountant' role

-- Drop existing policies that need to be updated to include accountant role
DROP POLICY IF EXISTS "Enable update for school staff" ON exams;
DROP POLICY IF EXISTS "Enable delete for school staff" ON exams;
DROP POLICY IF EXISTS "Enable delete for school staff" ON fees;
DROP POLICY IF EXISTS "Enable update for school staff" ON fees;
DROP POLICY IF EXISTS "Enable update for school staff" ON students;

-- Recreate the policies with accountant role included
-- Exams table policies
CREATE POLICY "Enable update for school staff" ON exams
  FOR UPDATE USING (
    school_id IN (
      SELECT users.school_id
      FROM users
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['admin'::text, 'teacher'::text, 'accountant'::text])
    )
  );

CREATE POLICY "Enable delete for school staff" ON exams
  FOR DELETE USING (
    school_id IN (
      SELECT users.school_id
      FROM users
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['admin'::text, 'teacher'::text, 'accountant'::text])
    )
  );

-- Fees table policies
CREATE POLICY "Enable delete for school staff" ON fees
  FOR DELETE USING (
    school_id IN (
      SELECT users.school_id
      FROM users
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['admin'::text, 'teacher'::text, 'accountant'::text])
    )
  );

CREATE POLICY "Enable update for school staff" ON fees
  FOR UPDATE USING (
    school_id IN (
      SELECT users.school_id
      FROM users
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['admin'::text, 'teacher'::text, 'accountant'::text])
    )
  );

-- Students table policies
CREATE POLICY "Enable update for school staff" ON students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['admin'::text, 'teacher'::text, 'accountant'::text])
      AND users.school_id = students.school_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['admin'::text, 'teacher'::text, 'accountant'::text])
      AND users.school_id = students.school_id
    )
  ); 