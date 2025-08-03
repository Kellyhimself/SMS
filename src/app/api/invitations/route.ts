import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invitationService } from '@/services/invitation.service'
import type { CreateInvitationDTO, InvitationFilters } from '@/types/invitation'

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

    // Only admins can create invitations
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create invitations' },
        { status: 403 }
      )
    }

    const invitationData: CreateInvitationDTO = await request.json()

    // Validate required fields
    if (!invitationData.email || !invitationData.role || !invitationData.school_id) {
      return NextResponse.json(
        { error: 'Email, role, and school_id are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['teacher', 'parent', 'accountant'].includes(invitationData.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be teacher, parent, or accountant' },
        { status: 400 }
      )
    }

    // Ensure admin can only invite to their own school
    if (invitationData.school_id !== userProfile.school_id) {
      return NextResponse.json(
        { error: 'You can only invite users to your own school' },
        { status: 403 }
      )
    }

    // Check if invitation already exists for this email and school
    console.log(`Checking for existing invitation: email=${invitationData.email}, school_id=${invitationData.school_id}`)
    const existingInvitation = await invitationService.getInvitationByEmail(
      invitationData.email,
      invitationData.school_id
    )

    if (existingInvitation) {
      console.log(`Found existing invitation: id=${existingInvitation.id}, status=${existingInvitation.status}`)
      return NextResponse.json(
        { error: 'An invitation already exists for this email' },
        { status: 409 }
      )
    }

    console.log(`No existing invitation found, creating new one`)

    // Create the invitation
    const invitation = await invitationService.createInvitation({
      ...invitationData,
      invited_by: user.id
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

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

    // Only admins can list invitations
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view invitations' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: InvitationFilters = {
      school_id: userProfile.school_id, // Always filter by user's school
      status: searchParams.get('status') as any || undefined,
      role: searchParams.get('role') as any || undefined,
      email: searchParams.get('email') || undefined,
    }

    console.log('Fetching invitations with filters:', filters)

    // Debug: Get all invitations for this school
    const debugResult = await invitationService.debugGetAllInvitations(userProfile.school_id)
    console.log('Debug result:', debugResult)

    const invitations = await invitationService.listInvitations(filters)

    console.log('Returning invitations:', invitations)

    const response = NextResponse.json(invitations)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
} 