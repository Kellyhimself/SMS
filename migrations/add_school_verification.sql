-- Migration: add_school_verification.sql
-- Add verification fields to schools table for security improvements

-- Add verification status to schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);

-- Add check constraint for verification status
ALTER TABLE schools ADD CONSTRAINT schools_verification_status_check 
  CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Create index for verification status queries
CREATE INDEX IF NOT EXISTS idx_schools_verification_status ON schools(verification_status);

-- Update existing schools to be verified (for backward compatibility)
UPDATE schools SET verification_status = 'verified' WHERE verification_status IS NULL;

-- Add comment to document the verification process
COMMENT ON COLUMN schools.verification_status IS 'Status of school verification: pending, verified, or rejected';
COMMENT ON COLUMN schools.verified_at IS 'Timestamp when school was verified';
COMMENT ON COLUMN schools.verified_by IS 'User ID who verified the school'; 