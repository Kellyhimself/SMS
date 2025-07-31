-- Add parent portal tables
-- Migration: add_parent_portal_tables.sql

-- Create parent_accounts table
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

-- Create parent_student_links table
CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_accounts_school ON parent_accounts(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_accounts_phone ON parent_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_primary ON parent_student_links(is_primary);

-- Create unique constraint to prevent duplicate parent-student links
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique 
ON parent_student_links(parent_id, student_id);

-- Add RLS policies for parent_accounts table
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;

-- Policy for school users to manage their school's parent accounts
CREATE POLICY "School users can manage parent accounts" ON parent_accounts
  FOR ALL USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for viewing parent accounts
CREATE POLICY "Users can view parent accounts for their school" ON parent_accounts
  FOR SELECT USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for inserting parent accounts
CREATE POLICY "Users can insert parent accounts for their school" ON parent_accounts
  FOR INSERT WITH CHECK (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for updating parent accounts
CREATE POLICY "Users can update parent accounts for their school" ON parent_accounts
  FOR UPDATE USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for deleting parent accounts
CREATE POLICY "Users can delete parent accounts for their school" ON parent_accounts
  FOR DELETE USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Add RLS policies for parent_student_links table
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policy for school users to manage their school's parent-student links
CREATE POLICY "School users can manage parent-student links" ON parent_student_links
  FOR ALL USING (
    parent_id IN (
      SELECT pa.id FROM parent_accounts pa
      JOIN users u ON pa.school_id = u.school_id
      WHERE u.id = auth.uid()
    )
  );

-- Policy for viewing parent-student links
CREATE POLICY "Users can view parent-student links for their school" ON parent_student_links
  FOR SELECT USING (
    parent_id IN (
      SELECT pa.id FROM parent_accounts pa
      JOIN users u ON pa.school_id = u.school_id
      WHERE u.id = auth.uid()
    )
  );

-- Policy for inserting parent-student links
CREATE POLICY "Users can insert parent-student links for their school" ON parent_student_links
  FOR INSERT WITH CHECK (
    parent_id IN (
      SELECT pa.id FROM parent_accounts pa
      JOIN users u ON pa.school_id = u.school_id
      WHERE u.id = auth.uid()
    )
  );

-- Policy for updating parent-student links
CREATE POLICY "Users can update parent-student links for their school" ON parent_student_links
  FOR UPDATE USING (
    parent_id IN (
      SELECT pa.id FROM parent_accounts pa
      JOIN users u ON pa.school_id = u.school_id
      WHERE u.id = auth.uid()
    )
  );

-- Policy for deleting parent-student links
CREATE POLICY "Users can delete parent-student links for their school" ON parent_student_links
  FOR DELETE USING (
    parent_id IN (
      SELECT pa.id FROM parent_accounts pa
      JOIN users u ON pa.school_id = u.school_id
      WHERE u.id = auth.uid()
    )
  );

-- Create function to update parent_accounts updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for parent_accounts updated_at
CREATE TRIGGER update_parent_accounts_updated_at
  BEFORE UPDATE ON parent_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_accounts_updated_at();

-- Create function to update parent_student_links updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_student_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for parent_student_links updated_at
CREATE TRIGGER update_parent_student_links_updated_at
  BEFORE UPDATE ON parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_student_links_updated_at();

-- Create view for parent dashboard data
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
  ROUND(
    (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(a.id), 0)) * 100, 2
  ) as attendance_percentage,
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