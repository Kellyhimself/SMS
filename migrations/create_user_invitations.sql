-- Migration: create_user_invitations.sql
-- Create user invitations table for secure user onboarding

-- User invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'parent', 'accountant')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_school ON user_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);

-- Create function to update user_invitations updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_invitations updated_at
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();

-- Add RLS policies for user_invitations table
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to read invitations for their school
CREATE POLICY "Users can read invitations for their school" ON user_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.school_id = user_invitations.school_id
    )
  );

-- Allow admins to create invitations for their school
CREATE POLICY "Admins can create invitations for their school" ON user_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.school_id = user_invitations.school_id
      AND users.role = 'admin'
    )
  );

-- Allow admins to update invitations for their school
CREATE POLICY "Admins can update invitations for their school" ON user_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.school_id = user_invitations.school_id
      AND users.role = 'admin'
    )
  );

-- Allow admins to delete invitations for their school
CREATE POLICY "Admins can delete invitations for their school" ON user_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.school_id = user_invitations.school_id
      AND users.role = 'admin'
    )
  );

-- Add invited_by and invitation_id fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES user_invitations(id);

-- Create index for invited_by
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_invitation_id ON users(invitation_id); 