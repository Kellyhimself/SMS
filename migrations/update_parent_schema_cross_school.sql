-- Migration: update_parent_schema_cross_school.sql
-- Update parent accounts schema to support cross-school parent scenarios

-- Drop the unique constraint on phone
ALTER TABLE parent_accounts DROP CONSTRAINT IF EXISTS parent_accounts_phone_key;

-- Add composite unique constraint for phone + school_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_accounts_phone_school 
ON parent_accounts(phone, school_id);

-- Add index for phone lookups across schools
CREATE INDEX IF NOT EXISTS idx_parent_accounts_phone_lookup 
ON parent_accounts(phone);

-- Create a view for cross-school parent lookup
CREATE OR REPLACE VIEW parent_cross_school_lookup AS
SELECT 
  phone,
  array_agg(DISTINCT school_id) as school_ids,
  array_agg(DISTINCT id) as parent_account_ids,
  array_agg(DISTINCT name) as parent_names,
  count(DISTINCT school_id) as school_count
FROM parent_accounts 
WHERE is_active = true
GROUP BY phone;

-- Create function to get or create parent account for a school
CREATE OR REPLACE FUNCTION get_or_create_parent_account(
  p_phone VARCHAR(15),
  p_school_id UUID,
  p_name VARCHAR(100) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  parent_id UUID;
BEGIN
  -- Try to find existing parent account for this phone and school
  SELECT id INTO parent_id 
  FROM parent_accounts 
  WHERE phone = p_phone AND school_id = p_school_id;
  
  -- If not found, create new parent account
  IF parent_id IS NULL THEN
    INSERT INTO parent_accounts (phone, school_id, name, email, is_active)
    VALUES (p_phone, p_school_id, COALESCE(p_name, 'Parent'), p_email, true)
    RETURNING id INTO parent_id;
  END IF;
  
  RETURN parent_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to link parent to student across schools
CREATE OR REPLACE FUNCTION link_parent_to_student_cross_school(
  p_phone VARCHAR(15),
  p_student_id UUID,
  p_relationship VARCHAR(50) DEFAULT 'parent',
  p_is_primary BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  parent_id UUID;
  student_school_id UUID;
BEGIN
  -- Get student's school
  SELECT school_id INTO student_school_id 
  FROM students 
  WHERE id = p_student_id;
  
  IF student_school_id IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- Get or create parent account for this school
  SELECT get_or_create_parent_account(p_phone, student_school_id) INTO parent_id;
  
  -- Create parent-student link if it doesn't exist
  INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary)
  VALUES (parent_id, p_student_id, p_relationship, p_is_primary)
  ON CONFLICT (parent_id, student_id) DO NOTHING;
  
  RETURN parent_id;
END;
$$ LANGUAGE plpgsql; 