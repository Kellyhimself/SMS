'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { parentAuthService } from '@/services/parent-auth.service'
import type { ParentAccount } from '@/types/parent'

interface ParentAuthContextType {
  parent: ParentAccount | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (phone: string, otp: string) => Promise<boolean>
  logout: () => Promise<void>
  sendOTP: (phone: string) => Promise<boolean>
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined)

export function ParentAuthProvider({ children }: { children: React.ReactNode }) {
  const [parent, setParent] = useState<ParentAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const sessionToken = localStorage.getItem('parent_session_token')
      console.log('🔍 Checking auth status, session token:', sessionToken ? 'exists' : 'not found')
      
      if (sessionToken) {
        const { valid, parent: parentData } = await parentAuthService.validateSession(sessionToken)
        console.log('🔍 Session validation result:', { valid, parent: parentData ? 'exists' : 'not found' })
        
        if (valid && parentData) {
          console.log('✅ Setting authenticated parent:', parentData)
          setParent(parentData)
        } else {
          console.log('❌ Session invalid, clearing token')
          // Session is invalid, clear it
          localStorage.removeItem('parent_session_token')
        }
      } else {
        console.log('❌ No session token found')
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      localStorage.removeItem('parent_session_token')
    } finally {
      setIsLoading(false)
    }
  }

  const sendOTP = async (phone: string): Promise<boolean> => {
    try {
      const result = await parentAuthService.sendOTP(phone)
      return result.success
    } catch (error) {
      console.error('Error sending OTP:', error)
      return false
    }
  }

  const login = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const result = await parentAuthService.verifyOTP(phone, otp)
      
      if (result.success && result.parent && result.session_token) {
        setParent(result.parent)
        localStorage.setItem('parent_session_token', result.session_token)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error logging in:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const sessionToken = localStorage.getItem('parent_session_token')
      if (sessionToken) {
        await parentAuthService.logout(sessionToken)
      }
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setParent(null)
      localStorage.removeItem('parent_session_token')
    }
  }

  const value: ParentAuthContextType = {
    parent,
    isLoading,
    isAuthenticated: !!parent,
    login,
    logout,
    sendOTP
  }

  return (
    <ParentAuthContext.Provider value={value}>
      {children}
    </ParentAuthContext.Provider>
  )
}

export function useParentAuth() {
  const context = useContext(ParentAuthContext)
  if (context === undefined) {
    throw new Error('useParentAuth must be used within a ParentAuthProvider')
  }
  return context
} 