import { supabase } from '@/lib/supabase/config'
import { getDB } from '@/lib/indexeddb/client'
import type { ParentAuth, ParentLoginResponse } from '@/types/parent'

// Development mode flag - set to true for FREE testing
const DEV_MODE = process.env.NODE_ENV === 'development'
const USE_SANDBOX = !process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME

export const parentAuthService = {
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔍 Starting OTP process for phone: ${phone}`)
      
      // Use the new API endpoint that handles server-side authentication
      const response = await fetch('/api/parent-auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      })

      const result = await response.json()
      console.log(`📱 OTP send result:`, result)

      return result
    } catch (error) {
      console.error('Error sending OTP:', error)
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      }
    }
  },

  async verifyOTP(phone: string, otp: string): Promise<ParentLoginResponse> {
    try {
      // Use the new API endpoint that handles server-side authentication
      const response = await fetch('/api/parent-auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp })
      })

      const result = await response.json()
      console.log(`🔐 OTP verification result:`, result)

      if (result.success && result.session_token) {
        // Store session in IndexedDB for offline access
        const db = await getDB()
        await db.put('parent_sessions', {
          id: result.session_token,
          parent_id: result.parent.id,
          phone: result.parent.phone,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
      }

      return result
    } catch (error) {
      console.error('Error verifying OTP:', error)
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      }
    }
  },

  async validateSession(sessionToken: string): Promise<{ valid: boolean; parent?: any }> {
    try {
      console.log('🔍 Validating session token:', sessionToken)
      
      // Use the new API endpoint for server-side validation
      const response = await fetch('/api/parent-auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken })
      })

      const result = await response.json()
      console.log('🔍 Session validation result:', result)

      if (result.success && result.valid && result.parent) {
        console.log('✅ Session valid, parent found')
        return { valid: true, parent: result.parent }
      } else {
        console.log('❌ Session invalid:', result.message)
        return { valid: false }
      }
    } catch (error) {
      console.error('Error validating session:', error)
      return { valid: false }
    }
  },

  async logout(sessionToken: string): Promise<void> {
    try {
      // Clear local session
      const db = await getDB()
      await db.delete('parent_sessions', sessionToken)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }
} 