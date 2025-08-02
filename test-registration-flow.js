const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Testing Registration Flow ===')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testRegistrationFlow() {
  try {
    console.log('Step 1: Create school')
    const schoolId = generateUUID()
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        id: schoolId,
        name: 'Test School',
        email: 'test@school.com',
        subscription_plan: 'core',
        verification_status: 'pending'
      })
      .select()
      .single()
    
    if (schoolError) {
      console.error('❌ School creation failed:', schoolError.message)
      return
    }
    console.log('✅ School created:', school.id)
    
    console.log('\nStep 2: Create user with school_id')
    const testEmail = `flow-test-${Date.now()}@example.com`
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        school_id: school.id,
        role: 'admin',
        name: 'Test User'
      }
    })
    
    if (error) {
      console.error('❌ User creation failed:', error.message)
      console.error('Status:', error.status)
      console.error('Code:', error.code)
      
      // Try without school_id in metadata
      console.log('\nStep 2b: Try without school_id in metadata')
      const { data: data2, error: error2 } = await supabase.auth.admin.createUser({
        email: `alt-${testEmail}`,
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          name: 'Test User'
        }
      })
      
      if (error2) {
        console.error('❌ Alternative also failed:', error2.message)
      } else {
        console.log('✅ Alternative succeeded:', data2.user.id)
        await supabase.auth.admin.deleteUser(data2.user.id)
      }
    } else {
      console.log('✅ User created:', data.user.id)
      
      console.log('\nStep 3: Create user profile')
      const now = new Date()
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: testEmail,
          name: 'Test User',
          role: 'admin',
          school_id: school.id,
          created_at: now,
          updated_at: now,
        }, {
          onConflict: 'id'
        })
        .select()
        .single()
      
      if (dbError) {
        console.error('❌ User profile creation failed:', dbError.message)
      } else {
        console.log('✅ User profile created:', userData.id)
      }
      
      // Clean up
      await supabase.auth.admin.deleteUser(data.user.id)
    }
    
    // Clean up school
    await supabase.from('schools').delete().eq('id', school.id)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testRegistrationFlow() 