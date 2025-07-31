-- Migration: create_school_base_tables.sql
-- Create base school tables needed for parent portal functionality

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(15),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create students table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);

-- Add RLS policies for schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Allow all operations on schools for now (for testing)
CREATE POLICY "Allow all operations on schools" ON schools
  FOR ALL USING (true);

-- Add RLS policies for students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow all operations on students for now (for testing)
CREATE POLICY "Allow all operations on students" ON students
  FOR ALL USING (true);

-- Create function to update schools updated_at timestamp
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for schools updated_at
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_schools_updated_at();

-- Create function to update students updated_at timestamp
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for students updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

-- Insert a test school
INSERT INTO schools (id, name, email, phone, address) 
VALUES (
  'test-school-001',
  'Test School',
  'test@school.com',
  '+254700000000',
  'Test Address'
) ON CONFLICT (id) DO NOTHING;

-- Insert some test students
INSERT INTO students (id, name, admission_number, class, school_id, parent_phone, parent_email) 
VALUES 
  (
    'student-001',
    'John Doe',
    '2024/001',
    'Class 3',
    'test-school-001',
    '+254700123456',
    'parent1@example.com'
  ),
  (
    'student-002',
    'Jane Smith',
    '2024/002',
    'Class 4',
    'test-school-001',
    '+254700123456',
    'parent1@example.com'
  ),
  (
    'student-003',
    'Bob Johnson',
    '2024/003',
    'Class 5',
    'test-school-001',
    '+254700789012',
    'parent2@example.com'
  )
ON CONFLICT (id) DO NOTHING; 