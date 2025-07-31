import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: 'Session token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    
    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from('parent_sessions')
      .select('*')
      .eq('id', sessionToken)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    
    if (expiresAt < now) {
      await supabase
        .from('parent_sessions')
        .delete()
        .eq('id', sessionToken)
      
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401 }
      )
    }

    // Get parent-student links
    const { data: links, error: linksError } = await supabase
      .from('parent_student_links')
      .select(`
        *,
        students!inner(id, name, admission_number, class)
      `)
      .eq('parent_id', session.parent_id)

    if (linksError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch student data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: links || []
    })

  } catch (error) {
    console.error('Error in parent-dashboard API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 