import { createServerSupabaseClient } from '@/lib/supabase/config'
import AcceptInvitationClient from './AcceptInvitationClient'

export default async function AcceptInvitationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: invitationId } = await params
  
  // Fetch invitation data on the server using admin client to bypass RLS
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    console.log('Server-side invitation fetch result:', { invitation, error: invitationError })

    if (invitationError || !invitation) {
      return (
        <AcceptInvitationClient 
          invitationId={invitationId}
          initialInvitation={null}
          initialSchool={null}
          initialError="Invitation not found"
        />
      )
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return (
        <AcceptInvitationClient 
          invitationId={invitationId}
          initialInvitation={invitation}
          initialSchool={null}
          initialError="Invitation has expired"
        />
      )
    }

    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      return (
        <AcceptInvitationClient 
          invitationId={invitationId}
          initialInvitation={invitation}
          initialSchool={null}
          initialError="Invitation has already been accepted"
        />
      )
    }

    // Get school information using admin client
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', invitation.school_id)
      .single()

    if (schoolError || !school) {
      return (
        <AcceptInvitationClient 
          invitationId={invitationId}
          initialInvitation={invitation}
          initialSchool={null}
          initialError="School not found"
        />
      )
    }

    return (
      <AcceptInvitationClient 
        invitationId={invitationId}
        initialInvitation={invitation}
        initialSchool={school}
        initialError={null}
      />
    )
  } catch (error) {
    console.error('Error in AcceptInvitationPage:', error)
    return (
      <AcceptInvitationClient 
        invitationId={invitationId}
        initialInvitation={null}
        initialSchool={null}
        initialError="Failed to fetch invitation"
      />
    )
  }
} 