-- Migration: fix_subscription_plan_constraint.sql
-- Safely add subscription_plan field to schools table, handling existing constraints

-- Add subscription_plan column to schools table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'schools' AND column_name = 'subscription_plan') THEN
    ALTER TABLE schools ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'core';
  END IF;
END $$;

-- Drop the constraint if it exists and recreate it
DO $$
BEGIN
  -- Drop the constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'schools_subscription_plan_check' 
             AND table_name = 'schools') THEN
    ALTER TABLE schools DROP CONSTRAINT schools_subscription_plan_check;
  END IF;
  
  -- Create the constraint
  ALTER TABLE schools ADD CONSTRAINT schools_subscription_plan_check 
    CHECK (subscription_plan IN ('core', 'premium'));
END $$;

-- Create index for subscription_plan queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_schools_subscription_plan ON schools(subscription_plan);

-- Update existing schools to have 'core' subscription plan (for backward compatibility)
UPDATE schools SET subscription_plan = 'core' WHERE subscription_plan IS NULL;

-- Add comment to document the subscription plan
COMMENT ON COLUMN schools.subscription_plan IS 'Subscription plan for the school: core or premium'; 