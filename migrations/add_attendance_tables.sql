-- Add attendance management tables
-- Migration: add_attendance_tables.sql

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Create unique constraint to prevent duplicate attendance records
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_student_date 
ON attendance(student_id, date);

-- Add RLS policies for attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy for school users to manage their school's attendance
CREATE POLICY "School users can manage attendance" ON attendance
  FOR ALL USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for viewing attendance records
CREATE POLICY "Users can view attendance for their school" ON attendance
  FOR SELECT USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for inserting attendance records
CREATE POLICY "Users can insert attendance for their school" ON attendance
  FOR INSERT WITH CHECK (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for updating attendance records
CREATE POLICY "Users can update attendance for their school" ON attendance
  FOR UPDATE USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Policy for deleting attendance records
CREATE POLICY "Users can delete attendance for their school" ON attendance
  FOR DELETE USING (school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));

-- Create attendance_summary view for analytics
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
  s.id as student_id,
  s.name as student_name,
  s.class,
  a.school_id,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
  COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
  COUNT(*) as total_days,
  ROUND(
    (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.id = a.student_id
WHERE s.school_id = a.school_id OR a.school_id IS NULL
GROUP BY s.id, s.name, s.class, a.school_id;

-- Create function to update attendance updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at(); 