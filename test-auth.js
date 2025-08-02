const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key exists:', !!serviceRoleKey)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAuth() {
  try {
    console.log('Testing service role access...')
    
    // Test if we can access the auth.users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (usersError) {
      console.error('Error accessing users table:', usersError)
    } else {
      console.log('Successfully accessed users table')
    }
    
    // Test if we can access the schools table
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('count')
      .limit(1)
    
    if (schoolsError) {
      console.error('Error accessing schools table:', schoolsError)
    } else {
      console.log('Successfully accessed schools table')
    }
    
    // Test creating a test user
    const testEmail = `test-${Date.now()}@example.com`
    console.log('Testing user creation with email:', testEmail)
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'admin'
      }
    })
    
    if (error) {
      console.error('Error creating test user:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      })
    } else {
      console.log('Successfully created test user:', data.user.id)
      
      // Clean up - delete the test user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id)
      if (deleteError) {
        console.error('Error deleting test user:', deleteError)
      } else {
        console.log('Successfully deleted test user')
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testAuth() 