-- Migration: add_service_role_users_policy.sql
-- Add service role policy for users table to allow Supabase Auth to work properly

-- Allow service role to bypass RLS for all operations on users table
CREATE POLICY "Enable all access for service role" ON users
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text); 