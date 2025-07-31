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

    // Use server-side Supabase client with service role
    const supabase = createServerSupabaseClient()
    
    // Check if session exists and is valid
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
      // Clean up expired session
      await supabase
        .from('parent_sessions')
        .delete()
        .eq('id', sessionToken)
      
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401 }
      )
    }

    // Get parent account using service role (bypasses RLS)
    const { data: parentAccount, error: parentError } = await supabase
      .from('parent_accounts')
      .select('*')
      .eq('id', session.parent_id)
      .eq('is_active', true)
      .single()

    if (parentError || !parentAccount) {
      return NextResponse.json(
        { success: false, message: 'Parent account not found or inactive' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      valid: true,
      parent: parentAccount
    })

  } catch (error) {
    console.error('Error in validate-session API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to validate session' },
      { status: 500 }
    )
  }
} 