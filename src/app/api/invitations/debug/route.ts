import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only admins can debug
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can debug invitations' },
        { status: 403 }
      )
    }

    // Get all invitations for the school
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('school_id', userProfile.school_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations for debug:', error)
      return NextResponse.json(
        { error: `Failed to fetch invitations: ${error.message}` },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      school_id: userProfile.school_id,
      total_invitations: invitations?.length || 0,
      invitations: invitations?.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
        updated_at: inv.updated_at
      })) || []
    })
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to debug invitations' },
      { status: 500 }
    )
  }
} 

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only admins can debug
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can debug invitations' },
        { status: 403 }
      )
    }

    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    console.log('Debug: Testing invitation ID:', invitationId)

    // Test fetching the specific invitation
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    console.log('Debug: Invitation fetch result:', { invitation, error })

    return NextResponse.json({
      invitationId,
      found: !!invitation,
      invitation: invitation || null,
      error: error?.message || null
    })
  } catch (error) {
    console.error('Error in debug POST endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to debug invitation' },
      { status: 500 }
    )
  }
} 