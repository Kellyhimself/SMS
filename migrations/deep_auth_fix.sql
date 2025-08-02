-- Migration: deep_auth_fix.sql
-- Deep fix for Supabase Auth issues by removing all potential interference

-- Step 1: Completely disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL triggers that might interfere with auth
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Drop ALL triggers on users table
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON users';
    END LOOP;
    
    -- Drop ALL triggers on auth.users table (except system ones)
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND trigger_schema = 'auth'
        AND trigger_name NOT IN ('auth.users_audit_trigger', 'auth.users_audit_trigger_insert', 'auth.users_audit_trigger_update', 'auth.users_audit_trigger_delete')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

-- Step 3: Drop ALL functions that might interfere
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_users_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_otps();

-- Step 4: Ensure users table has minimal constraints
DO $$
BEGIN
    -- Make school_id nullable
    ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;
    
    -- Ensure role has a default
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';
    
    -- Ensure name has a default
    ALTER TABLE users ALTER COLUMN name SET DEFAULT 'Unknown';
    
    -- Remove any problematic check constraints on role
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%role%' 
               AND table_name = 'users' 
               AND constraint_type = 'CHECK') THEN
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || 
                (SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE constraint_name LIKE '%role%' 
                 AND table_name = 'users' 
                 AND constraint_type = 'CHECK' LIMIT 1);
    END IF;
END $$;

-- Step 5: Recreate only essential trigger for updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Step 6: Create minimal RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role complete access
CREATE POLICY "Service role complete access" ON users
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Allow authenticated users basic access
CREATE POLICY "Authenticated users access" ON users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Step 7: Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 8: Add comment
COMMENT ON TABLE users IS 'Users table - minimal configuration for Supabase Auth compatibility'; 