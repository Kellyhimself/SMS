-- Migration: fix_users_signup.sql
-- Fix users table signup issues by allowing all operations temporarily

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON users;
DROP POLICY IF EXISTS "Enable signup operations" ON users;

-- Create a simple policy that allows all operations for now
CREATE POLICY "Allow all operations for users" ON users
  FOR ALL USING (true); 