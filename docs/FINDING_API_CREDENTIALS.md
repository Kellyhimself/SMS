# Finding Africa's Talking API Credentials

## 🔍 Where to Find Your API Credentials

### **Step 1: Login to Africa's Talking Dashboard**

1. Go to [Africa's Talking Dashboard](https://account.africastalking.com/)
2. Login with your account credentials

### **Step 2: Navigate to API Section**

Look for these sections in your dashboard:

#### **Option A: Direct API Key Section**
- Look for **"API Key"** or **"Credentials"** in the main menu
- Usually found in the top navigation or sidebar

#### **Option B: Account Settings**
- Click on **"Account"** or **"Profile"**
- Look for **"API Key"** or **"Credentials"** subsection

#### **Option C: Developer Section**
- Look for **"Developer"** or **"API"** section
- Find **"API Key"** or **"Credentials"**

#### **Option D: Settings**
- Go to **"Settings"** or **"Preferences"**
- Look for **"API Key"** or **"Credentials"**

### **Step 3: What You Should See**

You should find something like this:
```
API Key: 1234567890abcdef1234567890abcdef
Username: your_username
```

### **Step 4: Copy Your Credentials**

Copy these values to your `.env.local`:
```bash
AFRICASTALKING_API_KEY=1234567890abcdef1234567890abcdef
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_SENDER_ID=SCHOOL
```

## 🚨 If You Can't Find API Keys

### **Common Dashboard Layouts:**

#### **Layout 1:**
```
Dashboard
├── Overview
├── SMS
├── Voice
├── Account Settings ← Look here
│   ├── Profile
│   ├── API Key ← This is what you need
│   └── Billing
└── Support
```

#### **Layout 2:**
```
Dashboard
├── Overview
├── SMS
├── Voice
├── Developer ← Look here
│   ├── API Key ← This is what you need
│   ├── Documentation
│   └── SDKs
└── Support
```

#### **Layout 3:**
```
Dashboard
├── Overview
├── SMS
├── Voice
├── Settings ← Look here
│   ├── API Key ← This is what you need
│   ├── Notifications
│   └── Security
└── Support
```

## 🧪 Alternative: Use Sandbox Mode (FREE)

If you can't find API credentials, you can still test for FREE:

### **Step 1: Set up sandbox environment**
```bash
# Leave these empty or don't set them
# AFRICASTALKING_API_KEY=
# AFRICASTALKING_USERNAME=
```

### **Step 2: Test with sandbox mode**
```bash
npm run dev
# Go to http://localhost:3000/parent-login
# Enter phone number
# Check console for OTP (FREE)
```

### **Step 3: Sandbox features**
- ✅ **FREE testing** - No SMS costs
- ✅ **Real database** - Tests OTP storage
- ✅ **Real authentication** - Tests login flow
- ✅ **Console logging** - OTP appears in browser console

## 📞 Getting Help

### **Contact Africa's Talking Support:**
- **Email**: support@africastalking.com
- **Phone**: +254 711 082 000
- **Live Chat**: Available on their website

### **What to ask for:**
"Hi, I'm trying to find my API credentials in the dashboard. I can see 'Teams' and 'Sandbox' but I need my API Key and Username for SMS integration. Can you help me locate these?"

## 🎯 Quick Test (No API Keys Needed)

You can test everything RIGHT NOW without API keys:

```bash
# 1. Start development server
npm run dev

# 2. Go to parent login
# http://localhost:3000/parent-login

# 3. Enter any phone number
# +254700000000

# 4. Click "Send OTP"

# 5. Check browser console (F12) for OTP
# You'll see something like:
# 🔐 DEVELOPMENT/SANDBOX MODE - OTP for testing:
# 📱 Phone: +254700000000
# 🔢 OTP: 123456
# 💡 Use this OTP to test parent login (FREE)

# 6. Enter the OTP to test login
```

## 💡 Pro Tips

1. **API keys are usually in Account Settings**
2. **Look for "Developer" or "API" sections**
3. **Check "Settings" or "Preferences"**
4. **Contact support if you can't find them**
5. **Use sandbox mode for free testing**

## 🔗 Next Steps

After finding API credentials:

1. **✅ Add them to `.env.local`**
2. **✅ Test with real SMS** (small cost)
3. **✅ Deploy to production**
4. **✅ Monitor usage**

If you still can't find them, use sandbox mode for free testing! 