import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invitationService } from '@/services/invitation.service'
import type { AcceptInvitationDTO } from '@/types/invitation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params
    console.log('Accept invitation GET request for ID:', invitationId)
    
    const supabase = await createClient()
    
    // Note: We don't require authentication for GET requests since users need to view
    // the invitation before they can create their account
    
    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    console.log('Database query result:', { invitation, error: invitationError })

    if (invitationError) {
      console.error('Invitation fetch error:', invitationError)
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (!invitation) {
      console.log('No invitation found with ID:', invitationId)
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    console.log('Found invitation:', invitation)

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      console.log('Invitation is expired')
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      console.log('Invitation status is not pending:', invitation.status)
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Get school information
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', invitation.school_id)
      .single()

    if (schoolError || !school) {
      console.error('School fetch error:', schoolError)
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    console.log('Returning invitation and school data')
    return NextResponse.json({
      invitation,
      school
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params
    console.log('Accept invitation POST request for ID:', invitationId)
    
    const userData: AcceptInvitationDTO = await request.json()
    console.log('User data received:', { name: userData.name, invitation_id: userData.invitation_id })

    // Validate required fields
    if (!userData.name || !userData.password) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (userData.password.length < 6) {
      console.log('Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    console.log('Calling invitationService.acceptInvitation')
    
    // Accept the invitation
    const result = await invitationService.acceptInvitation(invitationId, {
      name: userData.name,
      password: userData.password
    })

    console.log('Invitation accepted successfully')

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      user: result.user,
      session: result.session
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    )
  }
} 