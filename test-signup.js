// Simple test to isolate the signup issue
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  try {
    console.log('Testing signup...')
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (error) {
      console.error('Signup error:', error)
    } else {
      console.log('Signup successful:', data)
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testSignup() 