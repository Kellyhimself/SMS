'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ParentAuthProvider, useParentAuth } from '@/contexts/parent-auth-context'

function ParentAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useParentAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/parent-login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ParentAuthProvider>
      <ParentAuthGuard>
        {children}
      </ParentAuthGuard>
    </ParentAuthProvider>
  )
} 