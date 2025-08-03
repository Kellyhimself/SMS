import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invitationService } from '@/services/invitation.service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params
    console.log(`Attempting to revoke invitation: ${invitationId}`)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`User authenticated: ${user.id}`)

    // Get user profile to check role and school
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.log('Profile error:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log(`User profile: role=${userProfile.role}, school_id=${userProfile.school_id}`)

    // Only admins can revoke invitations
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can revoke invitations' },
        { status: 403 }
      )
    }

    // Get the invitation to verify it belongs to the user's school
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('school_id')
      .eq('id', invitationId)
      .single()

    if (invitationError) {
      if (invitationError.code === 'PGRST116') {
        console.log('Invitation not found - may have been already deleted')
        return NextResponse.json(
          { message: 'Invitation not found or already revoked' },
          { status: 200 }
        )
      }
      console.log('Invitation fetch error:', invitationError)
      return NextResponse.json(
        { error: 'Failed to fetch invitation' },
        { status: 500 }
      )
    }

    if (!invitation) {
      console.log('No invitation found with ID:', invitationId)
      return NextResponse.json(
        { message: 'Invitation not found or already revoked' },
        { status: 200 }
      )
    }

    console.log(`Found invitation: school_id=${invitation.school_id}`)

    // Ensure admin can only revoke invitations from their own school
    if (invitation.school_id !== userProfile.school_id) {
      return NextResponse.json(
        { error: 'You can only revoke invitations from your own school' },
        { status: 403 }
      )
    }

    // Revoke the invitation
    await invitationService.revokeInvitation(invitationId)

    return NextResponse.json({
      message: 'Invitation revoked successfully'
    })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke invitation' },
      { status: 500 }
    )
  }
} 