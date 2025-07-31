-- Fix timezone issue in otp_codes table
-- Convert TIMESTAMP columns to TIMESTAMPTZ to handle timezone properly

-- First, add new columns with TIMESTAMPTZ
ALTER TABLE otp_codes ADD COLUMN expires_at_new TIMESTAMPTZ;
ALTER TABLE otp_codes ADD COLUMN created_at_new TIMESTAMPTZ;

-- Convert existing data to UTC timezone
UPDATE otp_codes SET 
  expires_at_new = expires_at AT TIME ZONE 'UTC',
  created_at_new = created_at AT TIME ZONE 'UTC';

-- Drop old columns
ALTER TABLE otp_codes DROP COLUMN expires_at;
ALTER TABLE otp_codes DROP COLUMN created_at;

-- Rename new columns to original names
ALTER TABLE otp_codes RENAME COLUMN expires_at_new TO expires_at;
ALTER TABLE otp_codes RENAME COLUMN created_at_new TO created_at;

-- Make columns NOT NULL
ALTER TABLE otp_codes ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE otp_codes ALTER COLUMN created_at SET NOT NULL;

-- Update the default for created_at
ALTER TABLE otp_codes ALTER COLUMN created_at SET DEFAULT NOW(); 