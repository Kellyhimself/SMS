import { createServerSupabaseClient } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/services/notification.service'
import type { 
  UserInvitation, 
  CreateInvitationDTO, 
  AcceptInvitationDTO, 
  InvitationFilters,
  InvitationStats 
} from '@/types/invitation'

export const invitationService = {
  async createInvitation(data: CreateInvitationDTO): Promise<UserInvitation> {
    const supabase = await createClient()
    
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .insert({
        email: data.email.toLowerCase().trim(),
        role: data.role,
        school_id: data.school_id,
        invited_by: data.invited_by,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invitation:', error)
      throw new Error(`Failed to create invitation: ${error.message}`)
    }

    // Send email notification
    try {
      await this.sendInvitationEmail(invitation)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't throw error here as invitation was created successfully
      // The email can be resent later
    }

    return invitation
  },

  async sendInvitationEmail(invitation: UserInvitation): Promise<void> {
    // Use server-side Supabase client for notification operations
    const supabase = await createClient()
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/accept-invitation/${invitation.id}`

    console.log('Sending invitation email with accept URL:', acceptUrl)

    const subject = 'You have been invited to join our School Management System'
    const text = `
Dear ${invitation.email},

You have been invited to join our School Management System as a ${invitation.role}.

Please click the following link to accept your invitation:
${acceptUrl}

This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.

If you have any questions, please contact your school administrator.

Best regards,
School Management System Team
    `.trim()

    // Create notification record using server-side client
    const notificationRecord = {
      type: 'email' as const,
      message: text,
      recipient_email: invitation.email,
      status: 'pending' as const,
      school_id: invitation.school_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationRecord)
      .select('id')
      .single()

    if (notificationError) {
      console.error('Error creating notification record:', notificationError)
      throw new Error(`Failed to create notification record: ${notificationError.message}`)
    }

    // Send email using Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: invitation.email,
        subject,
        text
      })

      if (!response || response.error) {
        throw new Error(response?.error?.message || 'Failed to send email')
      }

      // Update notification status to sent
      await supabase
        .from('notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id)

      console.log(`Invitation email sent successfully to ${invitation.email}`)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      
      // Update notification status to failed
      await supabase
        .from('notifications')
        .update({ 
          status: 'failed',
          error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id)
      
      throw emailError
    }
  },

  async acceptInvitation(invitationId: string, userData: { name: string; password: string }): Promise<{ user: any; session: any }> {
    const supabase = await createClient()
    const adminSupabase = createServerSupabaseClient()
    
    console.log('acceptInvitation called with ID:', invitationId)
    console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Use the getInvitationById function to get the invitation
    const invitation = await this.getInvitationById(invitationId)
    
    console.log('acceptInvitation: Retrieved invitation:', invitation)

    if (!invitation) {
      console.error('acceptInvitation: Invitation not found')
      throw new Error('Invalid or expired invitation')
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      console.error('acceptInvitation: Invitation status is not pending:', invitation.status)
      throw new Error('Invitation has already been accepted or is invalid')
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      throw new Error('Invitation has expired')
    }

    // Check if user already exists using admin client
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .single()

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Create the user account using admin client
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: invitation.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        school_id: invitation.school_id,
        role: invitation.role,
        name: userData.name,
        invited_by: invitation.invited_by,
        invitation_id: invitation.id
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user account')
    }

    // Create user profile using admin client
    const { error: profileError } = await adminSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: invitation.email,
        name: userData.name,
        role: invitation.role,
        school_id: invitation.school_id,
        invited_by: invitation.invited_by,
        invitation_id: invitation.id,
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    // Update invitation status using admin client
    const { error: updateError } = await adminSupabase
      .from('user_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating invitation status:', updateError)
      // Don't throw error here as user was created successfully
    }

    // Sign in the user to create a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password: userData.password
    })

    if (signInError) {
      console.error('Error signing in user:', signInError)
      throw new Error(`Failed to sign in user: ${signInError.message}`)
    }

    return {
      user: authData.user,
      session: signInData.session
    }
  },

  async listInvitations(filters: InvitationFilters = {}): Promise<UserInvitation[]> {
    const supabase = await createClient()
    
    console.log('listInvitations called with filters:', filters)
    
    let query = supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.school_id) {
      query = query.eq('school_id', filters.school_id)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.role) {
      query = query.eq('role', filters.role)
    }

    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`)
    }

    const { data: invitations, error } = await query

    console.log('Database query result:', { invitations, error })

    if (error) {
      console.error('Error fetching invitations:', error)
      throw new Error(`Failed to fetch invitations: ${error.message}`)
    }

    console.log('Returning invitations from service:', invitations || [])
    return invitations || []
  },

  async getInvitationStats(schoolId: string): Promise<InvitationStats> {
    const supabase = await createClient()
    
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select('status')
      .eq('school_id', schoolId)

    if (error) {
      console.error('Error fetching invitation stats:', error)
      throw new Error(`Failed to fetch invitation stats: ${error.message}`)
    }

    const stats: InvitationStats = {
      total: invitations?.length || 0,
      pending: invitations?.filter(i => i.status === 'pending').length || 0,
      accepted: invitations?.filter(i => i.status === 'accepted').length || 0,
      expired: invitations?.filter(i => i.status === 'expired').length || 0,
    }

    return stats
  },

  async revokeInvitation(invitationId: string): Promise<void> {
    const supabase = await createClient()
    
    // First check if the invitation exists
    const { data: invitation, error: fetchError } = await supabase
      .from('user_invitations')
      .select('id, status')
      .eq('id', invitationId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Invitation doesn't exist - this is fine for revocation
        console.log(`Invitation ${invitationId} not found - may have been already deleted`)
        return
      }
      console.error('Error fetching invitation for revocation:', fetchError)
      throw new Error(`Failed to fetch invitation: ${fetchError.message}`)
    }

    if (!invitation) {
      console.log(`Invitation ${invitationId} not found - may have been already deleted`)
      return
    }

    console.log(`Revoking invitation ${invitationId} with status: ${invitation.status}`)
    
    const { error } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) {
      console.error('Error revoking invitation:', error)
      throw new Error(`Failed to revoke invitation: ${error.message}`)
    }
  },

  async resendInvitation(invitationId: string): Promise<UserInvitation> {
    const supabase = await createClient()
    
    // Get the invitation without status filter to see what's happening
    const { data: invitation, error: fetchError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Invitation not found - this is an error for resending
        throw new Error('Invitation not found')
      }
      console.error('Error fetching invitation for resend:', fetchError)
      throw new Error(`Failed to fetch invitation: ${fetchError.message}`)
    }

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    // Log the invitation status for debugging
    console.log(`Invitation ${invitationId} status: ${invitation.status}`)

    // Only allow resending pending invitations
    if (invitation.status !== 'pending') {
      throw new Error(`Cannot resend invitation with status: ${invitation.status}. Only pending invitations can be resent.`)
    }

    // Update expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: updatedInvitation, error: updateError } = await supabase
      .from('user_invitations')
      .update({ 
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error resending invitation:', updateError)
      throw new Error(`Failed to resend invitation: ${updateError.message}`)
    }

    // Send email notification for resent invitation
    try {
      await this.sendInvitationEmail(updatedInvitation)
    } catch (emailError) {
      console.error('Failed to send resend invitation email:', emailError)
      // Don't throw error here as invitation was updated successfully
    }

    return updatedInvitation
  },

  async getInvitationByEmail(email: string, schoolId: string): Promise<UserInvitation | null> {
    const supabase = await createClient()
    
    console.log(`Looking for invitation: email=${email}, school_id=${schoolId}`)
    
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('school_id', schoolId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No invitation found for email=${email}, school_id=${schoolId}`)
        return null
      }
      console.error('Error fetching invitation:', error)
      throw new Error(`Failed to fetch invitation: ${error.message}`)
    }

    console.log(`Found invitation: id=${invitation?.id}, status=${invitation?.status}`)
    return invitation
  },

  async getInvitationById(invitationId: string): Promise<UserInvitation | null> {
    const adminSupabase = createServerSupabaseClient()
    
    const { data: invitation, error } = await adminSupabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching invitation by ID:', error)
      throw new Error(`Failed to fetch invitation: ${error.message}`)
    }

    return invitation
  },

  async debugGetAllInvitations(schoolId: string): Promise<any> {
    const supabase = await createClient()
    
    console.log('Debug: Getting all invitations for school:', schoolId)
    
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('school_id', schoolId)

    console.log('Debug: Raw database result:', { invitations, error })
    return { invitations, error }
  },

  async cleanupExpiredInvitations(): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('user_invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Error cleaning up expired invitations:', error)
      throw new Error(`Failed to cleanup expired invitations: ${error.message}`)
    }
  }
} 