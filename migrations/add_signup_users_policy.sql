-- Migration: add_signup_users_policy.sql
-- Add policy to allow signup operations for users table

-- Allow signup operations (when user is not yet authenticated)
CREATE POLICY "Enable signup operations" ON users
  FOR INSERT WITH CHECK (true); 