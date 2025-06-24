'use server'

import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/services/notification.service'

interface SendBulkMessageParams {
  message: string
  type: 'sms' | 'email'
  recipientIds: string[]
  schoolId: string
}

interface SendBulkMessageResult {
  success: boolean
  error?: string
  stats?: {
    success: number
    failed: number
  }
}

export async function sendBulkMessage({
  message,
  type,
  recipientIds,
  schoolId
}: SendBulkMessageParams): Promise<SendBulkMessageResult> {
  try {
    console.log('[sendBulkMessage] Called with:', { message, type, recipientIds, schoolId })
    
    // Create server-side Supabase client with user's session
    const supabase = await createClient()
    
    // Check authenticated user
    const { data: userData } = await supabase.auth.getUser();
    console.log('[sendBulkMessage] Authenticated user:', userData?.user);
    if (!userData?.user) {
      throw new Error('User is not authenticated');
    }
    
    // Get recipients' contact information
    console.log('[sendBulkMessage] Fetching recipients from Supabase...')
    const { data: recipients, error: fetchError } = await supabase
      .from('students')
      .select('id, name, parent_phone, parent_email')
      .in('id', recipientIds)
      .eq('school_id', schoolId)

    console.log('[sendBulkMessage] Recipients fetch result:', { recipients, fetchError })
    if (fetchError) throw fetchError

    const stats = { success: 0, failed: 0 }
    const notificationService = NotificationService.getInstance()
    notificationService.setSchoolId(schoolId)

    // Send messages using NotificationService
    for (const recipient of recipients) {
      try {
        if (type === 'sms' && recipient.parent_phone) {
          await notificationService.sendSMS(recipient.parent_phone, message)
          stats.success++
        } else if (type === 'email' && recipient.parent_email) {
          await notificationService.sendEmail(
            recipient.parent_email,
            'School Communication',
            message
          )
          stats.success++
        } else {
          console.warn(`No valid contact method for ${recipient.name}`)
          stats.failed++
        }
      } catch (error) {
        console.error(`Failed to send ${type} to ${recipient.name}:`, error)
        stats.failed++
      }
    }

    return { 
      success: stats.failed === 0, 
      stats,
      error: stats.failed > 0 ? `Failed to send to ${stats.failed} recipients` : undefined
    }
  } catch (error: any) {
    console.error('[sendBulkMessage] Error:', error)
    return { 
      success: false, 
      error: error.message,
      stats: { success: 0, failed: 0 }
    }
  }
}

export async function getCommunications(schoolId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return data.map(notification => ({
      ...notification,
      createdAt: new Date(notification.created_at),
      sentAt: notification.sent_at ? new Date(notification.sent_at) : undefined
    }))
  } catch (error) {
    console.error('Failed to fetch communications:', error)
    throw error
  }
} 