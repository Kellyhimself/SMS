'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  School, 
  Users, 
  Shield, 
  Settings, 
  AlertTriangle, 
  BarChart3,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AdminNavProps {
  pendingCount?: number
}

export default function AdminNav({ pendingCount = 0 }: AdminNavProps) {
  const pathname = usePathname()
  const [stats, setStats] = useState({
    pendingSchools: 0,
    totalSchools: 0,
    totalUsers: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: schools } = await supabase
          .from('schools')
          .select('verification_status')

        const { data: users } = await supabase
          .from('users')
          .select('role')

        if (schools && users) {
          setStats({
            pendingSchools: schools.filter(s => s.verification_status === 'pending').length,
            totalSchools: schools.length,
            totalUsers: users.length
          })
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      }
    }

    fetchStats()
  }, [])

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Overview and statistics'
    },
    {
      href: '/admin/schools/pending',
      label: 'Pending Schools',
      icon: AlertTriangle,
      description: 'Review new registrations',
      badge: stats.pendingSchools,
      badgeColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      href: '/admin/schools',
      label: 'All Schools',
      icon: School,
      description: 'Manage all schools',
      badge: stats.totalSchools
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: Users,
      description: 'Manage system users',
      badge: stats.totalUsers
    },
    {
      href: '/admin/security',
      label: 'Security',
      icon: Shield,
      description: 'Security monitoring'
    },
    {
      href: '/admin/audit',
      label: 'Audit Logs',
      icon: Activity,
      description: 'View system audit trail'
    },
    {
      href: '/admin/settings',
      label: 'Admin Settings',
      icon: Settings,
      description: 'System configuration'
    }
  ]

  return (
    <nav className="space-y-2">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Admin Panel
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {item.label}
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className={item.badgeColor || ''}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 