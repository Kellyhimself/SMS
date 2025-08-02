const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Simple Supabase Auth Test ===')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSimpleAuth() {
  try {
    console.log('Testing basic user creation...')
    
    const testEmail = `simple-test-${Date.now()}@example.com`
    console.log('Email:', testEmail)
    
    // Test 1: Create user with minimal data
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123',
      email_confirm: true
    })
    
    if (error) {
      console.error('❌ Error:', error.message)
      console.error('Status:', error.status)
      console.error('Code:', error.code)
      
      // Test 2: Try with different approach
      console.log('\nTrying alternative approach...')
      const { data: data2, error: error2 } = await supabase.auth.admin.createUser({
        email: `alt-${testEmail}`,
        password: 'test123',
        email_confirm: true,
        user_metadata: {}
      })
      
      if (error2) {
        console.error('❌ Alternative also failed:', error2.message)
      } else {
        console.log('✅ Alternative succeeded:', data2.user.id)
        // Clean up
        await supabase.auth.admin.deleteUser(data2.user.id)
      }
    } else {
      console.log('✅ Success:', data.user.id)
      // Clean up
      await supabase.auth.admin.deleteUser(data.user.id)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testSimpleAuth() 