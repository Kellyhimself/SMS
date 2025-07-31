-- Add updated_at column to parent_sessions table
ALTER TABLE parent_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_parent_sessions_updated_at ON parent_sessions;

-- Create function to update parent_sessions updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for parent_sessions updated_at
CREATE TRIGGER update_parent_sessions_updated_at
  BEFORE UPDATE ON parent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_sessions_updated_at(); 