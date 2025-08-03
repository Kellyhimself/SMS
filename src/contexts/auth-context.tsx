'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { User, School } from '@/types/auth'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  school: School | null
  isLoading: boolean
  isAuthenticated: boolean
  login: ReturnType<typeof useAuth>['login']
  register: ReturnType<typeof useAuth>['register']
  logout: ReturnType<typeof useAuth>['logout']
  updateSchool: (data: Partial<School>) => Promise<void>
  refreshSchool: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, school, isLoading, login, register, logout } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true)
    }
  }, [isLoading])

  // Handle auth state changes - exclude invitation acceptance page
  useEffect(() => {
    if (isInitialized) {
      // Check if we're on pages that don't require authentication
      const isPublicPage = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/accept-invitation/') ||
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register') ||
        window.location.pathname === '/'
      )
      
      if (!user && !isLoading && !isPublicPage) {
        // User is not authenticated and not on a public page
        toast.error('Please log in to continue')
      }
    }
  }, [user, isLoading, isInitialized])

  const updateSchool = async (data: Partial<School>) => {
    if (!school) throw new Error('No school selected')
    try {
      // Update school through auth hook
      await updateSchool(data)
    } catch (err) {
      toast.error('Failed to update school data')
      throw err
    }
  }

  const refreshSchool = async () => {
    if (!school) return
    // Refresh school data through auth hook
    await refreshSchool()
  }

  const value: AuthContextType = {
    user,
    school,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateSchool,
    refreshSchool,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
} 