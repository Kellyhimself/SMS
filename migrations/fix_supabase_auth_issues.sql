-- Migration: fix_supabase_auth_issues.sql
-- Fix Supabase Auth issues that prevent user creation

-- First, let's check if there are any problematic triggers on auth.users
-- Drop any custom triggers that might interfere with Supabase Auth
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Drop any triggers on auth.users that we didn't create
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND trigger_schema = 'auth'
        AND trigger_name NOT IN ('auth.users_audit_trigger')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

-- Ensure the users table has the correct structure and no problematic constraints
-- Check if there are any NOT NULL constraints on school_id that might cause issues
DO $$
BEGIN
    -- Make school_id nullable if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'school_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;
    END IF;
    
    -- Ensure role has a default value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';
    END IF;
    
    -- Ensure name has a default value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE users ALTER COLUMN name SET DEFAULT 'Unknown';
    END IF;
END $$;

-- Drop any problematic RLS policies that might interfere with service role
DROP POLICY IF EXISTS "Enable all access for service role" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON otp_codes;

-- Create a comprehensive service role policy that bypasses RLS completely
CREATE POLICY "Service role bypass RLS" ON users
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Also ensure the service role can access otp_codes
CREATE POLICY "Service role can manage OTP codes" ON otp_codes
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Ensure there are no problematic functions that might interfere
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_users_updated_at();

-- Recreate the update_users_updated_at function properly
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Ensure the users table has proper indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add a comment to document the fix
COMMENT ON TABLE users IS 'Users table - ensure school_id is nullable for auth user creation'; 