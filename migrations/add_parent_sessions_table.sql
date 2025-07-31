-- Add parent_sessions table for storing parent authentication sessions
-- Migration: add_parent_sessions_table.sql

-- Create parent_sessions table
CREATE TABLE IF NOT EXISTS parent_sessions (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
  phone VARCHAR(15) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_sessions_parent ON parent_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_phone ON parent_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_expires ON parent_sessions(expires_at);

-- Add RLS policies for parent_sessions table
ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations on parent_sessions (for testing)
CREATE POLICY "Allow all operations on parent_sessions" ON parent_sessions
  FOR ALL USING (true);

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