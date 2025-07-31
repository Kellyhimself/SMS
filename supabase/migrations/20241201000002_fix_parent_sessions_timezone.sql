-- Fix timezone issue in parent_sessions table
-- Convert TIMESTAMP columns to TIMESTAMPTZ to handle timezone properly

-- Drop existing trigger first
DROP TRIGGER IF EXISTS update_parent_sessions_updated_at ON parent_sessions;

-- First, add new columns with TIMESTAMPTZ
ALTER TABLE parent_sessions ADD COLUMN created_at_new TIMESTAMPTZ;
ALTER TABLE parent_sessions ADD COLUMN expires_at_new TIMESTAMPTZ;

-- Convert existing data to UTC timezone
UPDATE parent_sessions SET 
  created_at_new = created_at AT TIME ZONE 'UTC',
  expires_at_new = expires_at AT TIME ZONE 'UTC';

-- Drop old columns
ALTER TABLE parent_sessions DROP COLUMN created_at;
ALTER TABLE parent_sessions DROP COLUMN expires_at;

-- Rename new columns to original names
ALTER TABLE parent_sessions RENAME COLUMN created_at_new TO created_at;
ALTER TABLE parent_sessions RENAME COLUMN expires_at_new TO expires_at;

-- Make columns NOT NULL
ALTER TABLE parent_sessions ALTER COLUMN expires_at SET NOT NULL;

-- Update the default for created_at
ALTER TABLE parent_sessions ALTER COLUMN created_at SET DEFAULT NOW();

-- Recreate the trigger
CREATE TRIGGER update_parent_sessions_updated_at
  BEFORE UPDATE ON parent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_sessions_updated_at(); 