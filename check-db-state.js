const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Database State Check ===')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabaseState() {
  try {
    console.log('\n=== Checking Users Table Structure ===')
    
    // Check users table structure
    const { data: usersStructure, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(0)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
    } else {
      console.log('✅ Users table accessible')
    }
    
    // Check if we can insert into users table
    console.log('\n=== Testing Users Table Insert ===')
    const testUserId = 'test-user-' + Date.now()
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Users table insert error:', insertError.message)
    } else {
      console.log('✅ Users table insert successful')
      
      // Clean up
      await supabase.from('users').delete().eq('id', testUserId)
    }
    
    // Check schools table
    console.log('\n=== Checking Schools Table ===')
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .limit(1)
    
    if (schoolsError) {
      console.error('❌ Schools table error:', schoolsError.message)
    } else {
      console.log('✅ Schools table accessible')
      if (schoolsData && schoolsData.length > 0) {
        console.log('  Sample school:', schoolsData[0].name)
      }
    }
    
    // Check auth.users table (if accessible)
    console.log('\n=== Checking Auth Configuration ===')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    if (authError) {
      console.error('❌ Auth admin error:', authError.message)
    } else {
      console.log('✅ Auth admin accessible')
      console.log('  Total users:', authUsers.users?.length || 0)
    }
    
    console.log('\n=== Summary ===')
    console.log('If all checks pass but user creation still fails,')
    console.log('the issue is likely with Supabase Auth triggers or')
    console.log('project configuration in the Supabase dashboard.')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkDatabaseState() 