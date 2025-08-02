const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Testing User Metadata Issue ===')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testMetadataIssue() {
  try {
    console.log('Test 1: Create user with school_id in metadata')
    const testEmail1 = `metadata-test-${Date.now()}@example.com`
    
    const { data: data1, error: error1 } = await supabase.auth.admin.createUser({
      email: testEmail1,
      password: 'test123',
      email_confirm: true,
      user_metadata: {
        school_id: '5a285e96-2dbb-4ec3-96d7-0d559720fff1', // UUID from your error
        role: 'admin',
        name: 'Test User'
      }
    })
    
    if (error1) {
      console.error('❌ Test 1 failed:', error1.message)
    } else {
      console.log('✅ Test 1 succeeded:', data1.user.id)
      await supabase.auth.admin.deleteUser(data1.user.id)
    }
    
    console.log('\nTest 2: Create user with string school_id')
    const testEmail2 = `metadata-test2-${Date.now()}@example.com`
    
    const { data: data2, error: error2 } = await supabase.auth.admin.createUser({
      email: testEmail2,
      password: 'test123',
      email_confirm: true,
      user_metadata: {
        school_id: 'test-school-id', // String instead of UUID
        role: 'admin',
        name: 'Test User'
      }
    })
    
    if (error2) {
      console.error('❌ Test 2 failed:', error2.message)
    } else {
      console.log('✅ Test 2 succeeded:', data2.user.id)
      await supabase.auth.admin.deleteUser(data2.user.id)
    }
    
    console.log('\nTest 3: Create user without school_id in metadata')
    const testEmail3 = `metadata-test3-${Date.now()}@example.com`
    
    const { data: data3, error: error3 } = await supabase.auth.admin.createUser({
      email: testEmail3,
      password: 'test123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Test User'
      }
    })
    
    if (error3) {
      console.error('❌ Test 3 failed:', error3.message)
    } else {
      console.log('✅ Test 3 succeeded:', data3.user.id)
      await supabase.auth.admin.deleteUser(data3.user.id)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testMetadataIssue() 