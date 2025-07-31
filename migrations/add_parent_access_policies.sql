-- Add parent access policies for RLS
-- Migration: add_parent_access_policies.sql

-- Add policy for parents to view their own student links
-- This policy allows parents to access parent_student_links where they are the parent
CREATE POLICY "Parents can view their own student links" ON parent_student_links
  FOR SELECT USING (
    parent_id IN (
      SELECT parent_id FROM parent_sessions 
      WHERE id = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND expires_at > NOW()
    )
  );

-- Add policy for parents to view their own account information
CREATE POLICY "Parents can view their own account" ON parent_accounts
  FOR SELECT USING (
    id IN (
      SELECT parent_id FROM parent_sessions 
      WHERE id = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND expires_at > NOW()
    )
  );

-- Add policy for parents to view their own session information
CREATE POLICY "Parents can view their own session" ON parent_sessions
  FOR SELECT USING (
    id = current_setting('request.jwt.claims', true)::json->>'session_token'
    AND expires_at > NOW()
  );

-- Add policy for parents to update their own session
CREATE POLICY "Parents can update their own session" ON parent_sessions
  FOR UPDATE USING (
    id = current_setting('request.jwt.claims', true)::json->>'session_token'
    AND expires_at > NOW()
  );

-- Add policy for parents to delete their own session
CREATE POLICY "Parents can delete their own session" ON parent_sessions
  FOR DELETE USING (
    id = current_setting('request.jwt.claims', true)::json->>'session_token'
    AND expires_at > NOW()
  ); 