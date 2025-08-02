const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Supabase Auth Diagnosis ===')
console.log('URL:', supabaseUrl)
console.log('Service Role Key exists:', !!serviceRoleKey)
console.log('Service Role Key length:', serviceRoleKey?.length || 0)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseAuth() {
  try {
    console.log('\n=== Testing Database Access ===')
    
    // Test basic database access
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    console.log('Users table access:', usersError ? 'FAILED' : 'SUCCESS')
    if (usersError) console.error('  Error:', usersError.message)
    
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('count')
      .limit(1)
    
    console.log('Schools table access:', schoolsError ? 'FAILED' : 'SUCCESS')
    if (schoolsError) console.error('  Error:', schoolsError.message)
    
    console.log('\n=== Testing Auth Configuration ===')
    
    // Test auth configuration
    const { data: authConfig, error: configError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    console.log('Auth admin access:', configError ? 'FAILED' : 'SUCCESS')
    if (configError) {
      console.error('  Error:', configError.message)
      console.error('  Status:', configError.status)
      console.error('  Code:', configError.code)
    }
    
    console.log('\n=== Testing User Creation ===')
    
    // Test with a simple user creation
    const testEmail = `diagnostic-${Date.now()}@example.com`
    console.log('Testing with email:', testEmail)
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (error) {
      console.log('User creation: FAILED')
      console.error('  Error:', error.message)
      console.error('  Status:', error.status)
      console.error('  Code:', error.code)
      
      // Try to get more details about the error
      if (error.message.includes('Database error')) {
        console.log('\n=== Database Error Analysis ===')
        console.log('This appears to be a database-level error.')
        console.log('Possible causes:')
        console.log('1. Trigger or constraint violation on auth.users table')
        console.log('2. RLS policy blocking service role access')
        console.log('3. Missing or incorrect database schema')
        console.log('4. Supabase Auth configuration issue')
      }
    } else {
      console.log('User creation: SUCCESS')
      console.log('  User ID:', data.user.id)
      
      // Clean up
      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id)
      if (deleteError) {
        console.error('  Failed to delete test user:', deleteError.message)
      } else {
        console.log('  Test user cleaned up successfully')
      }
    }
    
    console.log('\n=== Recommendations ===')
    if (configError) {
      console.log('1. Check your Supabase service role key')
      console.log('2. Verify your Supabase project settings')
      console.log('3. Ensure your database is properly configured')
    } else if (error && error.message.includes('Database error')) {
      console.log('1. Run the fix_supabase_auth_issues.sql migration')
      console.log('2. Check for any custom triggers on auth.users table')
      console.log('3. Verify RLS policies allow service role access')
      console.log('4. Check Supabase Auth settings in dashboard')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

diagnoseAuth() 