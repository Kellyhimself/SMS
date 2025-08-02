const fetch = require('node-fetch')

console.log('=== Testing API Registration ===')

async function testAPIRegistration() {
  try {
    const credentials = {
      name: 'Test User',
      email: `api-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'admin',
      school: {
        name: 'Test School',
        email: 'test@school.com',
        address: 'Test Address',
        phone: '+254700000000',
        subscription_plan: 'core'
      }
    }
    
    console.log('Sending registration request...')
    console.log('Email:', credentials.email)
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Registration failed:', errorData.error)
      console.error('Status:', response.status)
    } else {
      const data = await response.json()
      console.log('✅ Registration successful')
      console.log('User ID:', data.user.id)
      console.log('School ID:', data.school.id)
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

testAPIRegistration() 