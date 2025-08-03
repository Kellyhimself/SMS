import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invitationService } from '@/services/invitation.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role and school
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

    // Only admins can check invitation status
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can check invitation status' },
        { status: 403 }
      )
    }

    // Get the invitation details
    const invitation = await invitationService.getInvitationById(invitationId)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Ensure admin can only check invitations from their own school
    if (invitation.school_id !== userProfile.school_id) {
      return NextResponse.json(
        { error: 'You can only check invitations from your own school' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
        updated_at: invitation.updated_at,
        school_id: invitation.school_id,
        invited_by: invitation.invited_by
      }
    })
  } catch (error) {
    console.error('Error checking invitation status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check invitation status' },
      { status: 500 }
    )
  }
} 