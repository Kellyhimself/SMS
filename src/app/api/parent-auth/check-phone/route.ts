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
    
    // Check for students with this phone number
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('parent_phone', phone)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json(
        { success: false, message: 'Error checking phone number' },
        { status: 500 }
      )
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Phone number not found in our system' },
        { status: 404 }
      )
    }

    // Return success with student count (don't expose sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Phone number found',
      studentCount: students.length,
      schools: [...new Set(students.map(s => s.school_id))]
    })

  } catch (error) {
    console.error('Error in check-phone API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 