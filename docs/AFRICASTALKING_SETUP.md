# Africa's Talking SMS Integration Setup

## Overview

This guide will help you set up Africa's Talking SMS integration for parent authentication in the School Management System.

## Why Africa's Talking?

- ✅ **Cost-effective**: ~KSh 1.00 per SMS vs KSh 7.50 with Twilio
- ✅ **Local expertise**: Designed for African markets
- ✅ **Better delivery**: Optimized for Kenyan networks
- ✅ **Local support**: Kenyan-based support team
- ✅ **M-Pesa integration**: Local payment methods

## Step 1: Create Africa's Talking Account

1. **Go to [Africa's Talking](https://africastalking.com/)**
2. **Click "Get Started"**
3. **Create an account** with your business details
4. **Verify your account** (may take 24-48 hours)
5. **Get your credentials**:
   - API Key
   - Username
   - Sender ID (your SMS sender name)

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Africa's Talking Configuration
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_USERNAME=your_username_here
AFRICASTALKING_SENDER_ID=SCHOOL

# Remove old Twilio variables (no longer needed)
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_MESSAGING_SERVICE_SID=...
```

## Step 3: Create Database Table

Run this SQL in your Supabase dashboard:

```sql
-- Create OTP codes table for SMS authentication
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  parent_id UUID REFERENCES parent_accounts(id),
  created_at TIMESTAMP DEFAULT NOW()
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
```

## Step 4: Test the Integration

### Test SMS Sending

Run the test script:

```bash
# Test with default phone number
node scripts/test-sms.js

# Test with specific phone number
node scripts/test-sms.js +254700000000
```

### Test Parent Authentication

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to parent login page**: `http://localhost:3000/parent-login`

3. **Test scenarios**:
   - ✅ Valid parent phone number
   - ✅ Invalid phone number
   - ✅ Expired OTP
   - ✅ Invalid OTP

## Step 5: Add Test Parent Data

Insert test parent data in Supabase:

```sql
-- Insert test parent account
INSERT INTO parent_accounts (
  id, phone, name, school_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '+254700000000', -- Replace with your test phone
  'Test Parent',
  'your_school_id', -- Replace with actual school ID
  true,
  NOW(),
  NOW()
);
```

## Step 6: Verify Implementation

### Check Files Created/Modified:

1. ✅ `src/app/api/auth/sms/route.ts` - Africa's Talking SMS API
2. ✅ `src/services/parent-auth.service.ts` - Updated parent auth service
3. ✅ `supabase/migrations/20241201000000_create_otp_codes_table.sql` - Database migration
4. ✅ `scripts/test-sms.js` - Test script

### Test the Complete Flow:

1. **Send OTP**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/sms \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "+254700000000",
       "message": "Test SMS from School Management System"
     }'
   ```

2. **Verify OTP**:
   - Check your phone for the SMS
   - Note the OTP code
   - Test parent login with the OTP

## Troubleshooting

### Common Issues:

#### 1. "Missing Africa's Talking credentials"
**Solution**: Check your `.env.local` file has the correct credentials

#### 2. "Failed to send SMS"
**Possible causes**:
- Invalid API credentials
- Insufficient account balance
- Invalid phone number format
- Account not verified

**Solutions**:
- Verify credentials in Africa's Talking dashboard
- Add funds to your account
- Use international format: `+254700000000`
- Wait for account verification

#### 3. "OTP not received"
**Solutions**:
- Check spam folder
- Verify phone number format
- Test with Africa's Talking dashboard
- Check account balance

#### 4. "Database errors"
**Solutions**:
- Run the migration SQL in Supabase
- Check RLS policies are correct
- Verify table structure

### Debug Steps:

1. **Check Africa's Talking dashboard** for SMS delivery status
2. **Check Supabase logs** for database errors
3. **Check browser console** for API errors
4. **Run test script** to isolate issues

## Cost Optimization

### SMS Pricing (Kenya):
- **Africa's Talking**: ~KSh 1.00 per SMS
- **Twilio**: ~KSh 7.50 per SMS

### Monthly Cost Comparison:
- **100 SMS/day**: 
  - Africa's Talking: ~KSh 3,000/month
  - Twilio: ~KSh 22,500/month

### Tips to Reduce Costs:
1. **Set rate limits** in your application
2. **Use shorter messages** when possible
3. **Implement OTP expiration** (already done - 10 minutes)
4. **Monitor usage** in Africa's Talking dashboard

## Production Deployment

### Environment Variables for Production:

```bash
# Production environment
AFRICASTALKING_API_KEY=your_production_api_key
AFRICASTALKING_USERNAME=your_production_username
AFRICASTALKING_SENDER_ID=SCHOOL
```

### Security Considerations:

1. **Rate limiting**: Implement to prevent abuse
2. **Phone validation**: Verify phone number format
3. **OTP expiration**: Already implemented (10 minutes)
4. **Logging**: Monitor for suspicious activity

### Monitoring:

1. **Africa's Talking dashboard**: Monitor delivery rates
2. **Application logs**: Monitor API usage
3. **Database logs**: Monitor OTP usage patterns
4. **Cost tracking**: Monitor monthly SMS costs

## Support

### Africa's Talking Support:
- **Email**: support@africastalking.com
- **Phone**: +254 711 082 000
- **Documentation**: https://docs.africastalking.com/

### Application Support:
- Check the troubleshooting section above
- Review application logs
- Test with the provided test script

## Next Steps

After successful setup:

1. ✅ **Test parent authentication flow**
2. ✅ **Monitor SMS delivery rates**
3. ✅ **Optimize costs** based on usage
4. ✅ **Plan for production deployment**
5. ✅ **Consider Phase 2**: Add SMS to school auth
6. ✅ **Consider Phase 3**: Full authentication unification

The Africa's Talking integration provides a cost-effective, reliable SMS solution for your School Management System's parent authentication feature. 