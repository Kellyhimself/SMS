# SMS Authentication Testing Guide

## Overview

This guide covers how to test the parent SMS authentication system in different environments and scenarios. The system supports multiple testing modes to accommodate development, testing, and production needs.

## Testing Modes Available

### 1. Development Mode (FREE)
- **Purpose**: Local development and testing
- **Cost**: FREE
- **Features**: Console logging of OTPs, no actual SMS sent
- **Activation**: Automatically enabled when `NODE_ENV=development`

### 2. Sandbox Mode (FREE)
- **Purpose**: Testing with Africa's Talking sandbox
- **Cost**: FREE
- **Features**: Simulates real SMS API responses
- **Activation**: When Africa's Talking credentials are not configured

### 3. Mock Mode (FREE)
- **Purpose**: Unit testing and integration testing
- **Cost**: FREE
- **Features**: Completely simulated SMS responses
- **Activation**: Use `/api/auth/sms-mock` endpoint

### 4. Production Mode (PAID)
- **Purpose**: Real SMS delivery
- **Cost**: ~KSh 1-2 per SMS
- **Features**: Actual SMS delivery via Africa's Talking
- **Activation**: When Africa's Talking credentials are properly configured

## Testing Setup

### Prerequisites

1. **Environment Variables**
   ```bash
   # For development/sandbox testing (FREE)
   NODE_ENV=development
   
   # For production testing (requires Africa's Talking account)
   AFRICASTALKING_API_KEY=your_api_key
   AFRICASTALKING_USERNAME=your_username
   AFRICASTALKING_SENDER_ID=SCHOOL
   ```

2. **Database Setup**
   - Ensure parent accounts exist in the database
   - Test phone numbers should be registered in the system

### Test Phone Numbers

For testing purposes, use these phone numbers:

```bash
# Development/Sandbox Mode (FREE)
+254700000000  # Test number 1
+254700000001  # Test number 2
+254701000000  # Test number 3

# Production Mode (Real SMS)
+254712345678  # Your actual phone number
```

## Testing Methods

### Method 1: Manual Testing via UI

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to parent login**
   ```
   http://localhost:3000/parent-login
   ```

3. **Test the flow**
   - Enter a test phone number
   - Click "Send OTP"
   - Check console for OTP (in development mode)
   - Enter the OTP and verify

### Method 2: API Testing with curl

#### Test Development Mode
```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254700000000",
    "message": "Your OTP is: 123456"
  }'
```

#### Test Mock Mode
```bash
# Send OTP via mock endpoint
curl -X POST http://localhost:3000/api/auth/sms-mock \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254700000000",
    "message": "Your OTP is: 123456"
  }'
```

#### Test Sandbox Mode
```bash
# Send OTP via sandbox endpoint
curl -X POST http://localhost:3000/api/auth/sms-sandbox \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254700000000",
    "message": "Your OTP is: 123456"
  }'
```

### Method 3: Automated Testing

Create test scripts for different scenarios:

#### Test Script 1: Development Mode Testing
```javascript
// test-dev-mode.js
const testPhone = '+254700000000'

async function testDevelopmentMode() {
  console.log('🧪 Testing Development Mode...')
  
  const response = await fetch('/api/auth/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      message: 'Test OTP: 123456'
    })
  })
  
  const result = await response.json()
  console.log('Result:', result)
}
```

#### Test Script 2: Parent Authentication Flow
```javascript
// test-parent-auth.js
import { parentAuthService } from '@/services/parent-auth.service'

async function testParentAuth() {
  const testPhone = '+254700000000'
  
  // Test OTP sending
  console.log('📱 Sending OTP...')
  const sendResult = await parentAuthService.sendOTP(testPhone)
  console.log('Send Result:', sendResult)
  
  // Test OTP verification (you'll need to get the OTP from console)
  console.log('🔐 Verifying OTP...')
  const verifyResult = await parentAuthService.verifyOTP(testPhone, '123456')
  console.log('Verify Result:', verifyResult)
}
```

## Testing Scenarios

### Scenario 1: Happy Path Testing

1. **Valid parent phone number**
   - Phone exists in database
   - OTP sent successfully
   - OTP verified successfully
   - Session created
   - Redirect to dashboard

### Scenario 2: Error Handling

1. **Invalid phone number**
   - Phone not in database
   - Should return error message

2. **Invalid OTP**
   - Wrong OTP entered
   - Should return error message

3. **Expired OTP**
   - OTP older than 10 minutes
   - Should return error message

4. **Network issues**
   - Offline mode
   - Should handle gracefully

### Scenario 3: Edge Cases

1. **Multiple OTP requests**
   - Should handle rate limiting
   - Should invalidate previous OTPs

2. **Session management**
   - Session should expire after 24 hours
   - Should handle session validation

3. **Offline functionality**
   - Should work without internet
   - Should sync when online

## Console Monitoring

### Development Mode Console Output

When testing in development mode, you'll see console output like:

```
🔐 DEVELOPMENT/SANDBOX MODE - OTP for testing:
📱 Phone: +254700000000
🔢 OTP: 123456
⏰ Expires: 12/19/2024, 2:30:45 PM
💡 Use this OTP to test parent login (FREE)
```

### Production Mode Console Output

When testing in production mode, you'll see:

```
Africa's Talking SMS sent successfully: {
  phone: '5678',
  messageId: 'ATXid_123456789',
  status: 'sent'
}
```

## Testing Checklist

### Pre-Testing Setup
- [ ] Development server running
- [ ] Database connected
- [ ] Environment variables set
- [ ] Test parent account created
- [ ] Test phone number registered

### Functionality Testing
- [ ] OTP sending works
- [ ] OTP verification works
- [ ] Session creation works
- [ ] Error handling works
- [ ] Offline mode works
- [ ] Session validation works

### Security Testing
- [ ] OTP expiration works
- [ ] Rate limiting works
- [ ] Session expiration works
- [ ] Invalid OTP rejection works

### Performance Testing
- [ ] Response time < 2 seconds
- [ ] Handles concurrent requests
- [ ] Memory usage is reasonable
- [ ] Database queries are optimized

## Troubleshooting

### Common Issues

1. **OTP not received**
   - Check console for development mode output
   - Verify phone number format (+254...)
   - Check Africa's Talking credentials

2. **Database errors**
   - Verify parent account exists
   - Check database connection
   - Verify table structure

3. **API errors**
   - Check network connectivity
   - Verify API endpoint URLs
   - Check request/response format

4. **Session issues**
   - Clear browser storage
   - Check session token format
   - Verify IndexedDB access

### Debug Commands

```bash
# Check environment variables
echo $NODE_ENV
echo $AFRICASTALKING_API_KEY

# Check database connection
npm run db:check

# Test API endpoints
curl -X GET http://localhost:3000/api/health

# Check logs
tail -f logs/app.log
```

## Cost Optimization

### Development Testing (FREE)
- Use development mode for local testing
- Use mock endpoints for unit testing
- Use sandbox mode for integration testing

### Production Testing (Minimal Cost)
- Use test phone numbers only
- Limit SMS frequency during testing
- Use Africa's Talking sandbox when possible

### Cost Monitoring
- Track SMS costs in Africa's Talking dashboard
- Set up billing alerts
- Monitor usage patterns

## Next Steps

1. **Set up automated tests**
   - Unit tests for services
   - Integration tests for API endpoints
   - End-to-end tests for UI flows

2. **Implement monitoring**
   - SMS delivery tracking
   - Error rate monitoring
   - Performance metrics

3. **Production deployment**
   - Configure Africa's Talking production account
   - Set up proper environment variables
   - Test with real phone numbers

4. **User acceptance testing**
   - Test with actual parents
   - Gather feedback on user experience
   - Iterate based on feedback 