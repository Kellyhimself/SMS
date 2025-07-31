'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, school, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user || !school) {
    return null
  }

  // Map school from @/types/auth to @/types/school for Header
  const mappedSchool = {
    id: school.id,
    name: school.name,
    address: school.address ?? '',
    phone: school.phone ?? '',
    email: school.email,
    website: undefined,
    logo_url: undefined,
    created_at: (school.createdAt instanceof Date ? school.createdAt.toISOString() : String(school.createdAt)),
    updated_at: (school.updatedAt instanceof Date ? school.updatedAt.toISOString() : String(school.updatedAt)),
    payment_settings: school.payment_settings,
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - now handled by the Sidebar component itself */}
      <Sidebar />
      
      {/* Main Content Area - adjusted for persistent sidebar on desktop */}
      <div className="flex flex-1 flex-col w-full md:ml-64">
        <Header user={user} school={mappedSchool!} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
} 