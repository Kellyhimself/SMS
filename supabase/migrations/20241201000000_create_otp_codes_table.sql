-- Create OTP codes table for SMS authentication
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  parent_id UUID REFERENCES parent_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_parent ON otp_codes(parent_id);

-- Add RLS policies
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage OTP codes
CREATE POLICY "Users can manage OTP codes" ON otp_codes
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow service role to manage OTP codes (for API routes)
CREATE POLICY "Service role can manage OTP codes" ON otp_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Clean up expired OTPs (optional - can be done via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql; 