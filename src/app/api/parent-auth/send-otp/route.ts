import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Use server-side Supabase client with service role
    const supabase = createServerSupabaseClient()
    
    console.log(`🔍 Starting OTP process for phone: ${phone}`)
    
    // First, check if parent account already exists
    let { data: parentAccount, error } = await supabase
      .from('parent_accounts')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    console.log(`📱 Parent account lookup result:`, { parentAccount, error })

    // If parent account doesn't exist, try to create one from student data
    if (error || !parentAccount) {
      console.log(`Parent account not found for phone: ${phone}, checking student data...`)
      
      // Find students with this parent phone number
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_phone', phone)

      console.log(`👥 Students lookup result:`, { students, studentsError })

      if (studentsError) {
        console.error('Error fetching students:', studentsError)
        return NextResponse.json(
          { success: false, message: 'Phone number not found in our system. Please contact the school administration.' },
          { status: 500 }
        )
      }

      if (!students || students.length === 0) {
        console.log(`❌ No students found with parent phone: ${phone}`)
        return NextResponse.json(
          { success: false, message: 'Phone number not found in our system. Please contact the school administration.' },
          { status: 404 }
        )
      }

      console.log(`✅ Found ${students.length} students with parent phone: ${phone}`)

      // Create parent account from student data
      const firstStudent = students[0]
      const parentName = `Parent of ${firstStudent.name}`
      
      const { data: newParentAccount, error: createError } = await supabase
        .from('parent_accounts')
        .insert({
          phone: phone,
          name: parentName,
          email: firstStudent.parent_email || null,
          school_id: firstStudent.school_id,
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating parent account:', createError)
        return NextResponse.json(
          { success: false, message: 'Failed to create parent account. Please contact the school administration.' },
          { status: 500 }
        )
      }

      parentAccount = newParentAccount

      // Create parent-student links for all students with this phone number
      for (const student of students) {
        await supabase
          .from('parent_student_links')
          .insert({
            parent_id: parentAccount.id,
            student_id: student.id,
            relationship: 'parent',
            is_primary: students.indexOf(student) === 0 // First student is primary
          })
      }

      console.log(`Created parent account for phone: ${phone} with ${students.length} students`)
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration to 10 minutes from now
    const now = new Date()
    const expires = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes from now

    console.log(`🕐 Current time: ${now.toISOString()}`)
    console.log(`⏰ OTP expires at: ${expires.toISOString()}`)

    // Store OTP in Supabase database
    const { error: otpError } = await supabase
      .from('otp_codes')
      .upsert({
        phone: phone,
        otp: otp,
        expires_at: expires.toISOString(),
        parent_id: parentAccount.id
      })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      return NextResponse.json(
        { success: false, message: 'Failed to generate OTP. Please try again.' },
        { status: 500 }
      )
    }

    // Development/Sandbox mode: Log OTP to console
    const DEV_MODE = process.env.NODE_ENV === 'development'
    const USE_SANDBOX = !process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME

    if (DEV_MODE || USE_SANDBOX) {
      console.log('🔐 DEVELOPMENT/SANDBOX MODE - OTP for testing:')
      console.log(`📱 Phone: ${phone}`)
      console.log(`🔢 OTP: ${otp}`)
      console.log(`⏰ Expires: ${expires.toLocaleString()}`)
      console.log(`👤 Parent: ${parentAccount.name}`)
      console.log('💡 Use this OTP to test parent login (FREE)')
      
      if (USE_SANDBOX) {
        console.log('🧪 SANDBOX MODE: No Africa\'s Talking credentials found')
        console.log('💡 Set AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME for real SMS')
      }
      
      return NextResponse.json({
        success: true,
        message: `OTP sent successfully (${USE_SANDBOX ? 'SANDBOX' : 'DEV'} MODE). Check console for OTP: ${otp}`
      })
    } else {
      // Production mode: Send actual SMS
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: `Your School Parent Portal OTP is: ${otp}. Valid for 10 minutes.`
        })
      })

      if (!smsResponse.ok) {
        const errorData = await smsResponse.json()
        console.error('SMS sending failed:', errorData)
        return NextResponse.json(
          { success: false, message: 'Failed to send OTP. Please try again.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully'
      })
    }

  } catch (error) {
    console.error('Error in send-otp API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
} 